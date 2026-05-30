import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateStatusSchema } from "@/lib/validations";

type RouteParams = { params: { id: string } };

// ---------------------------------------------------------------------------
// PATCH /api/items/[id]/status
// Body: { status: "PENDING" | "IN_PROGRESS" | "DONE" }
// Note: OVERDUE cannot be set manually — it is auto-set by the system.
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
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

    const parseResult = UpdateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message, code: "VALIDATION_ERROR", field: firstIssue.path.join(".") },
        { status: 400 }
      );
    }

    const { status } = parseResult.data;

    // OVERDUE is auto-only; block manual assignment
    if (status === "OVERDUE") {
      return NextResponse.json(
        {
          error: "Status OVERDUE can only be set automatically, not manually",
          code: "INVALID_STATUS_TRANSITION",
        },
        { status: 400 }
      );
    }

    // Block OVERDUE → PENDING
    if (existing.status === "OVERDUE" && status === "PENDING") {
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
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/items/${params.id}/status error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
