import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Study {
  id: number;
  title: string;
  year: number;
  type: 'animal' | 'plant' | 'human' | 'microbial';
  mission: string;
  keyword: string;
  outcome: 'positive' | 'negative' | 'inconclusive' | 'contradictory';
  summary: string;
  abstract: string;
  tags: string[];
}

export interface StudyFilters {
  year?: number;
  type?: string;
  outcome?: string;
  mission?: string;
  query?: string;
}

export const useStudies = (filters?: StudyFilters) => {
  return useQuery({
    queryKey: ['studies', filters],
    queryFn: async () => {
      let query = supabase
        .from('studies')
        .select('*')
        .order('year', { ascending: false });

      if (filters?.year) {
        query = query.lte('year', filters.year);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.outcome) {
        query = query.eq('outcome', filters.outcome);
      }
      if (filters?.mission) {
        query = query.eq('mission', filters.mission);
      }

      if (filters?.query && filters.query.trim().length > 0) {
        const q = filters.query.trim();
        // Search across multiple text columns
        query = query.or(
          `title.ilike.%${q}%,summary.ilike.%${q}%,abstract.ilike.%${q}%,keyword.ilike.%${q}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Study[];
    },
  });
};

export const useStudy = (id: number | null) => {
  return useQuery({
    queryKey: ['study', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('studies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Study;
    },
    enabled: !!id,
  });
};

export const useStudyMetrics = () => {
  return useQuery({
    queryKey: ['study-metrics'],
    queryFn: async () => {
      const { data: studies, error } = await supabase
        .from('studies')
        .select('year, tags');

      if (error) throw error;

      const totalStudies = studies?.length || 0;
      const timeline: Record<number, number> = {};
      const allTags = new Set<string>();

      studies?.forEach(study => {
        timeline[study.year] = (timeline[study.year] || 0) + 1;
        study.tags?.forEach((tag: string) => allTags.add(tag));
      });

      return {
        totalStudies,
        totalExperiments: Math.floor(totalStudies * 2.05), // Simulated metric
        keyTopics: Array.from(allTags).slice(0, 4),
        timeline,
      };
    },
  });
};
