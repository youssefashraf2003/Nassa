import csv
import requests
import time
import pandas as pd
from offline_summarizer import OfflineAgent
import concurrent.futures

def process_article(article_data):
    """
    Downloads, processes, and summarizes a single article in a separate thread.
    """
    agent = OfflineAgent()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # Use .get() for safety in case a column name is missing
    title = article_data.get('title', 'No Title Found')
    url = article_data.get('url', '')
    
    if not url:
        print("  -> Skipping article with no URL.")
        return None

    print(f"Starting processing for: \"{title[:60]}...\"")
    result_row = {"Title": title, "URL": url}

    try:
        response = requests.get(url, headers=headers, timeout=45)
        response.raise_for_status()
        html_content = response.text
        
        sections = agent.extract_and_summarize_sections(html_content, source_identifier=url)
        
        result_row["Abstract"] = sections.get('abstract', 'Extraction failed.')
        result_row["Conclusion"] = sections.get('conclusion', 'Extraction failed.')

    except requests.exceptions.RequestException as e:
        print(f"  -> FAILED to download '{title[:40]}...': {e}")
        result_row["Abstract"] = "Download failed."
        result_row["Conclusion"] = "Download failed."
    except Exception as e:
        print(f"  -> An UNEXPECTED error occurred for '{title[:40]}...': {e}")
        result_row["Abstract"] = f"Processing error: {e}"
        result_row["Conclusion"] = f"Processing error: {e}"
    
    print(f"...Finished \"{title[:60]}...\"")
    return result_row


def main():
    """
    Orchestrates the concurrent download and processing of all articles
    by fetching the list directly from a CSV file on GitHub.
    """
    print("--- Starting Automated AI Paper Summarizer (High-Speed) ---")

    # URL to the RAW version of the CSV file on GitHub
    csv_url = "https://raw.githubusercontent.com/jgalazka/SB_publications/main/SB_publication_PMC.csv"
    
    try:
        print(f"Fetching article list from {csv_url}...")
        df = pd.read_csv(csv_url)
        # Rename columns to match what our script expects ('Title' -> 'title', 'Link' -> 'url')
        df = df.rename(columns={"Title": "title", "Link": "url"})
        # Convert the DataFrame to a list of dictionaries
        articles_to_process = df.to_dict('records')
        print(f"Successfully fetched {len(articles_to_process)} articles.")
    except Exception as e:
        print(f"FATAL: Could not fetch or parse the CSV file from GitHub. Error: {e}")
        return # Exit if we can't get the list

    # Use ThreadPoolExecutor for high-speed parallel processing.
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(process_article, articles_to_process)
        # Filter out any None results that may have occurred from bad URLs
        results_for_csv = [res for res in results if res is not None]

    output_filename = "paper_summaries.csv"
    fieldnames = ["Title", "URL", "Abstract", "Conclusion"]
    
    try:
        with open(output_filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results_for_csv)
            
        print(f"\n\n*** ALL PROCESSING COMPLETE. FINAL RESULTS SAVED. ***")
        print(f"Final report saved to: {output_filename}")

    except IOError as e:
        print(f"\nAn error occurred while writing the CSV file: {e}")
        print("Please ensure the file 'paper_summaries.csv' is NOT open in another program and try again.")
    except Exception as e:
        print(f"\nAn unexpected error occurred during file writing: {e}")


if __name__ == "__main__":
    main()

