import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateItemSchema, GetItemsQuerySchema } from "@/lib/validations";

// ---------------------------------------------------------------------------
// Helper — run auto-expire in a single UPDATE query
// ---------------------------------------------------------------------------
async function autoExpireOverdue(): Promise<void> {
  await prisma.statusItem.updateMany({
    where: {
      deadline: { lt: new Date() },
      status: { in: ["PENDING"] },
    },
    data: {
      status: "OVERDUE",
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

    // Auto-expire before reading
    await autoExpireOverdue();

    // Build where clause
    type WhereClause = {
      status?: { in: ("PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE")[] };
      deadline?: { gte: Date; lte: Date };
    };
    const where: WhereClause = {};

    if (statusParam) {
      const statusValues = statusParam.split(",").map((s) => s.trim());
      // Validate each value against enum
      const validStatuses = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE"] as const;
      const invalid = statusValues.find((s) => !validStatuses.includes(s as (typeof validStatuses)[number]));
      if (invalid) {
        return NextResponse.json(
          { error: `Invalid status value: ${invalid}`, code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      where.status = { in: statusValues as ("PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE")[] };
    }

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, monthNum, 0, 23, 59, 59, 999); // last day of month
      where.deadline = { gte: start, lte: end };
    }

    const items = await prisma.statusItem.findMany({
      where,
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json(items);
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

    const { title, description, deadline, creator_name } = parseResult.data;

    const item = await prisma.statusItem.create({
      data: {
        title,
        description: description ?? null,
        deadline: new Date(deadline),
        creator_name,
        status: "PENDING",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
