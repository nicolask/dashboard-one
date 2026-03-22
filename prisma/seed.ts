// prisma/seed.ts
// Retail BI Demo – deterministischer Datensimulator V1
//
// Aufruf: npx tsx prisma/seed.ts

import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Rand from "rand-seed";

import { PrismaClient } from "../generated/prisma/client";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  return url;
}

const adapter = new PrismaBetterSqlite3({ url: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

const SEED_VALUE = "retail-demo-v1";
const DAYS_HISTORY = 120;
const ORDER_SAMPLE_RATE = 0.15;

const PRODUCT_NAMES: Record<string, string[]> = {
  electronics: [
    "Wireless Noise-Cancelling Headphones",
    '4K Smart TV 55"',
    "USB-C Hub 7-Port",
    "Mechanical Keyboard TKL",
    '27" IPS Monitor',
    "True Wireless Earbuds",
    "Portable Bluetooth Speaker",
    "Smart Home Hub",
    "Action Camera 4K",
    "Gaming Mouse RGB",
    "Webcam 1080p",
    "Power Bank 20000mAh",
    "LED Desk Lamp Smart",
  ],
  home: [
    "Linen Duvet Cover Set",
    "Bamboo Cutting Board",
    "Cast Iron Skillet 26cm",
    "Scented Soy Candle Set",
    "Ceramic Plant Pot Set",
    "Memory Foam Pillow",
    "Electric Kettle 1.7L",
    "Stainless Steel Cookware Set",
    "Blackout Curtains 2-Pack",
    "Bathroom Towel Set",
    "Over-Door Organiser",
    "Digital Kitchen Scale",
    "Wooden Storage Box",
  ],
  fashion: [
    "Merino Wool Pullover",
    "Slim Chino Pants",
    "Canvas Tote Bag",
    "Leather Belt",
    "Crew Neck T-Shirt 3-Pack",
    "Denim Jacket",
    "Wool Blend Coat",
    "Linen Shirt",
    "Sneakers Classic White",
    "Cashmere Scarf",
    "Ankle Boots",
    "Structured Blazer",
    "Striped Breton Top",
  ],
  beauty: [
    "Vitamin C Serum 30ml",
    "Matte Lipstick Set",
    "Hyaluronic Moisturiser",
    "Retinol Night Cream",
    "SPF 50 Sunscreen",
    "Micellar Cleansing Water",
    "Eyeshadow Palette 12 Shades",
    "Perfume Eau de Toilette 50ml",
    "Hair Mask Treatment",
    "Nail Polish Set",
    "Mascara Volume & Length",
    "Exfoliating Face Scrub",
    "Tinted BB Cream",
  ],
  sports: [
    "Yoga Mat 6mm Non-Slip",
    "Running Shorts",
    "Stainless Steel Water Bottle 750ml",
    "Resistance Band Set",
    "Compression Leggings",
    "Foam Roller",
    "Adjustable Dumbbell 20kg",
    "Trail Running Shoes",
    "Cycling Gloves",
    "Swim Goggles Pro",
    "Jump Rope Speed",
    "Gym Bag 30L",
    "Heart Rate Monitor",
  ],
  grocery: [
    "Premium Olive Oil 500ml",
    "Organic Oat Granola 500g",
    "Fair Trade Coffee Beans 250g",
    "Manuka Honey 250g",
    "Organic Pasta Selection",
    "Cold-Pressed Orange Juice 1L",
    "Dark Chocolate 85% 100g",
    "Basmati Rice 1kg",
    "Coconut Milk 400ml",
    "Herbal Tea Assortment 40 bags",
    "Himalayan Pink Salt",
    "Chia Seeds 300g",
    "Almond Butter 340g",
  ],
};

const STORE_CATALOG = [
  {
    code: "BER-01",
    name: "Berlin Mitte",
    city: "Berlin",
    region: "Ost",
    format: "flagship",
    sizeBand: "large",
    trafficBase: 1800,
    conversionBase: 0.045,
    basketBase: 87,
    categoryBias: { electronics: 1.4, fashion: 1.2 },
  },
  {
    code: "HAM-01",
    name: "Hamburg Altona",
    city: "Hamburg",
    region: "Nord",
    format: "mall",
    sizeBand: "large",
    trafficBase: 1400,
    conversionBase: 0.052,
    basketBase: 74,
    categoryBias: { home: 1.3, beauty: 1.4 },
  },
  {
    code: "MUC-01",
    name: "München Maxvorstadt",
    city: "München",
    region: "Süd",
    format: "urban",
    sizeBand: "medium",
    trafficBase: 1100,
    conversionBase: 0.041,
    basketBase: 95,
    categoryBias: { electronics: 1.2, sports: 1.3 },
  },
  {
    code: "LEI-01",
    name: "Leipzig Gohlis",
    city: "Leipzig",
    region: "Ost",
    format: "suburban",
    sizeBand: "medium",
    trafficBase: 700,
    conversionBase: 0.038,
    basketBase: 68,
    categoryBias: { grocery: 1.5, home: 1.2 },
  },
  {
    code: "KOE-01",
    name: "Köln Ehrenfeld",
    city: "Köln",
    region: "West",
    format: "urban",
    sizeBand: "medium",
    trafficBase: 950,
    conversionBase: 0.044,
    basketBase: 79,
    categoryBias: { fashion: 1.3, beauty: 1.2 },
  },
  {
    code: "STU-01",
    name: "Stuttgart Mitte",
    city: "Stuttgart",
    region: "Süd",
    format: "mall",
    sizeBand: "small",
    trafficBase: 620,
    conversionBase: 0.039,
    basketBase: 72,
    categoryBias: { home: 1.1, sports: 1.2 },
  },
  {
    code: "DUS-01",
    name: "Düsseldorf Flingern",
    city: "Düsseldorf",
    region: "West",
    format: "urban",
    sizeBand: "small",
    trafficBase: 580,
    conversionBase: 0.036,
    basketBase: 81,
    categoryBias: { fashion: 1.4, beauty: 1.3 },
  },
  {
    code: "NUE-01",
    name: "Nürnberg Gostenhof",
    city: "Nürnberg",
    region: "Süd",
    format: "suburban",
    sizeBand: "small",
    trafficBase: 480,
    conversionBase: 0.033,
    basketBase: 65,
    categoryBias: { grocery: 1.3, home: 1.1 },
  },
] as const;

const CATEGORY_CATALOG = [
  {
    slug: "electronics",
    name: "Electronics",
    sortOrder: 1,
    priceRange: [49, 899],
    avgQtyPerItem: 1.1,
    marginBand: "low",
    demandBase: 0.7,
    promoSensitivity: 0.8,
  },
  {
    slug: "home",
    name: "Home & Living",
    sortOrder: 2,
    priceRange: [12, 249],
    avgQtyPerItem: 1.8,
    marginBand: "medium",
    demandBase: 0.9,
    promoSensitivity: 1.1,
  },
  {
    slug: "fashion",
    name: "Fashion",
    sortOrder: 3,
    priceRange: [19, 199],
    avgQtyPerItem: 2,
    marginBand: "high",
    demandBase: 0.85,
    promoSensitivity: 1.4,
  },
  {
    slug: "beauty",
    name: "Beauty & Care",
    sortOrder: 4,
    priceRange: [8, 89],
    avgQtyPerItem: 2.3,
    marginBand: "high",
    demandBase: 1,
    promoSensitivity: 1.2,
  },
  {
    slug: "sports",
    name: "Sports & Outdoor",
    sortOrder: 5,
    priceRange: [24, 349],
    avgQtyPerItem: 1.4,
    marginBand: "medium",
    demandBase: 0.75,
    promoSensitivity: 1,
  },
  {
    slug: "grocery",
    name: "Grocery & Food",
    sortOrder: 6,
    priceRange: [2, 38],
    avgQtyPerItem: 4.5,
    marginBand: "low",
    demandBase: 1.2,
    promoSensitivity: 0.9,
  },
] as const;

type Scenario = {
  slug: string;
  description: string;
  startDaysAgo: number;
  durationDays: number;
  storeCode?: string;
  categorySlug?: string;
  effects: {
    trafficMultiplier?: number;
    conversionMultiplier?: number;
    basketMultiplier?: number;
    discountRateBoost?: number;
    returnRateBoost?: number;
  };
};

const SCENARIOS: Scenario[] = [
  {
    slug: "promo_week",
    description:
      "Promotionswoche: Traffic- und Discount-Boost, leichter Basket-Rückgang",
    startDaysAgo: 30,
    durationDays: 7,
    effects: {
      trafficMultiplier: 1.35,
      conversionMultiplier: 1.2,
      basketMultiplier: 0.93,
      discountRateBoost: 0.06,
    },
  },
  {
    slug: "traffic_surge",
    description:
      "Hamburg: lokales Event treibt Traffic, verdünnt Conversion und Basket-Wert",
    startDaysAgo: 60,
    durationDays: 8,
    storeCode: "HAM-01",
    effects: {
      trafficMultiplier: 1.45,
      conversionMultiplier: 0.81,
      basketMultiplier: 0.91,
    },
  },
  {
    slug: "competitor_opening",
    description:
      "München: neuer Wettbewerber in der Nähe - anhaltender Traffic- und Conversion-Druck",
    startDaysAgo: 52,
    durationDays: 30,
    storeCode: "MUC-01",
    effects: {
      trafficMultiplier: 0.79,
      conversionMultiplier: 0.87,
      basketMultiplier: 0.97,
    },
  },
  {
    slug: "store_slump",
    description:
      "Conversion-Einbruch in Leipzig: internes Problem, sichtbar als Alert",
    startDaysAgo: 14,
    durationDays: 12,
    storeCode: "LEI-01",
    effects: {
      conversionMultiplier: 0.62,
      basketMultiplier: 0.95,
      returnRateBoost: 0.03,
    },
  },
] as const;

function makeRng(namespace: string) {
  const r = new Rand(`${SEED_VALUE}::${namespace}`);

  return {
    float: () => r.next(),
    between: (min: number, max: number) => min + r.next() * (max - min),
    normal: (mean: number, std: number) => {
      const u = 1 - r.next();
      const v = 1 - r.next();
      return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    int: (min: number, max: number) => Math.floor(min + r.next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(r.next() * arr.length)],
  };
}

function weekdayFactor(date: Date): number {
  const day = date.getDay();
  const factors = [0.85, 0.78, 0.8, 0.88, 0.95, 1.0, 1.18];
  return factors[day] ?? 1;
}

function activeScenario(storeCode: string, date: Date): Scenario | null {
  const today = new Date();

  for (const scenario of SCENARIOS) {
    if (scenario.storeCode && scenario.storeCode !== storeCode) {
      continue;
    }

    const start = new Date(today);
    start.setDate(today.getDate() - scenario.startDaysAgo);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + scenario.durationDays);

    if (date >= start && date < end) {
      return scenario;
    }
  }

  return null;
}

async function seedCatalog() {
  console.log("-> Seeding categories and products...");

  const categoryMap = new Map<string, string>();

  for (const category of CATEGORY_CATALOG) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });

    categoryMap.set(category.slug, record.id);
  }

  const productsPerCategory = 13;

  for (const category of CATEGORY_CATALOG) {
    const categoryId = categoryMap.get(category.slug);

    if (!categoryId) {
      throw new Error(`Missing category id for ${category.slug}`);
    }

    const rng = makeRng(`products::${category.slug}`);
    const [priceMin, priceMax] = category.priceRange;

    for (let index = 1; index <= productsPerCategory; index++) {
      const basePrice = Math.round(rng.between(priceMin, priceMax) * 100) / 100;
      const marginFactor =
        category.marginBand === "high"
          ? 0.55
          : category.marginBand === "medium"
            ? 0.42
            : 0.28;
      const baseCost = Math.round(basePrice * (1 - marginFactor) * 100) / 100;
      const popularity = rng.normal(0.5, 0.22);

      await prisma.product.upsert({
        where: { sku: `${category.slug.toUpperCase()}-${String(index).padStart(3, "0")}` },
        update: {},
        create: {
          sku: `${category.slug.toUpperCase()}-${String(index).padStart(3, "0")}`,
          name: PRODUCT_NAMES[category.slug]?.[index - 1] ?? `${category.name} Product ${index}`,
          categoryId,
          basePrice,
          baseCost,
          marginBand: category.marginBand,
          popularityScore: Math.min(1, Math.max(0, popularity)),
          isPromoEligible: rng.float() > 0.15,
        },
      });
    }
  }

  console.log(
    `   ✓ ${CATEGORY_CATALOG.length} categories, ~${CATEGORY_CATALOG.length * productsPerCategory} products`,
  );

  return categoryMap;
}

