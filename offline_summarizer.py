import heapq
import re
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer

# --- Self-Contained NLP Functions (No NLTK needed) ---

def simple_sent_tokenize(text):
    """
    Improved sentence tokenizer that better handles scientific citations and abbreviations.
    """
    if not text: return []
    # Remove citations like [1], [2, 3] and normalize whitespace
    text = re.sub(r'\s*\[\d+(, ?\d+)*\]\s*', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    # Split by sentence-ending punctuation, but not when it's part of an abbreviation (e.g., et al.)
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', text)
    # Filter out any very short, likely incomplete sentences or fragments
    return [s.strip() for s in sentences if len(s.strip()) > 15]

def simple_word_tokenize(text):
    """Improved word tokenizer to only include meaningful words."""
    return re.findall(r'\b[a-z]{3,}\b', text.lower()) # Only include words with 3+ letters

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
    'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'also', 'however', 'therefore'
])

def summarize_text_tfidf(text, num_sentences=5):
    """
    Summarizes text using TF-IDF with the improved, self-contained tokenizers.
    """
    if not text or "Error:" in text: return text
    sentences = simple_sent_tokenize(text)
    if len(sentences) <= num_sentences: return text
    
    vectorizer = TfidfVectorizer(tokenizer=simple_word_tokenize, stop_words=list(STOP_WORDS))
    
    try:
        tfidf_matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return "Error: Could not process text for summarization (it may be too short or lack meaningful words)."
        
    sentence_scores = tfidf_matrix.sum(axis=1)
    
    num_sentences = min(num_sentences, len(sentences))
    
    top_indices = heapq.nlargest(num_sentences, range(len(sentence_scores)), key=lambda i: sentence_scores[i])
    top_indices.sort()
    
    return ' '.join([sentences[i] for i in top_indices])


class OfflineAgent:
    """
    The definitive offline AI agent for extracting and summarizing scientific papers.
    It uses aggressive HTML cleaning and intelligent, section-specific fallbacks.
    """

    def _get_main_content_text(self, soup):
        """
        A dedicated function to pre-clean the HTML and extract only the main article text.
        """
        # Create a copy to avoid modifying the original soup object
        local_soup = BeautifulSoup(str(soup), 'html.parser')
        
        # 1. Aggressively remove all irrelevant tags that contain junk text
        for tag in local_soup(['nav', 'footer', 'header', 'script', 'style', 'figure', 'table', 'aside', 'form']):
            tag.decompose()
            
        # 2. Find the most likely main content container
        main_content = local_soup.find('main') or local_soup.find('article') or local_soup.find(id='main-content') or local_soup.find(class_='main-content') or local_soup.body
        
        if not main_content:
            return ""

        # 3. Extract text and perform final cleaning
        text = main_content.get_text(separator=' ', strip=True)
        text = re.sub(r'\s+', ' ', text) # Normalize all whitespace to single spaces
        text = ''.join(char for char in text if char.isprintable()) # Remove non-printable characters
        return text

    def _find_section_text(self, soup, section_keywords):
        """
        Finds a specific section using multiple strategies, now operating on pre-cleaned HTML.
        """
        # Strategies 1 & 2: Find by specific IDs or class names (most reliable)
        for keyword in section_keywords:
            tag = soup.find(['div', 'section'], id=re.compile(keyword, re.IGNORECASE))
            if tag: return tag.get_text(separator=' ', strip=True)
            tag = soup.find(['div', 'section'], class_=re.compile(keyword, re.IGNORECASE))
            if tag: return tag.get_text(separator=' ', strip=True)

        # Strategy 3: Find by heading text
        for tag_name in ['h1', 'h2', 'h3', 'strong', 'b']:
            for heading in soup.find_all(tag_name):
                heading_text = heading.get_text(strip=True).lower()
                if any(kw in heading_text for kw in section_keywords) and len(heading_text) < 40:
                    content = [sibling.get_text(separator=' ', strip=True) for sibling in heading.find_next_siblings() if sibling.name not in ['h1', 'h2', 'h3'] and sibling.get_text(strip=True)]
                    if content: return ' '.join(content)
        return None

    def extract_and_summarize_sections(self, html_content, source_identifier=""):
        if not html_content:
            return {"abstract": "Error: No HTML content provided.", "conclusion": "Error: No HTML content."}
        
        print(f"  -> Agent is analyzing content from: {source_identifier}...")
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Create a pre-cleaned version of the HTML for section finding
        cleaned_soup = BeautifulSoup(str(soup), 'html.parser')
        for tag in cleaned_soup(['nav', 'footer', 'header', 'script', 'style', 'figure', 'table', 'aside']):
            tag.decompose()

        abstract_text = self._find_section_text(cleaned_soup, ['abstract', 'background'])
        conclusion_text = self._find_section_text(cleaned_soup, ['conclusion', 'conclusions', 'summary', 'discussion'])
        
        abstract_summary = None
        conclusion_summary = None
        general_summary = None

        # --- Section-Specific Fallback for ABSTRACT ---
        if abstract_text:
            abstract_summary = summarize_text_tfidf(abstract_text, num_sentences=4)
        else:
            print(f"  -> Abstract not found for {source_identifier}. Generating full summary as fallback.")
            full_text = self._get_main_content_text(soup)
            if len(full_text) > 500:
                general_summary = summarize_text_tfidf(full_text, num_sentences=5)
                abstract_summary = f"[Abstract Not Found; Full Article Summary]: {general_summary}"
            else:
                abstract_summary = "Agent could not find a valid 'Abstract' section."

        # --- Section-Specific Fallback for CONCLUSION ---
        if conclusion_text:
            conclusion_summary = summarize_text_tfidf(conclusion_text, num_sentences=3)
        else:
            # Only generate a new summary if we haven't already made one for the abstract
            if general_summary:
                conclusion_summary = f"[Conclusion Not Found; Full Article Summary]: {general_summary}"
            else:
                print(f"  -> Conclusion not found for {source_identifier}. Generating full summary as fallback.")
                full_text = self._get_main_content_text(soup)
                if len(full_text) > 500:
                    general_summary = summarize_text_tfidf(full_text, num_sentences=5)
                    conclusion_summary = f"[Conclusion Not Found; Full Article Summary]: {general_summary}"
                else:
                    conclusion_summary = "Agent could not find a valid 'Conclusion' or 'Summary' section."
            
        return {"abstract": abstract_summary, "conclusion": conclusion_summary}

