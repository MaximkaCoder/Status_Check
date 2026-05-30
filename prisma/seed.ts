/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Status } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.statusItem.deleteMany({});

  const items: {
    title: string;
    description?: string;
    deadline: Date;
    status: Status;
    creator_name: string;
  }[] = [
    {
      title: "Q1 performance reviews",
      description: "Complete all direct-report evaluations and submit to HR.",
      deadline: daysFromNow(-14),
      status: "OVERDUE",
      creator_name: "Alice",
    },
    {
      title: "Update privacy policy",
      description: "Align with GDPR changes from last quarter.",
      deadline: daysFromNow(-7),
      status: "OVERDUE",
      creator_name: "Bob",
    },
    {
      title: "Fix critical login bug",
      description: "Users on iOS 17 cannot log in via SSO — tracked in #482.",
      deadline: daysFromNow(-3),
      status: "OVERDUE",
      creator_name: "Carol",
    },
    {
      title: "Design system audit",
      description: "Inventory all existing UI components and flag inconsistencies.",
      deadline: daysFromNow(-5),
      status: "DONE",
      creator_name: "Dave",
    },
    {
      title: "Migrate staging DB to Neon",
      deadline: daysFromNow(-1),
      status: "DONE",
      creator_name: "Alice",
    },
    {
      title: "Implement NL search for dashboard",
      description: "Use Claude API to parse free-text queries into filter params.",
      deadline: daysFromNow(3),
      status: "IN_PROGRESS",
      creator_name: "Carol",
    },
    {
      title: "Write integration tests for /api/items",
      deadline: daysFromNow(5),
      status: "IN_PROGRESS",
      creator_name: "Bob",
    },
    {
      title: "Deploy MVP to Vercel",
      description: "Set up project, add env vars, run prisma migrate deploy.",
      deadline: daysFromNow(7),
      status: "DONE",
      creator_name: "Dave",
    },
    {
      title: "Stakeholder demo — v0.1",
      description: "Live walkthrough of calendar + CRUD + AI input for leadership.",
      deadline: daysFromNow(12),
      status: "PENDING",
      creator_name: "Alice",
    },
    {
      title: "Write user onboarding guide",
      description: "Short guide covering how to create items and interpret statuses.",
      deadline: daysFromNow(18),
      status: "PENDING",
      creator_name: "Carol",
    },
  ];

  for (const item of items) {
    await prisma.statusItem.create({ data: item });
  }

  console.log(`Seeded ${items.length} status items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
