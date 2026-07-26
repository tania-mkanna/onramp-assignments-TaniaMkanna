-- DropIndex
DROP INDEX "document_chunks_processedPageId_idx";

-- CreateIndex
CREATE INDEX "document_chunks_processedPageId_chunkIndex_idx" ON "document_chunks"("processedPageId", "chunkIndex");
