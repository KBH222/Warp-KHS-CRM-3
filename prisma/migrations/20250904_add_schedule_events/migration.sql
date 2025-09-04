-- CreateTable
CREATE TABLE "ScheduleEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "workers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleEvent_eventType_idx" ON "ScheduleEvent"("eventType");

-- CreateIndex
CREATE INDEX "ScheduleEvent_startDate_idx" ON "ScheduleEvent"("startDate");

-- CreateIndex
CREATE INDEX "ScheduleEvent_endDate_idx" ON "ScheduleEvent"("endDate");

-- CreateIndex
CREATE INDEX "ScheduleEvent_customerId_idx" ON "ScheduleEvent"("customerId");

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;