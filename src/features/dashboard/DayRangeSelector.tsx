"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DAY_OPTIONS = [7, 30, 90] as const;

type DayRangeSelectorProps = {
  currentDays: number;
};

export function DayRangeSelector({ currentDays }: DayRangeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(days: (typeof DAY_OPTIONS)[number]) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_14px_30px_rgb(15_23_42_/_0.08)] backdrop-blur">
      {DAY_OPTIONS.map((days) => {
        const isActive = currentDays === days;

        return (
          <button
            aria-pressed={isActive}
            className={[
              "min-w-16 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
              isActive
                ? "bg-brand-500 text-white shadow-[0_12px_24px_rgb(8_145_178_/_0.22)]"
                : "text-ink-700 hover:-translate-y-0.5 hover:bg-brand-100 hover:text-ink-900",
            ].join(" ")}
            key={days}
            onClick={() => handleSelect(days)}
            type="button"
          >
            {days}d
          </button>
        );
      })}
    </div>
  );
}
