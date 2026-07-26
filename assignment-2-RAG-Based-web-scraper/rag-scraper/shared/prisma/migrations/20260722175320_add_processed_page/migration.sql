-- CreateTable
CREATE TABLE "processed_pages" (
    "id" TEXT NOT NULL,
    "rawPageId" TEXT NOT NULL,
    "rawPageVersionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cleanedText" TEXT NOT NULL,
    "structuredData" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processed_pages_rawPageVersionId_key" ON "processed_pages"("rawPageVersionId");

-- CreateIndex
CREATE INDEX "processed_pages_rawPageId_idx" ON "processed_pages"("rawPageId");

-- AddForeignKey
ALTER TABLE "processed_pages" ADD CONSTRAINT "processed_pages_rawPageId_fkey" FOREIGN KEY ("rawPageId") REFERENCES "raw_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_pages" ADD CONSTRAINT "processed_pages_rawPageVersionId_fkey" FOREIGN KEY ("rawPageVersionId") REFERENCES "raw_page_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
