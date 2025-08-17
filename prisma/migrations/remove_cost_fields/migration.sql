-- AlterTable
ALTER TABLE "Job" DROP COLUMN "totalCost",
DROP COLUMN "depositPaid", 
DROP COLUMN "actualCost";

-- DropTable
DROP TABLE IF EXISTS "Invoice";