import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <DashboardFrame
      activePath="/settings"
      eyebrow="Admin"
      title="Settings"
      description="Configure application preferences."
    >
      <Card className="p-8 text-center text-ink-700">
        <p className="text-lg font-medium text-ink-900">In Development</p>
        <p className="mt-2 text-sm">This section is coming soon.</p>
      </Card>
    </DashboardFrame>
  );
}
