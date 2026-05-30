-- Add new columns
ALTER TABLE "status_items" ADD COLUMN "project"  TEXT;
ALTER TABLE "status_items" ADD COLUMN "assignee" TEXT;
ALTER TABLE "status_items" ADD COLUMN "reviewer" TEXT;

-- Make deadline nullable
ALTER TABLE "status_items" ALTER COLUMN "deadline" DROP NOT NULL;

-- Create new Status enum
CREATE TYPE "Status_new" AS ENUM ('TO_CHECK', 'EXPIRED', 'DONE', 'NOT_ACTUAL', 'IDEAS_BACKLOG');

-- Migrate existing rows
ALTER TABLE "status_items" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "status_items"
  ALTER COLUMN "status" TYPE "Status_new"
  USING (CASE "status"::text
    WHEN 'DONE'        THEN 'DONE'::"Status_new"
    WHEN 'OVERDUE'     THEN 'EXPIRED'::"Status_new"
    WHEN 'IN_PROGRESS' THEN 'TO_CHECK'::"Status_new"
    ELSE                    'TO_CHECK'::"Status_new"
  END);
ALTER TABLE "status_items" ALTER COLUMN "status" SET DEFAULT 'TO_CHECK'::"Status_new";

-- Drop old enum and rename
DROP TYPE "Status";
ALTER TYPE "Status_new" RENAME TO "Status";
