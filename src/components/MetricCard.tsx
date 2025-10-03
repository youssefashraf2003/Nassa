import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";

interface MetricCardProps {
  count: number | string;
  title: string;
  icon: LucideIcon;
  colorClass?: string;
}

export const MetricCard = ({ count, title, icon: Icon, colorClass = "text-primary" }: MetricCardProps) => {
  return (
    <Card className="p-6 bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]">
      <div className="flex items-center justify-between">
        <span className={`p-3 rounded-full bg-background ${colorClass} text-2xl`}>
          <Icon className="w-6 h-6" />
        </span>
        <p className={`text-3xl font-bold ${colorClass}`}>{count}</p>
      </div>
      <p className="mt-4 text-muted-foreground uppercase tracking-wider text-sm">{title}</p>
    </Card>
  );
};
