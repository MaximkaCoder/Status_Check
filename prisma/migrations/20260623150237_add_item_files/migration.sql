-- CreateTable
CREATE TABLE "item_files" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "item_files" ADD CONSTRAINT "item_files_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "status_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
