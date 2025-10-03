import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const Chatbot = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ask me about NASA bioscience studies. Try 'radiation countermeasures on ISS'." }
  ]);

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    // Handle greetings/small talk without querying the database
    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9\s\?]/g, "").trim();
    const greetingOnly = /^(hi|hello|hey|yo|salaam|salam|morning|evening|sup|how are you|what's up|whats up|bonjour|hola|ciao|hallo)[\.!\s]*$/i.test(normalized);
    const hasQuestionMark = normalized.includes("?");
    const contentTokens = normalized.split(/\s+/).filter(t => t.length >= 3);

    if (greetingOnly || contentTokens.length === 0) {
      const reply = "Hello! I can answer questions about NASA bioscience publications. Try asking about a topic, mission, or year (e.g., 'radiation ISS 2023' or 'plant growth microgravity').";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      return;
    }

    // If the query is too short (e.g., "hi", "ok"), show tips and recent studies
    if (trimmed.length < 3) {
      const { data } = await supabase
        .from('studies')
        .select('id,title,year,summary,mission')
        .order('year', { ascending: false })
        .limit(5);
      const tips = "Try asking about topics, missions, or years (e.g., 'radiation ISS 2023').";
      const bullets = (data || []).map(s => `• ${s.title} (${s.year}, ${s.mission}) – ${s.summary}`);
      setMessages(prev => [...prev, { role: "assistant", content: `${tips}${bullets.length ? `\nRecent studies:\n${bullets.join('\n')}` : ''}` }]);
      return;
    }

    // Lightweight intent classifier
    const classifyIntent = (text: string): "greeting" | "definition" | "yesno" | "compare" | "paper_lookup" | "generic" => {
      const t = text.toLowerCase();
      if (/^(hi|hello|hey|yo|salaam|salam|bonjour|hola|ciao|hallo)[\s\.!]*$/.test(t)) return "greeting";
      if (/\bwhat is\b|\bdefine\b|\bexplain\b/.test(t)) return "definition";
      if (/^(is|are|does|do|can|will|should)\b/.test(t)) return "yesno";
      if (/\bcompare\b|\bvs\b|\bversus\b/.test(t)) return "compare";
      if (/(ISS|Shuttle|Mars Analog|Ground Sim|\b(19|20)\d{2}\b)/i.test(text)) return "paper_lookup";
      return "generic";
    };

    const intent = classifyIntent(trimmed);

    // Call local RAG server first (if running)
    const q = trimmed.replace(/%/g, "");
    try {
      // Prefer an LLM-like synthesized answer if available
      const ans = await fetch(`http://127.0.0.1:8000/answer?q=${encodeURIComponent(q)}&k=5&intent=${encodeURIComponent(intent)}`);
      if (ans.ok) {
        const json = await ans.json();
        if (json?.answer) {
          const sources = (json.sources || []).map((s: any) => `• ${s.title}`).join('\n');
          const msg = `${json.answer}${sources ? `\nSources:\n${sources}` : ''}`;
          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
          return;
        }
      }
      // Fallback to returning top matches
      const res = await fetch(`http://127.0.0.1:8000/query?q=${encodeURIComponent(q)}&k=5`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json?.results?.length) {
          const results = json.results as Array<{title: string; abstract?: string; conclusion?: string}>;
          const top = results.slice(0, 5);
          let answer: string;
          if (intent === "definition") {
            const points = top.map(s => `• ${s.title} – ${(s.abstract||s.conclusion||"").slice(0,160)}`);
            answer = `Here’s what the papers indicate:\n${points.join('\n')}`;
          } else if (intent === "yesno") {
            const points = top.map(s => `• ${s.title} – ${(s.conclusion||s.abstract||"").slice(0,140)}`);
            answer = `Relevant evidence:\n${points.join('\n')}`;
          } else if (intent === "compare") {
            const points = top.map(s => `• ${s.title} – ${(s.summary||s.abstract||s.conclusion||"").slice(0,140)}`);
            answer = `Comparison sources:\n${points.join('\n')}`;
          } else {
            const bullets = top.map(s => `• ${s.title} – ${(s.summary||s.abstract||s.conclusion||"").slice(0,180)}`);
            answer = `From local knowledge (RAG):\n${bullets.join('\n')}`;
          }
          setMessages(prev => [...prev, { role: "assistant", content: answer }]);
          return;
        }
      }
    } catch (_) {
      // RAG server likely not running; fall back to Supabase
    }

    // Fallback: query Supabase with fuzzy ilike across key fields
    let { data, error } = await supabase
      .from('studies')
      .select('id,title,year,summary,mission,keyword')
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%,abstract.ilike.%${q}%,keyword.ilike.%${q}%`)
      .order('year', { ascending: false })
      .limit(8);

    if (error) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error querying studies: ${error.message}` }]);
      return;
    }

    // Fallback: tokenize and search any token >=3 chars across fields
    if (!data || data.length === 0) {
      const tokens = q
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(t => t.length >= 3 && !['the','and','for','with','from','that','this','into','over','under','space','study','studies'].includes(t));

      const yearMatch = q.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? Number(yearMatch[0]) : undefined;

      if (tokens.length > 0 || year) {
        const orParts = tokens.map(t => `title.ilike.%${t}%`)
          .concat(tokens.map(t => `summary.ilike.%${t}%`))
          .concat(tokens.map(t => `abstract.ilike.%${t}%`))
          .concat(tokens.map(t => `keyword.ilike.%${t}%`));

        let query = supabase
          .from('studies')
          .select('id,title,year,summary,mission,keyword')
          .order('year', { ascending: false })
          .limit(8);

        if (orParts.length > 0) {
          query = query.or(orParts.join(','));
        }
        if (year) {
          query = query.eq('year', year);
        }

        const res2 = await query;
        error = res2.error as any;
        data = res2.data as any;
        if (error) {
          setMessages(prev => [...prev, { role: "assistant", content: `Error querying studies: ${error.message}` }]);
          return;
        }
      }
    }

    if (!data || data.length === 0) {
      const offTopic = /\b(time|date|weather|your name|who are you|what are you|resources|source|hello|hi|hey)\b/i.test(q);
      if (offTopic) {
        setMessages(prev => [...prev, { role: "assistant", content: "I'm your NASA bioscience copilot. I answer using the publications loaded from your paper_summaries.csv and Supabase. Ask me about topics, missions (ISS, Shuttle, Mars Analog), or years." }]);
        return;
      }
      // Final fallback: show recent studies so the user sees results and examples
      const { data: recent } = await supabase
        .from('studies')
        .select('id,title,year,summary,mission')
        .order('year', { ascending: false })
        .limit(5);
      const help = "I couldn't find relevant studies. Try keywords like 'radiation', 'plant growth', 'microgravity', add a mission (ISS, Shuttle), or include a year (e.g., 2019).";
      const bullets = (recent || []).map(s => `• ${s.title} (${s.year}, ${s.mission}) – ${s.summary}`);
      setMessages(prev => [...prev, { role: "assistant", content: bullets.length ? `${help}\nHere are recent studies:\n${bullets.join('\n')}` : help }]);
      return;
    }

    const bullets = data.map(s => `• ${s.title} (${s.year}, ${s.mission}) – ${s.summary}`);
    const answer = intent === "definition"
      ? `Here’s what the studies indicate:\n${bullets.join('\n')}`
      : intent === "yesno"
      ? `Relevant evidence:\n${bullets.join('\n')}`
      : intent === "compare"
      ? `Comparison sources:\n${bullets.join('\n')}`
      : `Here are ${data.length} relevant studies:\n${bullets.join('\n')}`;
    setMessages(prev => [...prev, { role: "assistant", content: answer }]);
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[90vw] z-50">
      <Card className="p-3 bg-card border-border/50 shadow-xl">
        <div className="text-sm font-semibold mb-2 text-primary">Mission Copilot</div>
        <div className="h-64 overflow-y-auto space-y-2 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`text-sm whitespace-pre-wrap ${m.role === 'assistant' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {m.content}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about outcomes, topics, missions..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
          />
          <Button size="sm" onClick={onSend} className="px-4">Send</Button>
        </div>
      </Card>
    </div>
  );
};


