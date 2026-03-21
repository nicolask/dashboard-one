import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Card } from "@/components/ui/card";

const cards = [
  {
    title: "Auth status",
    value: "Local credentials",
    detail: "Planned seam for OIDC and provider-backed identity later.",
  },
  {
    title: "Data sources",
    value: "0 connected",
    detail: "External systems can be added behind sync jobs and cache tables.",
  },
  {
    title: "Storage path",
    value: "SQLite first",
    detail: "Model for easy Prisma migration to PostgreSQL when needed.",
  },
];

export default async function DashboardPage() {
  return (
    <DashboardFrame
      eyebrow="Dashboard"
      title="Authenticated dashboard"
      description="This first protected area now sits behind a real local credentials login, with room for stronger session and provider-backed auth later."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card className="space-y-3" key={card.title}>
            <p className="text-sm font-medium text-ink-700">{card.title}</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              {card.value}
            </h2>
            <p className="text-sm leading-6 text-ink-700">{card.detail}</p>
          </Card>
        ))}
      </section>
    </DashboardFrame>
  );
}
