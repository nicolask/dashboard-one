-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "weeklyHours" REAL NOT NULL,
    "hourlyWage" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Employee_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeWorkLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hoursWorked" REAL NOT NULL,
    CONSTRAINT "EmployeeWorkLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStoreCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "storeId" TEXT NOT NULL,
    "staffCost" REAL NOT NULL,
    "rentCost" REAL NOT NULL,
    "otherCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "staffHours" REAL NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "scenarioSlug" TEXT,
    CONSTRAINT "DailyStoreCost_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeWorkLog_employeeId_date_key" ON "EmployeeWorkLog"("employeeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeWorkLog_employeeId_date_idx" ON "EmployeeWorkLog"("employeeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeWorkLog_date_idx" ON "EmployeeWorkLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStoreCost_date_storeId_key" ON "DailyStoreCost"("date", "storeId");

-- CreateIndex
CREATE INDEX "DailyStoreCost_storeId_date_idx" ON "DailyStoreCost"("storeId", "date");

-- CreateIndex
CREATE INDEX "DailyStoreCost_date_idx" ON "DailyStoreCost"("date");
