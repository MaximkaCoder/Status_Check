import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: { id: string } };

async function canAccess(userId: string, userName: string, isAdmin: boolean, itemId: string) {
  const item = await prisma.statusItem.findUnique({ where: { id: itemId } });
  if (!item) return { item: null, allowed: false };
  if (isAdmin) return { item, allowed: true };
  if (item.creator_name === userName || item.assignee === userName || item.reviewer === userName)
    return { item, allowed: true };
  if (item.project) {
    const membership = await prisma.projectMember.findFirst({
      where: { userId, project: { name: item.project } },
    });
    return { item, allowed: !!membership };
  }
  return { item, allowed: false };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await canAccess(session.userId, session.name, session.isAdmin ?? false, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const files = await prisma.itemFile.findMany({
    where: { itemId: params.id },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item, allowed } = await canAccess(session.userId, session.name, session.isAdmin ?? false, params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Максимальний розмір файлу 20 МБ" }, { status: 413 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Файлове сховище не налаштовано (BLOB_READ_WRITE_TOKEN)" }, { status: 503 });
  }

  try {
    const blob = await put(`items/${params.id}/${Date.now()}-${file.name}`, file, { access: "public" });
    const record = await prisma.itemFile.create({
      data: { itemId: params.id, name: file.name, url: blob.url, size: file.size },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    console.error("Item file upload error:", e);
    return NextResponse.json({ error: "Помилка завантаження файлу" }, { status: 500 });
  }
}
