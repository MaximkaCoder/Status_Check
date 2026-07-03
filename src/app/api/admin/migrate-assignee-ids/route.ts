import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

// Backfill assignee_id / reviewer_id from the legacy name columns.
// Idempotent — only touches rows where the id is still NULL.
export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const assignees = await prisma.$executeRawUnsafe(`
    UPDATE status_items si
    SET assignee_id = u.id
    FROM users u
    WHERE u.name = si.assignee
      AND si.assignee IS NOT NULL
      AND si.assignee_id IS NULL
  `);

  const reviewers = await prisma.$executeRawUnsafe(`
    UPDATE status_items si
    SET reviewer_id = u.id
    FROM users u
    WHERE u.name = si.reviewer
      AND si.reviewer IS NOT NULL
      AND si.reviewer_id IS NULL
  `);

  return NextResponse.json({ assigneesUpdated: assignees, reviewersUpdated: reviewers });
}
