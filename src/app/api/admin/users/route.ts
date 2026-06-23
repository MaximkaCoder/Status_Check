import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, isAdmin: true, blocked: true, created_at: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { name, email, password, isAdmin } = await req.json();
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Ім'я, email та пароль обов'язкові" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль мінімум 6 символів" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email вже використовується" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: hashed, isAdmin: !!isAdmin },
    select: { id: true, name: true, email: true, isAdmin: true },
  });
  return NextResponse.json(user, { status: 201 });
}
