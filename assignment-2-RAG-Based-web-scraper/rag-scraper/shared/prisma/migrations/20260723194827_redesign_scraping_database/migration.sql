/*
  Warnings:

  - You are about to drop the column `processedPageId` on the `document_chunks` table. All the data in the column will be lost.
  - You are about to drop the `processed_pages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `raw_page_versions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `raw_pages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[processedDocumentId,chunkIndex]` on the table `document_chunks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `processedDocumentId` to the `document_chunks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('PENDING', 'SCRAPING', 'SUCCESS', 'FAILED');

-- DropForeignKey
ALTER TABLE "document_chunks" DROP CONSTRAINT "document_chunks_processedPageId_fkey";

-- DropForeignKey
ALTER TABLE "processed_pages" DROP CONSTRAINT "processed_pages_rawPageId_fkey";

-- DropForeignKey
ALTER TABLE "processed_pages" DROP CONSTRAINT "processed_pages_rawPageVersionId_fkey";

-- DropForeignKey
ALTER TABLE "raw_page_versions" DROP CONSTRAINT "raw_page_versions_rawPageId_fkey";

-- DropIndex
DROP INDEX "document_chunks_processedPageId_chunkIndex_idx";

-- AlterTable
ALTER TABLE "document_chunks" DROP COLUMN "processedPageId",
ADD COLUMN     "processedDocumentId" TEXT NOT NULL;

-- DropTable
DROP TABLE "processed_pages";

-- DropTable
DROP TABLE "raw_page_versions";

-- DropTable
DROP TABLE "raw_pages";

-- CreateTable
CREATE TABLE "websites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "lastCrawledAt" TIMESTAMP(3),
    "status" "PageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "contentType" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_documents" (
    "id" TEXT NOT NULL,
    "pageVersionId" TEXT NOT NULL,
    "title" TEXT,
    "cleanedText" TEXT NOT NULL,
    "structuredData" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "websites_baseUrl_key" ON "websites"("baseUrl");

-- CreateIndex
CREATE INDEX "pages_websiteId_idx" ON "pages"("websiteId");

-- CreateIndex
CREATE INDEX "pages_normalizedUrl_idx" ON "pages"("normalizedUrl");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pages_websiteId_normalizedUrl_key" ON "pages"("websiteId", "normalizedUrl");

-- CreateIndex
CREATE INDEX "page_versions_pageId_idx" ON "page_versions"("pageId");

-- CreateIndex
CREATE INDEX "page_versions_contentHash_idx" ON "page_versions"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "page_versions_pageId_version_key" ON "page_versions"("pageId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "processed_documents_pageVersionId_key" ON "processed_documents"("pageVersionId");

-- CreateIndex
CREATE INDEX "document_chunks_processedDocumentId_idx" ON "document_chunks"("processedDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_processedDocumentId_chunkIndex_key" ON "document_chunks"("processedDocumentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_documents" ADD CONSTRAINT "processed_documents_pageVersionId_fkey" FOREIGN KEY ("pageVersionId") REFERENCES "page_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_processedDocumentId_fkey" FOREIGN KEY ("processedDocumentId") REFERENCES "processed_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
