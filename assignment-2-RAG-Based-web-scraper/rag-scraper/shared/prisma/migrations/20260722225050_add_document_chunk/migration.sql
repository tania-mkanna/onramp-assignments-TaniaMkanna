-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "processedPageId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sectionTitle" TEXT,
    "tokenCount" INTEGER NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_chunks_processedPageId_idx" ON "document_chunks"("processedPageId");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_processedPageId_fkey" FOREIGN KEY ("processedPageId") REFERENCES "processed_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
