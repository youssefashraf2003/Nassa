import { LayoutDashboard, Search, GitBranch, Lightbulb, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navigation = ({ currentPage, onNavigate }: NavigationProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore Studies', icon: Search },
    { id: 'graph', label: 'Knowledge Graph', icon: GitBranch },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'mission', label: 'Mission Planner', icon: Rocket },
  ];

  return (
    <nav className="bg-card border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-xl font-bold text-foreground">NASA Explorer</span>
          </div>
          <div className="flex space-x-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 flex items-center space-x-2",
                  currentPage === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
