-- DropIndex
DROP INDEX "Attendance_employeeId_date_key";

-- CreateIndex
CREATE INDEX "Attendance_employeeId_date_idx" ON "Attendance"("employeeId", "date");
