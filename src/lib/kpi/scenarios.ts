import { prisma } from "@/lib/db/prisma";

const SCENARIO_LABELS: Record<string, string> = {
  promo_week: "Promo Week",
  store_slump: "Store Slump",
  traffic_surge: "Traffic Surge",
  competitor_opening: "Competitor Opening",
};

export type ScenarioSpan = {
  slug: string;
  label: string;
  startDate: string;
  endDate: string;
  affectedStoreCount: number;
  storeId: string | null;
  storeName: string | null;
  storeUrl: string | null;
};

export type ScenarioTimelineData = {
  spans: ScenarioSpan[];
  timelineStart: string;
  timelineEnd: string;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function titleizeScenarioSlug(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export async function getScenarioTimeline(storeId?: string): Promise<ScenarioTimelineData> {
  const [scenarioRows, bounds] = await Promise.all([
    prisma.dailyStoreMetric.findMany({
      where: {
        scenarioSlug: { not: null },
        ...(storeId ? { storeId } : {}),
      },
      select: {
        date: true,
        scenarioSlug: true,
        storeId: true,
        store: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.dailyStoreMetric.aggregate({
      _min: { date: true },
      _max: { date: true },
    }),
  ]);

  if (!bounds._min.date || !bounds._max.date) {
    const today = toIsoDate(new Date());

    return {
      spans: [],
      timelineStart: today,
      timelineEnd: today,
    };
  }

  const groupedRows = new Map<
    string,
    {
      minDate: Date;
      maxDate: Date;
      stores: Map<string, { id: string; name: string }>;
    }
  >();

  for (const row of scenarioRows) {
    if (!row.scenarioSlug) {
      continue;
    }

    const existingGroup = groupedRows.get(row.scenarioSlug);

    if (existingGroup) {
      existingGroup.minDate = row.date < existingGroup.minDate ? row.date : existingGroup.minDate;
      existingGroup.maxDate = row.date > existingGroup.maxDate ? row.date : existingGroup.maxDate;

      if (!existingGroup.stores.has(row.storeId)) {
        existingGroup.stores.set(row.storeId, {
          id: row.store.id,
          name: row.store.name,
        });
      }

      continue;
    }

    groupedRows.set(row.scenarioSlug, {
      minDate: row.date,
      maxDate: row.date,
      stores: new Map([[row.storeId, { id: row.store.id, name: row.store.name }]]),
    });
  }

  const spans = Array.from(groupedRows.entries(), ([slug, group]) => {
    const affectedStores = Array.from(group.stores.values());
    const singleStore = affectedStores.length === 1 ? affectedStores[0] : null;

    return {
      slug,
      label: SCENARIO_LABELS[slug] ?? titleizeScenarioSlug(slug),
      startDate: toIsoDate(group.minDate),
      endDate: toIsoDate(group.maxDate),
      affectedStoreCount: affectedStores.length,
      storeId: singleStore?.id ?? null,
      storeName: singleStore?.name ?? null,
      storeUrl: singleStore ? `/stores/${singleStore.id}` : null,
    } satisfies ScenarioSpan;
  }).sort((left, right) => left.startDate.localeCompare(right.startDate));

  return {
    spans,
    timelineStart: toIsoDate(bounds._min.date),
    timelineEnd: toIsoDate(bounds._max.date),
  };
}
