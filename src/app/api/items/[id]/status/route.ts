import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { UpdateStatusSchema } from "@/lib/validations";
import { notifyStatusChange } from "@/lib/notify";

type RouteParams = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const existing = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const isAdmin = session.isAdmin ?? false;
    const isCreator = existing.creator_id
      ? existing.creator_id === session.userId
      : existing.creator_name === session.name;
    const canModify = isAdmin ||
      isCreator ||
      existing.assignee === session.name ||
      existing.reviewer === session.name;
    if (!canModify) {
      return NextResponse.json({ error: "You do not have permission to change this item's status", code: "FORBIDDEN" }, { status: 403 });
    }

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, { status: 400 }); }

    const parseResult = UpdateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const newStatus = parseResult.data.status;
    const doneFields =
      newStatus === "DONE" && existing.status !== "DONE"
        ? { done_at: new Date(), done_by: session.name }
        : newStatus !== "DONE" && existing.status === "DONE"
        ? { done_at: null, done_by: null }
        : {};

    const updated = await prisma.statusItem.update({
      where: { id: params.id },
      data: { status: newStatus, ...doneFields },
    });

    notifyStatusChange(
      updated.id, updated.title, updated.assignee, updated.reviewer, updated.creator_name, newStatus, session.name
    ).catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/items/${params.id}/status error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
