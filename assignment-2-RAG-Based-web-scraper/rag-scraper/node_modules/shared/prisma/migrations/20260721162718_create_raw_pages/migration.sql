-- CreateTable
CREATE TABLE "raw_pages" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_page_versions" (
    "id" TEXT NOT NULL,
    "rawPageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_pages_url_key" ON "raw_pages"("url");

-- CreateIndex
CREATE INDEX "raw_pages_domain_idx" ON "raw_pages"("domain");

-- CreateIndex
CREATE INDEX "raw_page_versions_contentHash_idx" ON "raw_page_versions"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "raw_page_versions_rawPageId_version_key" ON "raw_page_versions"("rawPageId", "version");

-- AddForeignKey
ALTER TABLE "raw_page_versions" ADD CONSTRAINT "raw_page_versions_rawPageId_fkey" FOREIGN KEY ("rawPageId") REFERENCES "raw_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
