import { useStudy } from "@/hooks/useStudies";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, ExternalLink, GitBranch } from "lucide-react";

interface StudyDetailsProps {
  studyId: number;
  onBack: () => void;
}

export const StudyDetails = ({ studyId, onBack }: StudyDetailsProps) => {
  const { data: study, isLoading } = useStudy(studyId);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!study) {
    return (
      <div className="p-8 text-center text-destructive">
        Study not found. ID: {studyId}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Button 
        variant="ghost" 
        className="text-primary hover:text-accent mb-4"
        onClick={onBack}
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        Back to Explore Studies
      </Button>

      <Card className="p-8 bg-card border-border/50">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{study.title}</h1>
        <p className="mt-2 text-md text-muted-foreground">
          Citation: NASA Bioscience Journal, {study.year}, Vol 15. DOI: {study.id}-NASA-{study.year}
        </p>

        <div className="mt-6 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold text-primary mb-3">AI Summary</h2>
          <p className="text-foreground leading-relaxed italic">
            {study.abstract.substring(0, 100)}... <span className="font-normal text-muted-foreground">
              This AI-generated summary highlights the primary findings regarding {study.keyword} and its implications for {study.type} biology in space.
            </span>
          </p>
          <Button variant="link" className="mt-4 text-accent hover:text-accent/80 p-0">
            View Full Publication <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Key Terms & Topics</h2>
          <div className="flex flex-wrap gap-2">
            {study.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-card text-muted-foreground border-border/50">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Knowledge Graph Mini-View (Simulated)</h2>
          <div className="h-48 bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground">
            <GitBranch className="w-6 h-6 mr-2 text-primary" />
            Visualization: This study is a <span className="text-primary mx-1">core node</span> connecting <strong>{study.keyword}</strong> to <strong>{study.type}</strong> experiments.
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Related Studies</h2>
          <div className="space-y-3">
            <Card className="p-3 bg-background border-border/50 hover:bg-secondary cursor-pointer transition">
              <p className="text-foreground">Study 105: DNA repair kinetics under low-dose, high-LET radiation</p>
              <span className="text-xs text-green-400">High Relevance: Radiation | Genomics</span>
            </Card>
            <Card className="p-3 bg-background border-border/50 hover:bg-secondary cursor-pointer transition">
              <p className="text-foreground">Study 101: Long-term effects of cosmic radiation on murine neurogenesis</p>
              <span className="text-xs text-primary">Medium Relevance: Same Mission Type</span>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};
