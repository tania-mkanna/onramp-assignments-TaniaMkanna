-- CreateEnum
CREATE TYPE "CrawlSessionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "crawl_sessions" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "maxPages" INTEGER NOT NULL,
    "maxDepth" INTEGER NOT NULL,
    "pagesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "pagesCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" "CrawlSessionStatus" NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crawl_sessions_websiteId_idx" ON "crawl_sessions"("websiteId");

-- CreateIndex
CREATE INDEX "crawl_sessions_status_idx" ON "crawl_sessions"("status");

-- AddForeignKey
ALTER TABLE "crawl_sessions" ADD CONSTRAINT "crawl_sessions_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
