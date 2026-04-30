-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PREVIEW', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('NEW', 'DUPLICATE', 'ERROR', 'IMPORTED');

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "source" "AccountSourceType" NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PREVIEW',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "newRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "transactionId" TEXT,
    "rowIndex" INTEGER NOT NULL,
    "status" "ImportRowStatus" NOT NULL,
    "duplicateReason" TEXT,
    "errorMessage" TEXT,
    "raw" JSONB NOT NULL,
    "normalized" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportRow_transactionId_key" ON "ImportRow"("transactionId");

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ConnectedAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
