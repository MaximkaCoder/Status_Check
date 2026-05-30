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
      deadline: daysFromNow(-21),
      status: "OVERDUE",
      creator_name: "Alice",
    },
    {
      title: "Update privacy policy",
      description: "Align with GDPR changes from last quarter.",
      deadline: daysFromNow(-14),
      status: "OVERDUE",
      creator_name: "Bob",
    },
    {
      title: "Fix critical login bug",
      description: "Users on iOS 17 cannot log in via SSO — tracked in #482.",
      deadline: daysFromNow(-7),
      status: "OVERDUE",
      creator_name: "Carol",
    },
    {
      title: "Audit third-party dependencies",
      description: "Check for known CVEs in npm packages.",
      deadline: daysFromNow(-4),
      status: "OVERDUE",
      creator_name: "Dave",
    },
    {
      title: "Design system audit",
      description: "Inventory all existing UI components and flag inconsistencies.",
      deadline: daysFromNow(-10),
      status: "DONE",
      creator_name: "Dave",
    },
    {
      title: "Migrate staging DB to Neon",
      deadline: daysFromNow(-5),
      status: "DONE",
      creator_name: "Alice",
    },
    {
      title: "Deploy MVP to Vercel",
      description: "Set up project, add env vars, run prisma migrate deploy.",
      deadline: daysFromNow(-2),
      status: "DONE",
      creator_name: "Eve",
    },
    {
      title: "Implement NL search for dashboard",
      description: "Use Claude API to parse free-text queries into filter params.",
      deadline: daysFromNow(2),
      status: "IN_PROGRESS",
      creator_name: "Carol",
    },
    {
      title: "Write integration tests for /api/items",
      deadline: daysFromNow(4),
      status: "IN_PROGRESS",
      creator_name: "Bob",
    },
    {
      title: "Responsive layout for mobile",
      description: "Fix calendar overflow on screens < 375px.",
      deadline: daysFromNow(6),
      status: "IN_PROGRESS",
      creator_name: "Alice",
    },
    {
      title: "Stakeholder demo — v0.1",
      description: "Live walkthrough of calendar + CRUD + AI input for leadership.",
      deadline: daysFromNow(10),
      status: "PENDING",
      creator_name: "Alice",
    },
    {
      title: "Write user onboarding guide",
      description: "Short guide covering how to create items and interpret statuses.",
      deadline: daysFromNow(15),
      status: "PENDING",
      creator_name: "Carol",
    },
    {
      title: "Set up error monitoring",
      description: "Integrate Sentry for frontend + API error tracking.",
      deadline: daysFromNow(18),
      status: "PENDING",
      creator_name: "Bob",
    },
    {
      title: "Localize email notifications",
      description: "Add Ukrainian translations to all outbound email templates.",
      deadline: daysFromNow(22),
      status: "PENDING",
      creator_name: "Eve",
    },
    {
      title: "Plan Q3 roadmap",
      description: "Align with PM and design on priorities for next quarter.",
      deadline: daysFromNow(30),
      status: "PENDING",
      creator_name: "Dave",
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
