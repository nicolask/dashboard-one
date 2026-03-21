-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "sizeBand" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "basePrice" REAL NOT NULL,
    "baseCost" REAL NOT NULL,
    "marginBand" TEXT NOT NULL,
    "popularityScore" REAL NOT NULL DEFAULT 0.5,
    "isPromoEligible" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderedAt" DATETIME NOT NULL,
    "customerType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "subtotalAmount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "lineRevenue" REAL NOT NULL,
    "lineMargin" REAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStoreMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "storeId" TEXT NOT NULL,
    "revenue" REAL NOT NULL,
    "orders" INTEGER NOT NULL,
    "itemsSold" INTEGER NOT NULL,
    "avgBasketValue" REAL NOT NULL,
    "avgItemsPerOrder" REAL NOT NULL,
    "visitors" INTEGER NOT NULL,
    "conversionRate" REAL NOT NULL,
    "discountRate" REAL NOT NULL,
    "returnRate" REAL NOT NULL DEFAULT 0,
    "marginAmount" REAL NOT NULL,
    "marginRate" REAL NOT NULL,
    "scenarioSlug" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyStoreMetric_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyTraffic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "storeId" TEXT NOT NULL,
    "visitors" INTEGER NOT NULL,
    "sessions" INTEGER NOT NULL,
    "addToCartCount" INTEGER NOT NULL,
    "checkoutCount" INTEGER NOT NULL,
    "purchaseCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyTraffic_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_storeId_orderedAt_idx" ON "Order"("storeId", "orderedAt");

-- CreateIndex
CREATE INDEX "Order_orderedAt_idx" ON "Order"("orderedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "DailyStoreMetric_storeId_date_idx" ON "DailyStoreMetric"("storeId", "date");

-- CreateIndex
CREATE INDEX "DailyStoreMetric_date_idx" ON "DailyStoreMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStoreMetric_date_storeId_key" ON "DailyStoreMetric"("date", "storeId");

-- CreateIndex
CREATE INDEX "DailyTraffic_storeId_date_idx" ON "DailyTraffic"("storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTraffic_date_storeId_key" ON "DailyTraffic"("date", "storeId");
