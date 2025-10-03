import os
import re
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class Paper(BaseModel):
    title: str
    url: Optional[str] = None
    abstract: str
    conclusion: str


class QueryResponse(BaseModel):
    query: str
    results: List[Paper]


class AnswerResponse(BaseModel):
    query: str
    answer: str
    sources: List[Paper]


CSV_CANDIDATES = [
    os.path.join(os.getcwd(), "paper_summaries.csv"),
    os.path.join(os.getcwd(), "html-data-sync-main", "paper_summaries.csv"),
    os.path.abspath(os.path.join(os.getcwd(), "..", "paper_summaries.csv")),
]


def load_corpus():
    csv_path = None
    for p in CSV_CANDIDATES:
        if os.path.exists(p):
            csv_path = p
            break
    if not csv_path:
        raise FileNotFoundError(f"paper_summaries.csv not found. Checked: {CSV_CANDIDATES}")

    df = pd.read_csv(csv_path)
    # Normalize expected columns
    cols = {c.lower(): c for c in df.columns}
    title_col = cols.get("title")
    url_col = cols.get("url")
    abstract_col = cols.get("abstract")
    conclusion_col = cols.get("conclusion")

    if not title_col or not abstract_col or not conclusion_col:
        raise ValueError("CSV must contain Title, Abstract, Conclusion columns")

    titles = df[title_col].fillna("").astype(str).tolist()
    urls = df[url_col].fillna("").astype(str).tolist() if url_col else [""] * len(titles)
    abstracts = df[abstract_col].fillna("").astype(str).tolist()
    conclusions = df[conclusion_col].fillna("").astype(str).tolist()

    docs = []
    for t, a, c in zip(titles, abstracts, conclusions):
        # Build a searchable text field
        docs.append(f"{t} \n {a} \n {c}")
    return titles, urls, abstracts, conclusions, docs


titles, urls, abstracts, conclusions, documents = load_corpus()

# Determine if Gemini can be used
_gemini_key = os.environ.get("GOOGLE_API_KEY")
try:
    import google.generativeai as _genai  # type: ignore
    _gemini_sdk = True
except Exception:
    _gemini_sdk = False

vectorizer = TfidfVectorizer(
    stop_words="english",
    ngram_range=(1, 2),
    max_df=0.95,
    min_df=2,
)
tfidf = vectorizer.fit_transform(documents)

app = FastAPI(title="Local RAG over paper_summaries.csv")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "num_papers": len(titles),
        "gemini_active": bool(_gemini_key) and _gemini_sdk,
        "gemini_model": os.environ.get("GEMINI_MODEL", "gemini-1.5-flash") if (bool(_gemini_key) and _gemini_sdk) else None,
    }


@app.get("/query", response_model=QueryResponse)
def query(q: str, k: int = 5):
    query_text = q.strip()
    # Light normalization
    simple = re.sub(r"\s+", " ", query_text)
    if not simple:
        return {"query": q, "results": []}

    q_vec = vectorizer.transform([simple])
    sims = cosine_similarity(q_vec, tfidf).flatten()
    top_idx = sims.argsort()[::-1][:k]

    results: List[Paper] = []
    for idx in top_idx:
        if sims[idx] <= 0:
            continue
        results.append(Paper(
            title=titles[idx],
            url=urls[idx] if urls else None,
            abstract=abstracts[idx],
            conclusion=conclusions[idx],
        ))
    return {"query": q, "results": results}


def synthesize_answer(query_text: str, papers: List[Paper], intent: str = "generic") -> str:
    # Prefer Gemini if GOOGLE_API_KEY is set
    g_api_key = os.environ.get("GOOGLE_API_KEY")
    if g_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=g_api_key)
            model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
            model = genai.GenerativeModel(model_name)
            context = "\n\n".join([
                f"Title: {p.title}\nAbstract: {p.abstract}\nConclusion: {p.conclusion}" for p in papers
            ])
            if intent == "yesno":
                style = (
                    "Answer YES or NO in one short sentence, then add 2-4 bullets of evidence "
                    "from the context with study-specific facts."
                )
            elif intent == "definition":
                style = (
                    "Give a 2-3 sentence definition/summary, then 2-4 bullets with key findings."
                )
            elif intent == "compare":
                style = (
                    "Give 2-5 contrastive bullets prefixed with A:/B: (or clear labels) comparing the items."
                )
            else:
                style = "Write a concise answer (3-6 bullet points)."

            prompt = (
                "You are an assistant summarizing NASA bioscience publications. "
                "Use ONLY the provided context; do not speculate.\n\n"
                f"Question: {query_text}\n\nContext:\n{context}\n\n"
                f"Formatting: {style}"
            )
            resp = model.generate_content(prompt)
            if hasattr(resp, "text") and resp.text:
                return resp.text
        except Exception:
            # Fall back to heuristic synthesis below
            pass

    # Heuristic synthesis: stitch abstracts/conclusions
    if not papers:
        return "No matching evidence found in the local corpus."

    top = papers[:5]
    if intent == "yesno":
        # Heuristic: provide neutral sentence + evidence
        lines = ["Evidence summary (could support YES or NO depending on specifics):"]
        lines += [f"• {p.title}: {(p.conclusion or p.abstract or '').replace('\n',' ')[:200]}" for p in top]
        return "\n".join(lines)
    elif intent == "definition":
        head = (top[0].abstract or top[0].conclusion or "").split(". ")[:2]
        lead = ". ".join(head)[:240]
        bullets = [f"• {p.title}: {(p.conclusion or p.abstract or '').replace('\n',' ')[:200]}" for p in top]
        return f"{lead}\n" + "\n".join(bullets)
    elif intent == "compare":
        bullets = [f"• {p.title}: {(p.conclusion or p.abstract or '').replace('\n',' ')[:200]}" for p in top]
        return "Comparison sources:\n" + "\n".join(bullets)
    else:
        bullets = [f"• {p.title}: {(p.conclusion or p.abstract or '').replace('\n',' ')[:200]}" for p in top]
        return "Here is a synthesized answer from relevant papers:\n" + "\n".join(bullets)


@app.get("/answer", response_model=AnswerResponse)
def answer(q: str, k: int = 5, intent: str = "generic"):
    qr = query(q=q, k=k)
    papers = qr["results"] if isinstance(qr, dict) else []
    # Bias synthesis prompt by intent using a light wrapper
    if intent in ("yesno", "definition", "compare"):
        q_aug = f"({intent}) {q}"
    else:
        q_aug = q
    ans = synthesize_answer(q_aug, papers, intent=intent)
    return {"query": q, "answer": ans, "sources": papers}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


