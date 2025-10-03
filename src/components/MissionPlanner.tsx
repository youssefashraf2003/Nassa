import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Rocket, Users, Leaf, Shield } from "lucide-react";

export const MissionPlanner = () => {
  const missionAreas = [
    {
      icon: Users,
      title: "Human Physiology",
      description: "Plan research on crew health, bone density, and cardiovascular adaptation",
      color: "text-primary"
    },
    {
      icon: Leaf,
      title: "Plant Biology",
      description: "Design experiments for sustainable food production in space",
      color: "text-green-400"
    },
    {
      icon: Shield,
      title: "Radiation Protection",
      description: "Develop countermeasures against cosmic radiation exposure",
      color: "text-accent"
    },
    {
      icon: Rocket,
      title: "Mission Integration",
      description: "Coordinate multi-disciplinary research for upcoming missions",
      color: "text-purple-400"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-foreground mb-6">🚀 Mission Planner</h1>
      <p className="text-muted-foreground mb-8">
        Plan and coordinate bioscience experiments for upcoming space missions based on existing knowledge and gaps.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {missionAreas.map((area) => (
          <Card key={area.title} className="p-6 bg-card border-border/50 hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-start space-x-4">
              <div className={`p-3 bg-background rounded-lg ${area.color}`}>
                <area.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">{area.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{area.description}</p>
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Plan Experiments
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-card border-border/50">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Upcoming Mission Schedule</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-background rounded-lg">
            <div>
              <h3 className="font-semibold text-foreground">ISS Expedition 72</h3>
              <p className="text-sm text-muted-foreground">Launch: Q2 2025 | Duration: 6 months</p>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80">
              Add Experiments
            </Button>
          </div>
          <div className="flex justify-between items-center p-4 bg-background rounded-lg">
            <div>
              <h3 className="font-semibold text-foreground">Artemis III</h3>
              <p className="text-sm text-muted-foreground">Launch: Q4 2026 | Duration: 30 days</p>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80">
              Add Experiments
            </Button>
          </div>
          <div className="flex justify-between items-center p-4 bg-background rounded-lg">
            <div>
              <h3 className="font-semibold text-foreground">Mars Sample Return</h3>
              <p className="text-sm text-muted-foreground">Launch: 2028 | Duration: 2 years</p>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80">
              Add Experiments
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
