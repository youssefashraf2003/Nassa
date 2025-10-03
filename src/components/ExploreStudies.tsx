import { useEffect, useMemo, useState } from "react";
import { useStudies, StudyFilters } from "@/hooks/useStudies";
import { StudyCard } from "./StudyCard";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface ExploreStudiesProps {
  onSelectStudy: (id: number) => void;
}

export const ExploreStudies = ({ onSelectStudy }: ExploreStudiesProps) => {
  const [filters, setFilters] = useState<StudyFilters>({});
  const [yearFilter, setYearFilter] = useState(2024);
  const [search, setSearch] = useState("");
  const { data: studies, isLoading } = useStudies(filters);

  // Debounce search input
  const debouncedSearch = useMemo(() => {
    let timeout: number | undefined;
    return (value: string, cb: (v: string) => void) => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => cb(value), 350);
    };
  }, []);

  useEffect(() => {
    debouncedSearch(search, (q) => {
      setFilters(prev => ({ ...prev, query: q || undefined }));
    });
  }, [search, debouncedSearch]);

  const applyFilters = () => {
    setFilters({
      ...filters,
      year: yearFilter,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-foreground mb-6">Explore Studies</h1>
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 mb-6 lg:mb-0">
          <Card className="p-6 bg-card border-border/50 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Filter Library</h2>

            {/* Year Range */}
            <div className="mb-5">
              <Label className="block text-foreground mb-2">Year Range (2010 - 2024)</Label>
              <input 
                type="range" 
                min="2010" 
                max="2024" 
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>2010</span>
                <span>{yearFilter}</span>
              </div>
            </div>

            {/* Type Filter */}
            <div className="mb-5">
              <Label className="block text-foreground mb-2">Experiment Type</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="animal">Animal</SelectItem>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="human">Human</SelectItem>
                  <SelectItem value="microbial">Microbial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outcome Filter */}
            <div className="mb-5">
              <Label className="block text-foreground mb-2">Outcome Type</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, outcome: value === 'all' ? undefined : value }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="inconclusive">Inconclusive</SelectItem>
                  <SelectItem value="contradictory">Contradictory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mission Filter */}
            <div className="mb-5">
              <Label className="block text-foreground mb-2">Mission Type</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, mission: value === 'all' ? undefined : value }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="All Missions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Missions</SelectItem>
                  <SelectItem value="ISS">ISS</SelectItem>
                  <SelectItem value="Shuttle">Shuttle</SelectItem>
                  <SelectItem value="Mars Analog">Mars Analog</SelectItem>
                  <SelectItem value="Ground Sim">Ground Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/80 font-bold transition shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </Card>
        </aside>

        {/* Results List */}
        <main className="lg:col-span-3">
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, keyword, abstract..."
              className="w-full px-4 py-3 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-muted-foreground">
              Showing {studies?.length || 0} Studies
            </h2>
            <Button variant="ghost" className="text-primary hover:text-accent transition">
              <Download className="w-4 h-4 mr-2" />
              Export Summaries
            </Button>
          </div>
          <div className="space-y-4">
            {studies?.map(study => (
              <StudyCard 
                key={study.id} 
                study={study} 
                onClick={() => onSelectStudy(study.id)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
