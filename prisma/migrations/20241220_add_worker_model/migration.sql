-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "currentJob" TEXT,
    "color" TEXT NOT NULL,
    "notes" TEXT,
    "timesheet" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Worker_name_idx" ON "Worker"("name");

-- CreateIndex
CREATE INDEX "Worker_status_idx" ON "Worker"("status");

-- Update SyncQueue entityType comment
COMMENT ON COLUMN "SyncQueue"."entityType" IS '"customer", "job", "material", "worker"';