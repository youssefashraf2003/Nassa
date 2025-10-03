import { Card } from "./ui/card";
import { Activity, TrendingUp, AlertTriangle } from "lucide-react";

export const InsightsView = () => {
  const consensusData = [
    { topic: "Bone Loss", consensus: 85, contradiction: 15 },
    { topic: "DNA Damage", consensus: 60, contradiction: 40 },
    { topic: "Plant Stress", consensus: 75, contradiction: 25 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-foreground mb-6">📊 Insights & Analytics</h1>
      <p className="text-muted-foreground mb-8">
        Deep dive into consensus patterns, contradictory findings, and emerging research trends.
      </p>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 mb-6">Consensus Heatmap</h2>
          <div className="space-y-4">
            {consensusData.map((item) => (
              <Card key={item.topic} className="p-6 bg-card border-border/50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-foreground">{item.topic}</h3>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{item.consensus + item.contradiction} studies</span>
                  </div>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-400 transition-all duration-500" 
                    style={{ width: `${item.consensus}%` }}
                  />
                  <div 
                    className="bg-accent transition-all duration-500" 
                    style={{ width: `${item.contradiction}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-green-400">{item.consensus}% Consensus</span>
                  <span className="text-accent">{item.contradiction}% Contradictory</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border/50">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Trending Research Areas</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex justify-between text-sm">
                <span className="text-muted-foreground">Epigenetic Changes</span>
                <span className="text-primary font-medium">+45% growth</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted-foreground">ISRU Technologies</span>
                <span className="text-primary font-medium">+38% growth</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted-foreground">Microbiome Studies</span>
                <span className="text-primary font-medium">+32% growth</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-card border-border/50">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-accent" />
              <h3 className="text-xl font-semibold text-foreground">Critical Knowledge Gaps</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex justify-between text-sm">
                <span className="text-muted-foreground">Long-term Plant Growth</span>
                <span className="text-accent font-medium">High Priority</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted-foreground">Radiation Countermeasures</span>
                <span className="text-accent font-medium">High Priority</span>
              </li>
              <li className="flex justify-between text-sm">
                <span className="text-muted-foreground">Crew Psychology</span>
                <span className="text-accent font-medium">Medium Priority</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
