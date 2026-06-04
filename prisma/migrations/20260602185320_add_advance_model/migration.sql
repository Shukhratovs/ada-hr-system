-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "shiftStart" SET DEFAULT '09:00',
ALTER COLUMN "shiftEnd" SET DEFAULT '18:00';

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "netPay" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalAdvances" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "note" TEXT,
    "date" DATE NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advance_employeeId_weekStart_idx" ON "Advance"("employeeId", "weekStart");

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
