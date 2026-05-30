import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateItemSchema } from "@/lib/validations";

// ---------------------------------------------------------------------------
// Resolve segment params — Next.js 14 App Router
// ---------------------------------------------------------------------------
type RouteParams = { params: { id: string } };

// ---------------------------------------------------------------------------
// GET /api/items/[id]
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const item = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
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
    // Check existence first
    const existing = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
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

    // Status transition rules:
    // - OVERDUE cannot be set by the user (auto-only)
    if (data.status === "OVERDUE") {
      return NextResponse.json(
        { error: "Status OVERDUE can only be set automatically, not manually", code: "INVALID_STATUS_TRANSITION" },
        { status: 400 }
      );
    }

    // - If item is currently OVERDUE, user may only transition to DONE or IN_PROGRESS
    if (existing.status === "OVERDUE" && data.status && data.status === "PENDING") {
      return NextResponse.json(
        {
          error: "Overdue items cannot be set back to PENDING; use IN_PROGRESS or DONE",
          code: "INVALID_STATUS_TRANSITION",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.statusItem.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline !== undefined && { deadline: new Date(data.deadline) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.creator_name !== undefined && { creator_name: data.creator_name }),
      },
    });

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
    const existing = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.statusItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
