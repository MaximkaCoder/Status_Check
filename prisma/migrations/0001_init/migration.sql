CREATE TYPE "Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'OVERDUE');

CREATE TABLE "status_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "creator_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "status_items_deadline_idx" ON "status_items"("deadline");
CREATE INDEX "status_items_status_idx" ON "status_items"("status");
CREATE INDEX "status_items_deadline_status_idx" ON "status_items"("deadline", "status");
CREATE INDEX "status_items_created_at_idx" ON "status_items"("created_at");
