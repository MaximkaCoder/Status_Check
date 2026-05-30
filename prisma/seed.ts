/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Status } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  // ── Projects ──────────────────────────────────────────────────────────────
  const projectNames = [
    "Status Check MVP",
    "Веб-платформа",
    "Мобільний додаток",
    "Редизайн 2026",
    "API Gateway",
    "CRM система",
  ];

  await prisma.project.deleteMany({});
  for (const name of projectNames) {
    await prisma.project.create({ data: { name } });
  }
  console.log(`Seeded ${projectNames.length} projects.`);

  // ── Users ─────────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash("password123", 10);
  const users = [
    { name: "Олег Петренко",  email: "oleg@example.com"    },
    { name: "Марія Іванова",  email: "maria@example.com"   },
    { name: "Дмитро Коваль",  email: "dmytro@example.com"  },
    { name: "Аліна Бондар",   email: "alina@example.com"   },
    { name: "Ігор Мельник",   email: "igor@example.com"    },
    { name: "Наталія Шевченко", email: "natalia@example.com" },
    { name: "Андрій Лисенко", email: "andriy@example.com"  },
    { name: "Оксана Поліщук", email: "oksana@example.com"  },
    { name: "Руслан Гончар",  email: "ruslan@example.com"  },
    { name: "Юлія Савченко",  email: "yulia@example.com"   },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashed },
    });
  }
  console.log(`Seeded ${users.length} users (password: password123).`);

  // ── Status items ──────────────────────────────────────────────────────────
  await prisma.statusItem.deleteMany({});

  const items: {
    title: string;
    description?: string;
    deadline?: Date;
    status: Status;
    creator_name: string;
    project?: string;
    assignee?: string;
    reviewer?: string;
  }[] = [
    { title: "Q1 performance reviews",      description: "Complete all direct-report evaluations.",   deadline: daysFromNow(-21), status: "EXPIRED",  creator_name: "Олег Петренко",  project: "CRM система",        assignee: "Марія Іванова",   reviewer: "Дмитро Коваль" },
    { title: "Оновити privacy policy",       description: "Привести у відповідність до GDPR.",         deadline: daysFromNow(-14), status: "EXPIRED",  creator_name: "Марія Іванова",  project: "Веб-платформа",      assignee: "Аліна Бондар",    reviewer: "Ігор Мельник"  },
    { title: "Fix critical login bug",       description: "iOS 17 SSO issue — tracked in #482.",       deadline: daysFromNow(-7),  status: "EXPIRED",  creator_name: "Дмитро Коваль",  project: "Status Check MVP",   assignee: "Андрій Лисенко",  reviewer: "Олег Петренко" },
    { title: "Design system audit",          description: "Inventory UI components.",                   deadline: daysFromNow(-10), status: "DONE",     creator_name: "Аліна Бондар",   project: "Редизайн 2026",      assignee: "Оксана Поліщук",  reviewer: "Юлія Савченко" },
    { title: "Migrate staging DB to Neon",                                                              deadline: daysFromNow(-5),  status: "DONE",     creator_name: "Ігор Мельник",   project: "API Gateway",        assignee: "Руслан Гончар"                              },
    { title: "Implement NL search",          description: "Use Claude API to parse queries.",           deadline: daysFromNow(2),   status: "TO_CHECK", creator_name: "Андрій Лисенко", project: "Status Check MVP",   assignee: "Марія Іванова",   reviewer: "Олег Петренко" },
    { title: "Write integration tests",                                                                  deadline: daysFromNow(4),   status: "TO_CHECK", creator_name: "Наталія Шевченко", project: "API Gateway",       assignee: "Дмитро Коваль"                              },
    { title: "Responsive layout mobile",     description: "Fix calendar overflow < 375px.",             deadline: daysFromNow(6),   status: "TO_CHECK", creator_name: "Оксана Поліщук", project: "Веб-платформа",      assignee: "Аліна Бондар",    reviewer: "Наталія Шевченко" },
    { title: "Stakeholder demo v0.1",        description: "Live walkthrough for leadership.",            deadline: daysFromNow(10),  status: "TO_CHECK", creator_name: "Олег Петренко",  project: "Status Check MVP",   assignee: "Юлія Савченко",   reviewer: "Ігор Мельник"  },
    { title: "User onboarding guide",        description: "Short guide on creating items.",             deadline: daysFromNow(15),  status: "TO_CHECK", creator_name: "Юлія Савченко",  project: "Status Check MVP"                                                        },
    { title: "Set up error monitoring",      description: "Sentry for frontend + API.",                 deadline: daysFromNow(18),  status: "TO_CHECK", creator_name: "Руслан Гончар",  project: "API Gateway",        assignee: "Андрій Лисенко"                             },
    { title: "Localize email notifications",                                                             deadline: daysFromNow(22),  status: "TO_CHECK", creator_name: "Юлія Савченко",  project: "Веб-платформа",      assignee: "Наталія Шевченко", reviewer: "Марія Іванова" },
    { title: "Plan Q3 roadmap",              description: "Align with PM on next quarter priorities.",  deadline: daysFromNow(30),  status: "TO_CHECK", creator_name: "Олег Петренко",  project: "CRM система"                                                             },
    { title: "Мобільна навігація",           description: "Bottom tab bar для iOS та Android.",         deadline: daysFromNow(12),  status: "TO_CHECK", creator_name: "Аліна Бондар",   project: "Мобільний додаток",  assignee: "Дмитро Коваль",   reviewer: "Оксана Поліщук" },
    { title: "Dark mode у мобільці",                                                                     deadline: daysFromNow(20),  status: "TO_CHECK", creator_name: "Ігор Мельник",   project: "Мобільний додаток",  assignee: "Руслан Гончар"                              },
    { title: "Концепт нового лендінгу",      description: "Ідея для повного редизайну головної.",                                   status: "IDEAS_BACKLOG", creator_name: "Оксана Поліщук", project: "Редизайн 2026"                                               },
    { title: "AI автозаповнення форм",       description: "Використати LLM для підказок у формах.",                                  status: "IDEAS_BACKLOG", creator_name: "Андрій Лисенко", project: "Status Check MVP"                                            },
    { title: "Старий модуль звітності",      description: "Замінений новим дашбордом.",                 deadline: daysFromNow(-30), status: "NOT_ACTUAL", creator_name: "Марія Іванова",  project: "CRM система"                                                     },
  ];

  for (const item of items) {
    await prisma.statusItem.create({ data: item });
  }
  console.log(`Seeded ${items.length} status items.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
