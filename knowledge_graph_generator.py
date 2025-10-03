import pandas as pd
import spacy
import networkx as nx
import matplotlib.pyplot as plt
import re
import os
import json

def clean_entity_name(name):
    """
    Cleans and normalizes entity names by removing extra spaces and non-alphanumeric characters.
    e.g., "  the model...  " -> "the_model"
    """
    # Remove characters that are not letters, numbers, or spaces
    name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    # Replace spaces with underscores and remove leading/trailing spaces/underscores
    return name.strip().replace(' ', '_')

def extract_triples(text):
    """
    Extracts more detailed (subject, predicate, object) triples from text.
    This version captures compound nouns, adjectives, and adverbs to create richer relationships.
    """
    doc = nlp(text)
    triples = []

    # A set of pronouns and generic words to ignore as subjects/objects
    stop_words_entities = {'we', 'i', 'you', 'they', 'it', 'he', 'she', 'study', 'paper', 'article', 'result', 'author', 'research'}

    for sent in doc.sents:
        # The root is often the main verb (predicate) of the sentence
        root = sent.root

        # Skip sentences where the root is not a verb or is a common auxiliary verb
        if root.pos_ != 'VERB' or root.lemma_ in ['be', 'have', 'do']:
            continue

        # Find all subjects and objects in the sentence
        subjects = [tok for tok in sent if "subj" in tok.dep_ and tok.text.lower() not in stop_words_entities]
        objects = [tok for tok in sent if "obj" in tok.dep_ and tok.text.lower() not in stop_words_entities]

        if subjects and objects:
            for subj in subjects:
                for obj in objects:
                    # Check if the object is reasonably close to the subject's verb to avoid incorrect links
                    if obj.head == root or obj.head.head == root:
                        # Build the full phrase for the subject by traversing its subtree
                        full_subj = " ".join(t.text for t in subj.subtree).lower()
                        
                        # Build the full phrase for the object
                        full_obj = " ".join(t.text for t in obj.subtree).lower()

                        # Capture adverbs modifying the verb to add detail to the predicate
                        predicate_parts = []
                        for child in root.children:
                            if child.dep_ == 'advmod':
                                predicate_parts.append(child.text.lower())
                        predicate_parts.append(root.lemma_)
                        predicate = " ".join(predicate_parts)

                        # Clean the final phrases
                        subj_text = clean_entity_name(full_subj)
                        obj_text = clean_entity_name(full_obj)
                        
                        # Add the triple if it's meaningful and not excessively long
                        if subj_text and obj_text and len(subj_text) > 2 and len(obj_text) > 2:
                            if len(subj_text.split('_')) < 7 and len(obj_text.split('_')) < 7:
                                triples.append((subj_text, predicate, obj_text))
            
    return triples

def main():
    """
    Main function to orchestrate loading data, extracting knowledge, and
    building a single, organized knowledge graph for all papers combined.
    """
    print("--- Combined Knowledge Graph Generation Started ---")

    # --- 1. Load spaCy Model and Data ---
    global nlp
    try:
        nlp = spacy.load("en_core_web_sm")
        print("spaCy model 'en_core_web_sm' loaded successfully.")
    except OSError:
        print("spaCy model not found. Please run: python -m spacy download en_core_web_sm")
        return

    try:
        df = pd.read_csv("paper_summaries.csv")
        print(f"Successfully loaded {len(df)} summaries from 'paper_summaries.csv'.")
    except FileNotFoundError:
        print("Error: 'paper_summaries.csv' not found. Please run the summarizer script first.")
        return

    # Combine 'Abstract' and 'Conclusion' for richer analysis.
    df['text_to_analyze'] = df['Abstract'].fillna('') + " " + df['Conclusion'].fillna('')

    # --- 2. Extract Knowledge Triples ---
    print("Extracting detailed knowledge triples from all summaries...")
    df['triples'] = df['text_to_analyze'].apply(extract_triples)
    
    # --- 3. Build a Single Combined Graph ---
    print("Building a single graph from all extracted triples...")
    G = nx.DiGraph()
    for index, row in df.iterrows():
        # Shorten paper titles for cleaner node labels in the graph
        paper_title = f"Paper: {row['Title'][:50]}..."
        triples = row['triples']
        
        # Add the paper itself as a node
        G.add_node(paper_title, type='paper')

        for subj, pred, obj in triples:
            # Add entity nodes and link them to the paper
            G.add_node(subj, type='entity')
            G.add_node(obj, type='entity')
            G.add_edge(subj, obj, label=pred)
            G.add_edge(paper_title, subj, label='mentions')

    print(f"  -> Full graph built with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")

    # --- 4. Organize and Visualize the Graph ---
    print("Organizing graph for visualization...")
    
    # Identify the 75 most connected nodes to visualize.
    top_nodes = sorted(G.degree, key=lambda x: x[1], reverse=True)[:75]
    top_nodes_names = [name for name, degree in top_nodes]
    subgraph = G.subgraph(top_nodes_names)
    
    print(f"  -> Visualizing a subgraph of the {len(subgraph.nodes())} most connected nodes.")

    # Assign colors and sizes to nodes for better organization
    node_colors = []
    for node in subgraph.nodes():
        if subgraph.nodes[node]['type'] == 'paper':
            node_colors.append('lightgreen')  # Color for papers
        else:
            node_colors.append('skyblue')   # Color for concepts

    node_sizes = [subgraph.degree(n) * 100 + 500 for n in subgraph.nodes()]

    # --- 4.a Create and Save the Visualization (PNG) ---
    plt.figure(figsize=(25, 25))
    pos = nx.spring_layout(subgraph, k=0.9, iterations=50, seed=42)
    
    nx.draw(subgraph, pos, with_labels=True, node_size=node_sizes, node_color=node_colors,
            font_size=10, font_weight='bold', edge_color='gray', width=1.0)
    
    edge_labels = nx.get_edge_attributes(subgraph, 'label')
    nx.draw_networkx_edge_labels(subgraph, pos, edge_labels=edge_labels,
                                font_color='red', font_size=8)
                                
    plt.title("Combined Knowledge Graph (Top 75 Concepts)", size=25)
    
    # Define the output directory and filename
    output_dir = "knowledge_graph_outputs"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    output_filename = os.path.join(output_dir, "combined_knowledge_graph.png")
    
    plt.savefig(output_filename, format="PNG", dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"\n  -> Organized visualization saved as '{output_filename}'")

    # --- 4.b Export an interactive JSON for the web app ---
    print("Exporting interactive graph JSON for the web UI ...")
    # Convert subgraph into ForceGraph nodes/links structure
    nodes = []
    for n in subgraph.nodes():
        nodes.append({
            "id": n,
            "type": subgraph.nodes[n].get('type', 'entity'),
            "degree": int(subgraph.degree(n))
        })

    links = []
    for u, v, data in subgraph.edges(data=True):
        links.append({
            "source": u,
            "target": v,
            "label": data.get('label', '')
        })

    graph_json = {"nodes": nodes, "links": links}

    # Save under public so the frontend can fetch it directly
    public_dir = os.path.join(os.getcwd(), "public")
    if not os.path.exists(public_dir):
        try:
            os.makedirs(public_dir)
        except Exception:
            pass
    json_out = os.path.join(public_dir, "knowledge_graph.json")
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(graph_json, f, ensure_ascii=False)

    print(f"  -> Interactive JSON saved to '{json_out}'")
    print("\n--- Process Complete ---")

if __name__ == "__main__":
    main()