async function seedStores() {
  console.log("-> Seeding stores...");

  const storeMap = new Map<string, string>();

  for (const store of STORE_CATALOG) {
    const record = await prisma.store.upsert({
      where: { code: store.code },
      update: {},
      create: {
        code: store.code,
        name: store.name,
        city: store.city,
        region: store.region,
        format: store.format,
        sizeBand: store.sizeBand,
        openedAt: new Date("2021-01-01"),
        isActive: true,
      },
    });

    storeMap.set(store.code, record.id);
  }

  console.log(`   ✓ ${STORE_CATALOG.length} stores`);

  return storeMap;
}

async function generateDailyMetrics(storeMap: Map<string, string>) {
  console.log(`-> Generating ${DAYS_HISTORY} days x ${STORE_CATALOG.length} stores of daily metrics...`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let batchCount = 0;

  for (const storeDef of STORE_CATALOG) {
    const storeId = storeMap.get(storeDef.code);

    if (!storeId) {
      throw new Error(`Missing store id for ${storeDef.code}`);
    }

    for (let offset = DAYS_HISTORY; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);

      const rng = makeRng(`daily::${storeDef.code}::${date.toISOString().slice(0, 10)}`);
      const scenario = activeScenario(storeDef.code, date);
      const effects = scenario?.effects ?? {};

      const weekday = weekdayFactor(date);
      const dailyNoise = rng.normal(1.0, 0.07);
      const trafficMulti = (effects.trafficMultiplier ?? 1) * weekday * dailyNoise;
      const visitors = Math.round(storeDef.trafficBase * trafficMulti);

      const convMulti = (effects.conversionMultiplier ?? 1) * rng.normal(1.0, 0.05);
      const conversionRate = Math.min(
        0.15,
        Math.max(0.01, storeDef.conversionBase * convMulti),
      );
      const orders = Math.max(1, Math.round(visitors * conversionRate));

      const basketMulti = (effects.basketMultiplier ?? 1) * rng.normal(1.0, 0.06);
      const grossAvgBasket = Math.round(storeDef.basketBase * basketMulti * 100) / 100;
      const subtotal = grossAvgBasket * orders;

      const discountRate = Math.min(
        0.25,
        Math.max(0, 0.05 + (effects.discountRateBoost ?? 0) + rng.normal(0, 0.015)),
      );
      const discountAmount = subtotal * discountRate;
      const revenue = Math.round((subtotal - discountAmount) * 100) / 100;
      const avgBasketValue = Math.round((revenue / orders) * 100) / 100;

      const avgItemsPerOrder = Math.round(rng.between(1.5, 3.2) * 10) / 10;
      const itemsSold = Math.round(orders * avgItemsPerOrder);

      const marginRate = Math.round(rng.between(0.28, 0.46) * 1000) / 1000;
      const marginAmount = Math.round(revenue * marginRate * 100) / 100;

      const returnRate = Math.min(
        0.12,
        Math.max(0, 0.025 + (effects.returnRateBoost ?? 0) + rng.normal(0, 0.008)),
      );

      const dailyMetricData = {
        revenue,
        orders,
        itemsSold,
        avgBasketValue,
        avgItemsPerOrder,
        visitors,
        conversionRate: Math.round(conversionRate * 10000) / 10000,
        discountRate: Math.round(discountRate * 10000) / 10000,
        returnRate: Math.round(returnRate * 10000) / 10000,
        marginAmount,
        marginRate,
        scenarioSlug: scenario?.slug ?? null,
      };

      await prisma.dailyStoreMetric.upsert({
        where: { date_storeId: { date, storeId } },
        update: dailyMetricData,
        create: {
          date,
          storeId,
          ...dailyMetricData,
        },
      });

      batchCount += 1;
    }
  }

  console.log(`   ✓ ${batchCount} daily metric records`);
}

