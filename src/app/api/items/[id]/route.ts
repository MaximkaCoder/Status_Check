import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { UpdateItemSchema } from "@/lib/validations";
import type { StatusItem } from "@prisma/client";
import { notifyAssignees } from "@/lib/notify";
import { logActivity, type ActivityEntry } from "@/lib/activity";
import { canModifyItem, canViewItemDirect, type SessionLike } from "@/lib/permissions";
import { lookupUserByName } from "@/lib/user-lookup";

async function canView(s: SessionLike, item: StatusItem): Promise<boolean> {
  const direct = canViewItemDirect(s, item);
  if (direct !== "project") return direct;
  const membership = await prisma.projectMember.findFirst({
    where: { userId: s.userId, project: { name: item.project! } },
  });
  return !!membership;
}

// ---------------------------------------------------------------------------
// Resolve segment params — Next.js 14 App Router
// ---------------------------------------------------------------------------
type RouteParams = { params: { id: string } };

// ---------------------------------------------------------------------------
// GET /api/items/[id]
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const item = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!item || item.deleted_at) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const allowed = await canView({ userId: session.userId, name: session.name, isAdmin: session.isAdmin ?? false }, item);
    if (!allowed) {
      return NextResponse.json({ error: "У вас немає доступу до цього завдання", code: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error(`GET /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/items/[id]
// Body: { title?, description?, deadline?, status?, creator_name? }
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const existing = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (!canModifyItem({ userId: session.userId, name: session.name, isAdmin: session.isAdmin ?? false }, existing)) {
      return NextResponse.json({ error: "You do not have permission to edit this item", code: "FORBIDDEN" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const parseResult = UpdateItemSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message, code: "VALIDATION_ERROR", field: firstIssue.path.join(".") },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const doneFields =
      data.status === "DONE" && existing.status !== "DONE"
        ? { done_at: new Date(), done_by: session.name }
        : data.status !== undefined && data.status !== "DONE" && existing.status === "DONE"
        ? { done_at: null, done_by: null }
        : {};

    let assigneeUpdate: { assignee: string | null; assigneeId: string | null; department: string | null } | undefined;
    if (data.assignee !== undefined) {
      const u = await lookupUserByName(data.assignee);
      assigneeUpdate = { assignee: data.assignee ?? null, assigneeId: u?.id ?? null, department: u?.department ?? null };
    }
    let reviewerUpdate: { reviewer: string | null; reviewerId: string | null } | undefined;
    if (data.reviewer !== undefined) {
      const u = await lookupUserByName(data.reviewer);
      reviewerUpdate = { reviewer: data.reviewer ?? null, reviewerId: u?.id ?? null };
    }

    const updated = await prisma.statusItem.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.creator_name !== undefined && { creator_name: data.creator_name }),
        ...(data.project  !== undefined && { project:  data.project }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...assigneeUpdate,
        ...reviewerUpdate,
        ...doneFields,
      },
    });

    // Notify only when assignee/reviewer actually changed
    const newAssignee = data.assignee !== undefined ? data.assignee : existing.assignee;
    const newReviewer = data.reviewer !== undefined ? data.reviewer : existing.reviewer;
    const assigneeChanged = data.assignee !== undefined && data.assignee !== existing.assignee;
    const reviewerChanged = data.reviewer !== undefined && data.reviewer !== existing.reviewer;
    // Awaited: serverless freezes right after the response, killing floating promises.
    await notifyAssignees(updated.id, updated.title, newAssignee, newReviewer, assigneeChanged, reviewerChanged).catch(() => {});

    // Activity log — record each changed field
    const acts: ActivityEntry[] = [];
    const norm = (v: string | null | undefined) => (v ?? "");
    if (data.title !== undefined && data.title !== existing.title)
      acts.push({ action: "FIELD_CHANGED", field: "title", oldValue: existing.title, newValue: data.title });
    if (data.description !== undefined && norm(data.description) !== norm(existing.description))
      acts.push({ action: "FIELD_CHANGED", field: "description", oldValue: existing.description, newValue: data.description ?? null });
    if (data.status !== undefined && data.status !== existing.status)
      acts.push({ action: "STATUS_CHANGED", field: "status", oldValue: existing.status, newValue: data.status });
    if (data.priority !== undefined && data.priority !== existing.priority)
      acts.push({ action: "FIELD_CHANGED", field: "priority", oldValue: existing.priority, newValue: data.priority });
    if (data.project !== undefined && norm(data.project) !== norm(existing.project))
      acts.push({ action: "FIELD_CHANGED", field: "project", oldValue: existing.project, newValue: data.project ?? null });
    if (data.assignee !== undefined && norm(data.assignee) !== norm(existing.assignee))
      acts.push({ action: "FIELD_CHANGED", field: "assignee", oldValue: existing.assignee, newValue: data.assignee ?? null });
    if (data.reviewer !== undefined && norm(data.reviewer) !== norm(existing.reviewer))
      acts.push({ action: "FIELD_CHANGED", field: "reviewer", oldValue: existing.reviewer, newValue: data.reviewer ?? null });
    if (data.deadline !== undefined) {
      const oldD = existing.deadline ? existing.deadline.toISOString() : null;
      const newD = data.deadline ? new Date(data.deadline).toISOString() : null;
      if (oldD !== newD)
        acts.push({ action: "FIELD_CHANGED", field: "deadline", oldValue: oldD, newValue: newD });
    }
    await logActivity(updated.id, session.userId, session.name, acts).catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PUT /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/items/[id]
// Alias for PUT — same logic, accepted for frontend convenience
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest, context: RouteParams) {
  return PUT(request, context);
}

// ---------------------------------------------------------------------------
// DELETE /api/items/[id]
// ---------------------------------------------------------------------------
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const existing = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (!canModifyItem({ userId: session.userId, name: session.name, isAdmin: session.isAdmin ?? false }, existing)) {
      return NextResponse.json({ error: "You do not have permission to delete this item", code: "FORBIDDEN" }, { status: 403 });
    }

    // Soft delete — restorable from /archive, purged by cron after 30 days
    await prisma.statusItem.update({ where: { id: params.id }, data: { deleted_at: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
