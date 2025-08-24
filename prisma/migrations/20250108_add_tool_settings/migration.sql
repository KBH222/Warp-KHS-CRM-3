-- CreateTable
CREATE TABLE "ToolSettings" (
    "id" TEXT NOT NULL,
    "selectedCategories" JSONB NOT NULL DEFAULT '[]',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "showDemo" BOOLEAN NOT NULL DEFAULT false,
    "showInstall" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolSettings_pkey" PRIMARY KEY ("id")
);