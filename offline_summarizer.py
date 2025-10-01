import heapq
import re
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer

# --- Self-Contained NLP Functions (No NLTK needed) ---

def simple_sent_tokenize(text):
    if not text: return []
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]

def simple_word_tokenize(text):
    return re.findall(r'\b[a-z]+\b', text.lower())

STOP_WORDS = set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot',
    'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
    'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
    'in', 'into', 'is', 'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of',
    'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
    'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
    'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
    'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
])

def summarize_text_tfidf(text, num_sentences=5):
    if not text or "Error:" in text: return text
    sentences = simple_sent_tokenize(text)
    if len(sentences) <= num_sentences: return text
    vectorizer = TfidfVectorizer(tokenizer=simple_word_tokenize, stop_words=list(STOP_WORDS))
    try:
        tfidf_matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return "Error: Could not process text for summarization."
    sentence_scores = tfidf_matrix.sum(axis=1)
    top_indices = heapq.nlargest(num_sentences, range(len(sentence_scores)), key=lambda i: sentence_scores[i])
    top_indices.sort()
    return ' '.join([sentences[i] for i in top_indices])


class OfflineAgent:
    def _find_section_text(self, soup, section_keywords):
        # Strategies 1 & 2: Find by ID or class name (most reliable)
        for keyword in section_keywords:
            tag = soup.find(['div', 'section'], id=re.compile(keyword, re.IGNORECASE))
            if tag: return tag.get_text(separator=' ', strip=True)
            tag = soup.find(['div', 'section'], class_=re.compile(keyword, re.IGNORECASE))
            if tag: return tag.get_text(separator=' ', strip=True)

        # Strategy 3: Find by heading text
        for tag_name in ['h1', 'h2', 'h3', 'h4', 'strong', 'b']:
            for heading in soup.find_all(tag_name):
                heading_text = heading.get_text(strip=True).lower()
                if any(kw in heading_text for kw in section_keywords) and len(heading_text) < 40:
                    content = [sibling.get_text(separator=' ', strip=True) for sibling in heading.find_next_siblings() if sibling.name not in ['h1', 'h2', 'h3'] and sibling.get_text(strip=True)]
                    if content: return ' '.join(content)
        
        return None

    def extract_and_summarize_sections(self, html_content, source_identifier=""):
        if not html_content:
            return {"abstract": "Error: No HTML content.", "conclusion": "Error: No HTML content."}
        
        print(f"  -> Agent is analyzing content from: {source_identifier}...")
        soup = BeautifulSoup(html_content, 'html.parser')
        
        abstract_text = self._find_section_text(soup, ['abstract', 'background'])
        conclusion_text = self._find_section_text(soup, ['conclusion', 'conclusions', 'summary', 'discussion', 'concluding remarks'])
        
        abstract_summary = summarize_text_tfidf(abstract_text, num_sentences=4) if abstract_text else None
        conclusion_summary = summarize_text_tfidf(conclusion_text, num_sentences=3) if conclusion_text else None
            
        # --- NEW: Intelligent Fallback Logic ---
        # If either section is missing, generate a full summary to fill the gap.
        if not abstract_summary or not conclusion_summary:
            print(f"  -> Agent could not find one or both sections. Generating a full article summary as a fallback.")
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            full_text = ""
            if main_content:
                full_text = main_content.get_text(separator=' ', strip=True)
            
            if len(full_text) > 500: # Ensure there is enough text to summarize
                general_summary = summarize_text_tfidf(full_text, num_sentences=5)
                
                # Fill in the missing sections with the general summary
                if not abstract_summary:
                    abstract_summary = f"[Abstract Not Found; Full Article Summary]: {general_summary}"
                if not conclusion_summary:
                    conclusion_summary = f"[Conclusion Not Found; Full Article Summary]: {general_summary}"
            else:
                if not abstract_summary: abstract_summary = "Agent could not find a valid 'Abstract' section."
                if not conclusion_summary: conclusion_summary = "Agent could not find a valid 'Conclusion' or 'Summary' section."
        
        return {"abstract": abstract_summary, "conclusion": conclusion_summary}

