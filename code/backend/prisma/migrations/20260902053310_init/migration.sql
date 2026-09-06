-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'SCANNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "latestCommitSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "riskScore" DOUBLE PRECISION,
    "riskLevel" "RiskLevel",
    "errorMessage" TEXT,
    "ecosystems" TEXT[],
    "manifestFiles" TEXT[],
    "fileCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependency" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "direct" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Dependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" TEXT NOT NULL,
    "dependencyId" TEXT NOT NULL,
    "vulnerabilityId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "cvss" DOUBLE PRECISION,
    "summary" TEXT NOT NULL,
    "fixedVersions" TEXT[],

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_url_key" ON "Repository"("url");

-- CreateIndex
CREATE INDEX "Repository_owner_name_idx" ON "Repository"("owner", "name");

-- CreateIndex
CREATE INDEX "Scan_repositoryId_idx" ON "Scan"("repositoryId");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_startedAt_idx" ON "Scan"("startedAt");

-- CreateIndex
CREATE INDEX "Dependency_scanId_idx" ON "Dependency"("scanId");

-- CreateIndex
CREATE INDEX "Dependency_ecosystem_idx" ON "Dependency"("ecosystem");

-- CreateIndex
CREATE INDEX "Vulnerability_dependencyId_idx" ON "Vulnerability"("dependencyId");

-- CreateIndex
CREATE INDEX "Vulnerability_vulnerabilityId_idx" ON "Vulnerability"("vulnerabilityId");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependency" ADD CONSTRAINT "Dependency_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "Dependency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
