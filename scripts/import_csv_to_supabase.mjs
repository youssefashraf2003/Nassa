import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Resolve CSV path whether running from repo root or project subfolder
const candidates = [
  path.resolve(process.cwd(), 'paper_summaries.csv'),
  path.resolve(process.cwd(), '../paper_summaries.csv'),
  path.resolve(process.cwd(), '../../paper_summaries.csv'),
];

const csvPath = candidates.find(p => fs.existsSync(p));
if (!csvPath) {
  console.error('paper_summaries.csv not found. Checked:', candidates);
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8');
const records = parse(csv, { columns: true, skip_empty_lines: true });

function toStudy(row, idx) {
  const title = row.Title?.trim();
  const abstract = row.Abstract?.trim() || '';
  const conclusion = row.Conclusion?.trim() || '';
  const url = row.URL?.trim();

  const yearMatch = abstract.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : 2018 + (idx % 7);

  const summary = (conclusion || abstract).slice(0, 280);
  const keyword = (title?.split(':')[0] || 'space biology').slice(0, 60);
  const type = title?.toLowerCase().includes('plant') ? 'plant' : title?.toLowerCase().includes('mouse') || title?.toLowerCase().includes('mice') ? 'animal' : 'human';
  const mission = abstract.toLowerCase().includes('iss') ? 'ISS' : abstract.toLowerCase().includes('shuttle') ? 'Shuttle' : abstract.toLowerCase().includes('mars') ? 'Mars Analog' : 'Ground Sim';
  const outcome = conclusion.toLowerCase().includes('increase') || conclusion.toLowerCase().includes('improve') ? 'positive' : conclusion.toLowerCase().includes('decrease') || conclusion.toLowerCase().includes('reduce') ? 'negative' : 'inconclusive';
  const tags = [keyword, mission, outcome, 'from-csv'];

  return {
    title,
    year,
    type,
    mission,
    keyword,
    outcome,
    summary,
    abstract: abstract || summary,
    tags
  };
}

(async () => {
  const studies = records.map(toStudy);
  // Upsert in batches to avoid payload limits
  const batchSize = 500;
  for (let i = 0; i < studies.length; i += batchSize) {
    const batch = studies.slice(i, i + batchSize);
    const { error } = await supabase.from('studies').insert(batch);
    if (error) {
      console.error('Upsert error:', error.message);
      process.exit(1);
    }
    console.log(`Imported ${Math.min(i + batch.length, studies.length)} / ${studies.length}`);
  }
  console.log('Import complete.');
})();


