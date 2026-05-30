import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateStatusSchema } from "@/lib/validations";

type RouteParams = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const existing = await prisma.statusItem.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found", code: "NOT_FOUND" }, { status: 404 });
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

    const updated = await prisma.statusItem.update({
      where: { id: params.id },
      data: { status: parseResult.data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/items/${params.id}/status error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
