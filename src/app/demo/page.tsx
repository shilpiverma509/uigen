import { StatsCard } from "@/components/ui/stats-card";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-10">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">StatsCard Demo</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Interactive stats card component — click the buttons to update the value.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={12483}
          trend="up"
          trendValue="12.5%"
          description="vs last month"
        />
        <StatsCard
          title="Revenue"
          value={48290}
          unit="$"
          trend="up"
          trendValue="8.2%"
          description="vs last month"
        />
        <StatsCard
          title="Churn Rate"
          value={3}
          unit="%"
          trend="down"
          trendValue="0.4%"
          description="vs last month"
        />
        <StatsCard
          title="Components Generated"
          value={1024}
          trend="up"
          trendValue="32%"
          description="this week"
        />
        <StatsCard
          title="Avg Response Time"
          value={240}
          unit="ms"
          trend="neutral"
          description="no change"
        />
        <StatsCard
          title="Active Projects"
          value={57}
          trend="up"
          trendValue="5"
          description="new this week"
        />
      </div>
    </main>
  );
}
