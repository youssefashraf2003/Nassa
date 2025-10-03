-- Create studies table
CREATE TABLE public.studies (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('animal', 'plant', 'human', 'microbial')),
  mission TEXT NOT NULL,
  keyword TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('positive', 'negative', 'inconclusive', 'contradictory')),
  summary TEXT NOT NULL,
  abstract TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no auth required for browsing)
CREATE POLICY "Studies are viewable by everyone" 
ON public.studies 
FOR SELECT 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_studies_year ON public.studies(year);
CREATE INDEX idx_studies_type ON public.studies(type);
CREATE INDEX idx_studies_mission ON public.studies(mission);
CREATE INDEX idx_studies_outcome ON public.studies(outcome);
CREATE INDEX idx_studies_tags ON public.studies USING GIN(tags);

-- Insert sample data
INSERT INTO public.studies (id, title, year, type, mission, keyword, outcome, summary, abstract, tags) VALUES
(101, 'Long-term effects of cosmic radiation on murine neurogenesis', 2022, 'animal', 'ISS', 'DNA damage', 'contradictory',
  'Examines hippocampal neurogenesis in mice after exposure, finding mixed evidence of recovery.',
  'This groundbreaking study aboard the ISS utilized specialized habitats to monitor brain tissue response. While initial findings showed significant damage, subsequent analysis at 6-months post-mission showed unexpected repair mechanisms, leading to a ''contradictory'' tag.',
  ARRAY['Knowledge gap', 'Controversial finding', 'Radiation', 'Neuroscience']),

(102, 'Sustained Plant Growth in Artificial Martian Soil Analogues', 2024, 'plant', 'Mars Analog', 'regolith', 'positive',
  'Successfully demonstrated crop yield stability in simulated Martian regolith over 200 days.',
  'Investigating biomass production for future deep-space missions, this experiment focused on nutritional cycles and stress resistance in potato and lettuce varieties. The results provide high confidence for in-situ resource utilization (ISRU).',
  ARRAY['Consensus topic', 'Plant Growth', 'ISRU', 'Long-duration']),

(103, 'Cardiovascular deconditioning during 6-month microgravity exposure (Crew 4)', 2019, 'human', 'ISS', 'bone density', 'inconclusive',
  'Monitored crew vital signs, observing variability in cardiovascular adaptation patterns across individuals.',
  'Four crew members participated in an extensive protocol of lower body negative pressure (LBNP) and resistance training. While bone density universally declined, the cardiovascular response was highly individual, making a generalized conclusion difficult.',
  ARRAY['Human Physiology', 'Microgravity', 'Individual variability']),

(104, 'Microbial Ecology of the International Space Station Habitat', 2017, 'microbial', 'ISS', 'biofilm', 'positive',
  'Cataloged over 500 microbial species, confirming the stability of the ISS microbiome over several missions.',
  'Swab samples from interior surfaces were analyzed using next-generation sequencing. The resulting map of the station''s ''microbiome'' is crucial for developing better contaminant countermeasures.',
  ARRAY['Consensus topic', 'Microbial', 'Biofilm', 'Countermeasures']),

(105, 'DNA repair kinetics under low-dose, high-LET radiation', 2023, 'animal', 'Ground Sim', 'genomics', 'positive',
  'In-vitro study showing high-efficiency repair mechanism activation in specific human cell lines.',
  'Used a particle accelerator to simulate galactic cosmic rays (GCR). Demonstrated that a specific protein pathway is upregulated, offering potential targets for pharmaceutical intervention during transit.',
  ARRAY['Consensus topic', 'Radiation', 'Countermeasures', 'Genomics']),

(106, 'Metabolic changes in astronauts during short-duration Shuttle missions', 2010, 'human', 'Shuttle', 'nutrition', 'inconclusive',
  'Early study noting temporary shifts in lipid and glucose metabolism, but lacked longitudinal data.',
  'Analyzed blood and urine samples from 12 short-duration flights (7-14 days). While significant changes were noted post-flight, the study highlighted the need for longer duration monitoring to separate transient effects from adaptation.',
  ARRAY['Human Physiology', 'Nutrition', 'Short-duration', 'Knowledge gap']);