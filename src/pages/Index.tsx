import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { ExploreStudies } from "@/components/ExploreStudies";
import { StudyDetails } from "@/components/StudyDetails";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { InsightsView } from "@/components/InsightsView";
import { MissionPlanner } from "@/components/MissionPlanner";
import { Chatbot } from "@/components/Chatbot";

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== 'details') {
      setSelectedStudyId(null);
    }
  };

  const handleSelectStudy = (id: number) => {
    setSelectedStudyId(id);
    setCurrentPage('details');
  };

  const handleBackFromDetails = () => {
    setCurrentPage('explore');
    setSelectedStudyId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="min-h-[calc(100vh-4rem)]">
        {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {currentPage === 'explore' && <ExploreStudies onSelectStudy={handleSelectStudy} />}
        {currentPage === 'details' && selectedStudyId && (
          <StudyDetails studyId={selectedStudyId} onBack={handleBackFromDetails} />
        )}
        {currentPage === 'graph' && <KnowledgeGraph />}
        {currentPage === 'insights' && <InsightsView />}
        {currentPage === 'mission' && <MissionPlanner />}
        <Chatbot />
      </main>
    </div>
  );
};

export default Index;
