import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Max 20 MB" }, { status: 413 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Файлове сховище не налаштовано (BLOB_READ_WRITE_TOKEN)" }, { status: 503 });
  }

  try {
    const blob = await put(`projects/${params.id}/${Date.now()}-${file.name}`, file, { access: "public" });
    const record = await prisma.projectFile.create({
      data: { projectId: params.id, name: file.name, url: blob.url, size: file.size },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    console.error("File upload error:", e);
    return NextResponse.json({ error: "Помилка завантаження файлу" }, { status: 500 });
  }
}
