-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('ACTIVE', 'SOON_TO_BE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "customerType" "CustomerType" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Customer_customerType_idx" ON "Customer"("customerType");