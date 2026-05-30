# Status Check

A shared commitment and deadline tracker — know what everyone is working on, when it's due, and whether it's on track.

**Live demo → [status-check-henna.vercel.app](https://status-check-henna.vercel.app)**

---

## Screenshots

### Desktop — Light mode
![Desktop light](https://status-check-henna.vercel.app/screenshots/ss-dashboard-light.png)

### Desktop — Dark mode
![Desktop dark](https://status-check-henna.vercel.app/screenshots/ss-dashboard-dark.png)

### Mobile — Light mode
![Mobile light](https://status-check-henna.vercel.app/screenshots/ss-mobile-light.png)

### Mobile — Dark mode
![Mobile dark](https://status-check-henna.vercel.app/screenshots/ss-mobile-dark.png)

### Create new item (AI smart input)
![New item](https://status-check-henna.vercel.app/screenshots/ss-new-item.png)

---

## Layout modes

### Desktop (landscape)
On wide screens the layout splits into two columns:
- **Left** — calendar and donut stats panel, **sticky** while you scroll
- **Right** — filter chips and task list, scrollable independently

Changing a task's status never jumps the scroll position — updates happen optimistically and sync silently in the background.

### Mobile (portrait)
Single-column stack. A **scroll-to-top button** appears in the bottom-right corner after scrolling 300 px — liquid-glass style, fades in smoothly and returns you to the top in one tap.

---

## AI smart input

When creating a task you can describe it in plain language — the parser extracts the title and deadline automatically.

**Examples:**
- `Deploy to production by next Friday`
- `Зустріч з командою через тиждень`
- `Board review on June 10`

Powered by **chrono-node** — no API key required, works offline, supports both English and Ukrainian date phrasing.

---

## Features

| Feature | Details |
|---|---|
| **Task management** | Create, edit, delete commitments with deadlines |
| **Status tracking** | Pending → In Progress → Done / Overdue |
| **Auto-expire** | Tasks with a past deadline auto-flip to Overdue on next load |
| **Overdue indicator** | Any task with a missed deadline shows "overdue" regardless of current status |
| **Calendar view** | Monthly calendar with per-day filtering and color-coded status dots |
| **Donut chart** | Live stats with per-status counts and completion rate |
| **AI smart input** | Natural language → title + deadline (chrono-node, no API key) |
| **Dark / light theme** | Persistent via next-themes, liquid-glass design in both modes |
| **Ukrainian / English UI** | Full i18n — dates, labels, validation messages, status names |
| **Seamless status change** | Optimistic update + silent background sync, no scroll jump |
| **Scroll to top** | Floating liquid-glass button on mobile, appears after 300 px |
| **Responsive** | Adaptive two-column desktop layout, single-column mobile |
| **Custom confirm dialog** | Blur backdrop, smooth exit animation, keyboard (Esc) support |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| NL parsing | chrono-node (free, no key) |
| Theming | next-themes |
| Deployment | Vercel |

