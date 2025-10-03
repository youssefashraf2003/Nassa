import { Study } from "@/hooks/useStudies";
import { Card } from "./ui/card";
import { User, Leaf, Circle } from "lucide-react";
import { Badge } from "./ui/badge";

interface StudyCardProps {
  study: Study;
  onClick: () => void;
}

export const StudyCard = ({ study, onClick }: StudyCardProps) => {
  const getIcon = () => {
    switch (study.type) {
      case 'human': return User;
      case 'plant': return Leaf;
      default: return Circle;
    }
  };

  const Icon = getIcon();

  const getTagColor = (tags: string[]) => {
    if (tags.some(t => t.toLowerCase().includes("gap"))) return "bg-accent/20 text-accent border-accent";
    if (tags.some(t => t.toLowerCase().includes("consensus"))) return "bg-green-400/20 text-green-400 border-green-400";
    return "bg-primary/20 text-primary border-primary";
  };

  const primaryTag = study.tags.find(t => 
    t.toLowerCase().includes("gap") || 
    t.toLowerCase().includes("consensus") || 
    t.toLowerCase().includes("controversial")
  ) || study.type.toUpperCase();

  return (
    <Card 
      className="p-4 bg-card border-border/50 hover:border-primary/50 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-foreground hover:text-primary transition">
          {study.title} ({study.year})
        </h3>
        <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
      <p className="text-sm text-muted-foreground mt-2">{study.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className={getTagColor(study.tags)}>
          {primaryTag}
        </Badge>
      </div>
    </Card>
  );
};
