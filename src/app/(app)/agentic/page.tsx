import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { AgenticAuditPage } from "@/features/agentic/AgenticAuditPage";

export default function AgenticPage() {
  return (
    <DashboardFrame
      activePath="/agentic"
      description="Point-in-time analysis of code volume, estimated development effort, and the measurable impact of agentic development on this project."
      eyebrow="Meta"
      title="Agentic Audit"
    >
      <AgenticAuditPage />
    </DashboardFrame>
  );
}