function pickWeightedCategory(
  bias: Record<string, number>,
  rng: ReturnType<typeof makeRng>,
): string {
  const categories = CATEGORY_CATALOG.map((category) => ({
    slug: category.slug,
    weight: bias[category.slug] ?? 1.0,
  }));
  const total = categories.reduce((sum, category) => sum + category.weight, 0);

  let remainder = rng.float() * total;
  for (const category of categories) {
    remainder -= category.weight;
    if (remainder <= 0) {
      return category.slug;
    }
  }

  return categories[categories.length - 1]?.slug ?? CATEGORY_CATALOG[0].slug;
}

type ProductWithCategory = Awaited<
  ReturnType<typeof prisma.product.findMany>
>[number];

function pickByPopularity(products: ProductWithCategory[], rng: ReturnType<typeof makeRng>) {
  const total = products.reduce((sum, product) => sum + product.popularityScore, 0);

  let remainder = rng.float() * total;
  for (const product of products) {
    remainder -= product.popularityScore;
    if (remainder <= 0) {
      return product;
    }
  }

  return products[products.length - 1];
}

async function generateSampleOrders(storeMap: Map<string, string>) {
  console.log("-> Generating sample orders and order items...");

  const products = await prisma.product.findMany({ include: { category: true } });
  const productsByCategory = new Map<string, ProductWithCategory[]>();

  for (const product of products) {
    const slug = product.category.slug;
    const existing = productsByCategory.get(slug) ?? [];
    existing.push(product);
    productsByCategory.set(slug, existing);
  }

  let orderCount = 0;

  for (const storeDef of STORE_CATALOG) {
    const storeId = storeMap.get(storeDef.code);

    if (!storeId) {
      throw new Error(`Missing store id for ${storeDef.code}`);
    }

    const metrics = await prisma.dailyStoreMetric.findMany({
      where: { storeId },
      orderBy: { date: "asc" },
    });

    for (const metric of metrics) {
      const rng = makeRng(`orders::${storeDef.code}::${metric.date.toISOString().slice(0, 10)}`);

      if (rng.float() > ORDER_SAMPLE_RATE) {
        continue;
      }

      for (let orderIndex = 0; orderIndex < metric.orders; orderIndex++) {
        const orderRng = makeRng(
          `order::${storeDef.code}::${metric.date.toISOString().slice(0, 10)}::${orderIndex}`,
        );

        const orderedAt = new Date(metric.date);
        orderedAt.setHours(orderRng.int(9, 21), orderRng.int(0, 59), 0, 0);

        const customerType = orderRng.float() < 0.38 ? "new" : "returning";
        const channel =
          orderRng.float() < 0.82
            ? "in_store"
            : orderRng.float() < 0.5
              ? "click_collect"
              : "online";
        const orderNumber = `${storeDef.code}-${metric.date
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${String(orderIndex).padStart(4, "0")}`;

        const status = orderRng.float() < 0.96 ? "completed" : "returned_partial";
        const order = await prisma.order.upsert({
          where: { orderNumber },
          update: {
            storeId,
            orderedAt,
            customerType,
            channel,
            itemCount: 0,
            subtotalAmount: 0,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
            paymentMethod: null,
            status,
          },
          create: {
            orderNumber,
            storeId,
            orderedAt,
            customerType,
            channel,
            itemCount: 0,
            subtotalAmount: 0,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
            paymentMethod: null,
            status,
          },
        });

        await prisma.orderItem.deleteMany({
          where: { orderId: order.id },
        });

        const numItems = orderRng.int(1, 4);
        let orderSubtotal = 0;
        let orderDiscount = 0;

        for (let itemIndex = 0; itemIndex < numItems; itemIndex++) {
          const categorySlug = pickWeightedCategory(storeDef.categoryBias, orderRng);
          const categoryProducts = productsByCategory.get(categorySlug) ?? products;
          const product = pickByPopularity(categoryProducts, orderRng);

          const quantity = orderRng.int(1, 3);
          const unitPrice = product.basePrice * orderRng.normal(1, 0.04);
          const unitCost = product.baseCost;
          const lineDiscount = orderRng.float() < 0.2 ? unitPrice * 0.1 : 0;
          const lineRevenue = Math.max(0, quantity * unitPrice - lineDiscount);
          const lineMargin = lineRevenue - quantity * unitCost;

          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              quantity,
              unitPrice: Math.round(unitPrice * 100) / 100,
              unitCost: Math.round(unitCost * 100) / 100,
              discountAmount: Math.round(lineDiscount * 100) / 100,
              lineRevenue: Math.round(lineRevenue * 100) / 100,
              lineMargin: Math.round(lineMargin * 100) / 100,
            },
          });

          orderSubtotal += quantity * unitPrice;
          orderDiscount += lineDiscount;
        }

        const tax = orderSubtotal * 0.19;
        const total = orderSubtotal - orderDiscount + tax;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            itemCount: numItems,
            subtotalAmount: Math.round(orderSubtotal * 100) / 100,
            discountAmount: Math.round(orderDiscount * 100) / 100,
            taxAmount: Math.round(tax * 100) / 100,
            totalAmount: Math.round(total * 100) / 100,
          },
        });

        orderCount += 1;
      }
    }
  }

  console.log(`   ✓ ~${orderCount} orders with items`);
}

