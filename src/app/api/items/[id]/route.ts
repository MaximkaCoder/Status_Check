import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UpdateItemSchema } from "@/lib/validations";
import type { StatusItem } from "@prisma/client";
import { notifyAssignees } from "@/lib/notify";

async function canView(userId: string, userName: string, isAdmin: boolean, item: StatusItem): Promise<boolean> {
  if (isAdmin) return true;
  if (item.creator_name === userName || item.assignee === userName || item.reviewer === userName) return true;
  if (item.project) {
    const membership = await prisma.projectMember.findFirst({
      where: { userId, project: { name: item.project } },
    });
    return !!membership;
  }
  return false;
}

function canModify(userName: string, isAdmin: boolean, item: StatusItem): boolean {
  if (isAdmin) return true;
  return item.creator_name === userName ||
         item.assignee === userName ||
         item.reviewer === userName;
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
    if (!item) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const allowed = await canView(session.userId, session.name, session.isAdmin ?? false, item);
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
    if (!existing) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (!canModify(session.name, session.isAdmin ?? false, existing)) {
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

    const updated = await prisma.statusItem.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.creator_name !== undefined && { creator_name: data.creator_name }),
        ...(data.project  !== undefined && { project:  data.project }),
        ...(data.assignee !== undefined && { assignee: data.assignee }),
        ...(data.reviewer !== undefined && { reviewer: data.reviewer }),
        ...doneFields,
      },
    });

    // Notify only when assignee/reviewer actually changed
    const newAssignee = data.assignee !== undefined ? data.assignee : existing.assignee;
    const newReviewer = data.reviewer !== undefined ? data.reviewer : existing.reviewer;
    const assigneeChanged = data.assignee !== undefined && data.assignee !== existing.assignee;
    const reviewerChanged = data.reviewer !== undefined && data.reviewer !== existing.reviewer;
    notifyAssignees(updated.id, updated.title, newAssignee, newReviewer, assigneeChanged, reviewerChanged).catch(() => {});

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
    if (!existing) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (!canModify(session.name, session.isAdmin ?? false, existing)) {
      return NextResponse.json({ error: "You do not have permission to delete this item", code: "FORBIDDEN" }, { status: 403 });
    }

    await prisma.statusItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
