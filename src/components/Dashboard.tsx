import { MetricCard } from "./MetricCard";
import { BookOpen, FlaskConical, Sigma, CalendarDays, Activity, AlertTriangle, Star } from "lucide-react";
import { useStudyMetrics } from "@/hooks/useStudies";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

export const Dashboard = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { data: metrics } = useStudyMetrics();

  if (!metrics) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const maxCount = Math.max(...Object.values(metrics.timeline));
  const maxYear = Object.entries(metrics.timeline).find(([_, count]) => count === maxCount)?.[0];

  const insights = [
    { text: "Most studied topic: Bone density in microgravity.", icon: Activity, color: "text-green-400" },
    { text: "Knowledge gap: Long-term plant growth beyond 6 months.", icon: AlertTriangle, color: "text-accent" },
    { text: "Emerging topic: Epigenetic changes due to cosmic radiation.", icon: Star, color: "text-primary" }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      {/* Hero Section */}
      <Card className="text-center py-12 bg-card border-border/50">
        <h1 className="text-5xl md:text-6xl font-extrabold text-primary drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">
          NASA Bioscience Explorer
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          Summarizing {metrics.totalStudies} space bioscience studies for discovery, planning, and exploration.
        </p>

        <div className="mt-8 max-w-xl mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              type="text" 
              placeholder="Search by topic, experiment, or outcome..."
              className="w-full pl-12 pr-4 py-6 text-lg rounded-full bg-background border-card focus:ring-2 focus:ring-primary focus:border-primary transition"
              onFocus={() => onNavigate('explore')}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground hidden md:block">
            Try: "Radiation mitigation strategies" or "plant growth ISS"
          </p>
        </div>
      </Card>

      {/* Key Metrics */}
      <div>
        <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2 mb-6">Key Metrics Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard count={metrics.totalStudies} title="Total Studies" icon={BookOpen} />
          <MetricCard count={metrics.totalExperiments} title="Total Experiments" icon={FlaskConical} colorClass="text-accent" />
          <MetricCard count={metrics.keyTopics.length} title="Primary Topic Areas" icon={Sigma} colorClass="text-green-400" />
          <MetricCard count={`${maxCount} (${maxYear})`} title="Max Studies per Year" icon={CalendarDays} colorClass="text-purple-400" />
        </div>
      </div>

      {/* Featured AI Insights */}
      <div>
        <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2 mb-6">Featured AI Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, idx) => (
            <Card key={idx} className="p-4 bg-card border-border/50 flex items-start space-x-3 hover:bg-secondary transition">
              <insight.icon className={`w-5 h-5 ${insight.color} mt-1 flex-shrink-0`} />
              <p className="text-sm text-foreground">{insight.text}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div>
        <h2 className="text-3xl font-bold text-foreground border-b border-border pb-2 mb-6">Study Distribution Timeline</h2>
        <Card className="p-6 bg-card border-border/50">
          <div className="flex justify-between items-end h-64 relative">
            {Object.entries(metrics.timeline).map(([year, count]) => {
              const heightPercent = (count / maxCount) * 100;
              return (
                <div key={year} className="flex-1 flex flex-col items-center h-full justify-end group cursor-default mx-1">
                  <div 
                    className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:bg-accent" 
                    style={{ height: `${heightPercent}%` }}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">{year}</div>
                  <span className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary -translate-y-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">Growth in bioscience publications over time.</p>
        </Card>
      </div>
    </div>
  );
};
