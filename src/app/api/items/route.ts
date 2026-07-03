import { NextRequest, NextResponse } from "next/server";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { CreateItemSchema, GetItemsQuerySchema } from "@/lib/validations";
import { notifyAssignees } from "@/lib/notify";
import { logActivity } from "@/lib/activity";
import { lookupUserByName } from "@/lib/user-lookup";

// ---------------------------------------------------------------------------
// Helper — run auto-expire in a single UPDATE query
// ---------------------------------------------------------------------------
async function autoExpireOverdue(): Promise<void> {
  await prisma.statusItem.updateMany({
    where: {
      deadline: { lt: new Date() },
      status: { in: ["TO_CHECK"] },
      deleted_at: null,
    },
    data: {
      status: "EXPIRED",
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/items
// Query params:
//   status  — comma-separated Status values, e.g. "PENDING,DONE"
//   month   — YYYY-MM, filters deadline within that calendar month
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawQuery = {
      status: searchParams.get("status") ?? undefined,
      month: searchParams.get("month") ?? undefined,
    };

    const queryResult = GetItemsQuerySchema.safeParse(rawQuery);
    if (!queryResult.success) {
      return NextResponse.json(
        { error: queryResult.error.issues[0].message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { status: statusParam, month } = queryResult.data;
    const take = Math.min(Math.max(Number(searchParams.get("take")) || 200, 1), 500);
    const cursor = searchParams.get("cursor") ?? undefined;

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    // Auto-expire before reading
    await autoExpireOverdue();

    // Build where clause
    const where: Prisma.StatusItemWhereInput = { deleted_at: null };

    if (statusParam) {
      const statusValues = statusParam.split(",").map((s) => s.trim());
      const validStatuses = ["TO_CHECK", "EXPIRED", "DONE", "NOT_ACTUAL", "IDEAS_BACKLOG"] as const;
      const invalid = statusValues.find((s) => !validStatuses.includes(s as (typeof validStatuses)[number]));
      if (invalid) {
        return NextResponse.json(
          { error: `Invalid status value: ${invalid}`, code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      where.status = { in: statusValues as ("TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG")[] };
    }

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
      where.deadline = { gte: start, lte: end };
    }

    // Non-admins see only items where they are creator/assignee/reviewer or member of the project
    if (!session.isAdmin) {
      const memberProjects = await prisma.projectMember.findMany({
        where: { userId: session.userId },
        include: { project: { select: { name: true } } },
      });
      const memberProjectNames = memberProjects.map((mp) => mp.project.name);

      const visibilityFilter: Prisma.StatusItemWhereInput = {
        OR: [
          // ID match first; name match kept for rows created before the FK backfill
          { creator_id: session.userId },
          { assigneeId: session.userId },
          { reviewerId: session.userId },
          { creator_name: session.name },
          { assignee: session.name },
          { reviewer: session.name },
          ...(memberProjectNames.length > 0 ? [{ project: { in: memberProjectNames } }] : []),
        ],
      };
      where.AND = [visibilityFilter];
    }

    const rows = await prisma.statusItem.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Attach comment stats (total + unread per current user) and subtask progress
    if (items.length > 0) {
      const itemIds = items.map((i) => i.id);
      const [stats, subtaskStats] = await Promise.all([
        prisma.$queryRaw<Array<{ itemId: string; commentCount: number; unreadCount: number }>>`
          SELECT
            c."itemId",
            COUNT(*)::int AS "commentCount",
            COUNT(CASE WHEN c.created_at > COALESCE(ics.seen_at, '1970-01-01'::timestamptz) AND c."authorId" != ${session.userId} THEN 1 END)::int AS "unreadCount"
          FROM comments c
          LEFT JOIN item_comment_seen ics
            ON ics."itemId" = c."itemId" AND ics."userId" = ${session.userId}
          WHERE c."itemId" = ANY(${itemIds})
          GROUP BY c."itemId", ics.seen_at
        `,
        prisma.$queryRaw<Array<{ itemId: string; subtaskCount: number; subtaskDone: number }>>`
          SELECT
            "itemId",
            COUNT(*)::int AS "subtaskCount",
            COUNT(CASE WHEN done THEN 1 END)::int AS "subtaskDone"
          FROM subtasks
          WHERE "itemId" = ANY(${itemIds})
          GROUP BY "itemId"
        `,
      ]);
      const statsMap = new Map(stats.map((s) => [s.itemId, s]));
      const subtaskMap = new Map(subtaskStats.map((s) => [s.itemId, s]));
      const enriched = items.map((item) => {
        const s = statsMap.get(item.id);
        const st = subtaskMap.get(item.id);
        return {
          ...item,
          ...(s && { commentCount: s.commentCount, unreadCount: s.unreadCount }),
          ...(st && { subtaskCount: st.subtaskCount, subtaskDone: st.subtaskDone }),
        };
      });
      return NextResponse.json({ items: enriched, nextCursor });
    }

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/items
// Body: { title, description?, deadline, creator_name }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const parseResult = CreateItemSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message, code: "VALIDATION_ERROR", field: firstIssue.path.join(".") },
        { status: 400 }
      );
    }

    const { title, description, deadline, creator_name, project, assignee, reviewer, priority } = parseResult.data;

    const session = await getSession();
    const resolvedName = session?.name ?? creator_name;

    const [assigneeUser, reviewerUser] = await Promise.all([
      lookupUserByName(assignee),
      lookupUserByName(reviewer),
    ]);

    const item = await prisma.statusItem.create({
      data: {
        title,
        description: description ?? null,
        deadline: deadline ? new Date(deadline) : null,
        creator_name: resolvedName,
        creator_id: session?.userId ?? null,
        project:  project  ?? null,
        assignee: assignee ?? null,
        reviewer: reviewer ?? null,
        assigneeId: assigneeUser?.id ?? null,
        reviewerId: reviewerUser?.id ?? null,
        department: assigneeUser?.department ?? null,
        priority: priority ?? "MEDIUM",
        status: "TO_CHECK",
      },
    });

    // Awaited: serverless freezes right after the response, killing floating promises.
    // Errors are still swallowed so notification failures never break the request.
    await notifyAssignees(item.id, item.title, assignee, reviewer, !!assignee, !!reviewer).catch(() => {});
    await logActivity(item.id, session?.userId ?? null, resolvedName, [{ action: "CREATED" }]).catch(() => {});

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