async function runKpiChecks() {
  console.log("-> Running KPI consistency checks...");

  const sample = await prisma.dailyStoreMetric.findMany({ take: 20 });
  let checksPassed = 0;

  for (const metric of sample) {
    const derivedBasket = metric.revenue / metric.orders;
    const basketDelta = Math.abs(derivedBasket - metric.avgBasketValue);
    console.assert(
      basketDelta < 0.02,
      `Basket mismatch at ${metric.date.toISOString()}: stored=${metric.avgBasketValue} derived=${derivedBasket.toFixed(2)}`,
    );

    const derivedConversion = metric.orders / metric.visitors;
    const conversionDelta = Math.abs(derivedConversion - metric.conversionRate);
    console.assert(
      conversionDelta < 0.001,
      `Conversion mismatch: stored=${metric.conversionRate} derived=${derivedConversion.toFixed(4)}`,
    );

    checksPassed += 1;
  }

  console.log(`   ✓ ${checksPassed} KPI checks passed`);
}

async function main() {
  console.log("\nRetail BI Demo - Seed starting\n");
  console.log(`   Seed value: ${SEED_VALUE}`);
  console.log(`   History:    ${DAYS_HISTORY} days`);
  console.log(`   Scenarios:  ${SCENARIOS.map((scenario) => scenario.slug).join(", ")}\n`);

  await seedCatalog();
  const storeMap = await seedStores();
  await generateDailyMetrics(storeMap);
  await runKpiChecks();
  await generateSampleOrders(storeMap);

  console.log("\nSeed complete.\n");
  console.log("   Snapshot generated at:", new Date().toISOString());
  console.log("   Built-in scenarios:");
  for (const scenario of SCENARIOS) {
    console.log(`   - [${scenario.slug}] ${scenario.description}`);
  }
  console.log();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
