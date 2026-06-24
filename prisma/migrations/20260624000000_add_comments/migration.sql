CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "item_comment_seen" (
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seen_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "item_comment_seen_pkey" PRIMARY KEY ("itemId","userId")
);

CREATE INDEX "comments_itemId_created_at_idx" ON "comments"("itemId", "created_at");

ALTER TABLE "comments" ADD CONSTRAINT "comments_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "status_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
