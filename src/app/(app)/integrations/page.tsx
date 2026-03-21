import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Card } from "@/components/ui/card";

export default function IntegrationsPage() {
  return (
    <DashboardFrame
      activePath="/integrations"
      eyebrow="Admin"
      title="Integrations"
      description="Connect external data sources and tools."
    >
      <Card className="p-8 text-center text-ink-700">
        <p className="text-lg font-medium text-ink-900">In Development</p>
        <p className="mt-2 text-sm">This section is coming soon.</p>
      </Card>
    </DashboardFrame>
  );
}
