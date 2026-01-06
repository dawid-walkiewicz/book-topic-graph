from fastapi import FastAPI, Request
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi.responses import JSONResponse
import umap
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import math
from typing import Dict, Any

app = FastAPI()

# Cache for computed graph data
# Key format: "top_k_threshold" -> Value: {"nodes": [...], "links": [...]}
graph_cache: Dict[str, Dict[str, Any]] = {}

# Enable CORS for all origins (for development purposes)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### Load necessary data at startup
# Build paths to embeddings and books files as relative to this file
directory = Path(__file__).parent.parent
umap_embeddings_file = directory / 'data' / 'umap_embeddings.npy'
embeddings_full_file = directory / 'data' / 'book_embeddings.npy'
book_file = directory / 'data' / 'processed_book_data.csv'


# Check if embeddings were loaded successfully and return an error message if not
data_loaded = False
umap_embeddings = None
embeddings_full = None
books_df = None

if not umap_embeddings_file.exists() or not book_file.exists():
    print("Data files not found. Please ensure the embeddings and book data files exist.")
else:
    # Load embeddings and book data
    umap_embeddings = np.load(umap_embeddings_file)
    books_df = pd.read_csv(book_file)
    data_loaded = True

    # Try to load full embeddings for similarity calculation (optional)
    if embeddings_full_file.exists():
        embeddings_full = np.load(embeddings_full_file)
        print(f"Loaded full embeddings: {embeddings_full.shape}")
    else:
        print("Full embeddings not found. Graph edges will not be available.")


# model and reducer can be loaded here if needed for other endpoints
model = SentenceTransformer('all-MiniLM-L6-v2')
reducer = umap.UMAP(
    n_neighbors=15,
    n_components=2,     # 2d
    min_dist=0.1,
    metric='cosine',
    random_state=42
)
# Fit the UMAP reducer on full (384-dim) embeddings
# Note: We need the fitted model to transform NEW books added via /books/new/
# The 2D umap_embeddings are pre-computed outputs, but we need the model trained
# on high-dim data to project new points into the same space
if data_loaded and embeddings_full is not None:
    reducer.fit(embeddings_full)



@app.get("/")
def home():
    """ Simple test endpoint returning a greeting message. """
    return {"message": "hello"}


@app.get("/books/")
def get_books():
    """
    Endpoint to get all books with their reduced coordinates.
    """
    # Check if embeddings were loaded successfully and return an error message if not
    if not data_loaded:
        return {"error": "Data could not be loaded."}
    else:
        # Load embeddings and book data and merge them
        # Limit to books that have embeddings
        max_items = len(umap_embeddings)
        books_response = books_df.iloc[:max_items].copy()
        books_response['x'] = umap_embeddings[:, 0]
        books_response['y'] = umap_embeddings[:, 1]
        # remove unnecessary columns
        books_response = books_response.drop(['plot_summary','processed_summary', 'genres', 'wiki_id', 'freebase_id'], axis=1, errors='ignore')
        # Replace NaN with None for JSON serialization
        books_response = books_response.where(pd.notnull(books_response), None)
        #print(books_response.head())
        data=books_response.to_dict(orient='records')
        return JSONResponse(content=data)


@app.get("/api/nodes")
def get_nodes():
    """
    Lightweight endpoint - returns only node positions for scatter plot visualization.
    No similarity computation, much faster than /api/graph.
    """
    if not data_loaded:
        return {"error": "Data could not be loaded."}

    def clean_value(val):
        """Convert pandas NaN/NaT to None for JSON serialization"""
        if pd.isna(val):
            return None
        return val

    # Limit to the number of embeddings we have
    max_items = len(umap_embeddings)

    nodes = []
    for i, (idx, row) in enumerate(books_df.iterrows()):
        if i >= max_items:
            break
        x_val = umap_embeddings[i, 0]
        y_val = umap_embeddings[i, 1]

        # Skip nodes with NaN or infinite coordinates
        if np.isnan(x_val) or np.isnan(y_val) or np.isinf(x_val) or np.isinf(y_val):
            continue

        nodes.append({
            "id": f"book_{i}",
            "title": clean_value(row.get('book_title', 'Unknown')) or 'Unknown',
            "author": clean_value(row.get('author', 'Unknown')) or 'Unknown',
            "publication_date": clean_value(row.get('publication_date')),
            "x": float(x_val),
            "y": float(y_val)
        })

    return {"nodes": nodes}


@app.get("/api/graph")
def get_graph(top_k: int = 5, threshold: float = 0.5):
    """
    Endpoint to get the book graph with nodes and edges.

    Args:
        top_k: Number of nearest neighbors to keep for each book (default: 5)
        threshold: Minimum similarity threshold for edges (default: 0.5)

    Returns:
        JSON with 'nodes' and 'links' arrays compatible with react-force-graph
    """
    if not data_loaded:
        return {"error": "Data could not be loaded."}

    if embeddings_full is None:
        return {"error": "Full embeddings not available. Cannot compute similarities."}

    # Check cache first
    cache_key = f"{top_k}_{threshold}"
    if cache_key in graph_cache:
        print(f"Cache HIT for {cache_key}")
        return graph_cache[cache_key]

    print(f"Cache MISS for {cache_key} - Computing graph...")

    # Limit to the number of embeddings we have
    max_items = min(len(umap_embeddings), len(embeddings_full))

    # Prepare nodes
    nodes = []
    valid_indices = set()  # Track which indices have valid coordinates
    for i, (idx, row) in enumerate(books_df.iterrows()):
        if i >= max_items:
            break
        x_val = umap_embeddings[i, 0]
        y_val = umap_embeddings[i, 1]

        # Skip nodes with NaN or infinite coordinates
        if np.isnan(x_val) or np.isnan(y_val) or np.isinf(x_val) or np.isinf(y_val):
            continue

        # Also check if the full embedding has any NaN/inf values
        if np.any(np.isnan(embeddings_full[i])) or np.any(np.isinf(embeddings_full[i])):
            continue

        valid_indices.add(i)
        node = {
            "id": f"book_{i}",
            "title": row.get('book_title', 'Unknown'),
            "author": row.get('author', 'Unknown'),
            "publication_date": row.get('publication_date', None),
            "x": float(x_val),
            "y": float(y_val)
        }
        nodes.append(node)

    # Calculate cosine similarity matrix (only for a subset to avoid memory issues)
    # For 16k books, full similarity matrix would be 16k x 16k = 256M values
    # Instead, compute top-k neighbors for each book
    links = []

    # Process in batches to avoid memory issues
    batch_size = 1000
    n_books = len(embeddings_full)

    # Only compute similarities for valid books
    for batch_start in range(0, n_books, batch_size):
        batch_end = min(batch_start + batch_size, n_books)

        # Skip batches that don't contain any valid indices
        batch_indices = [i for i in range(batch_start, batch_end) if i in valid_indices]
        if not batch_indices:
            continue

        batch_embeddings = embeddings_full[batch_indices]

        # Calculate similarity of this batch against all books
        # Use only valid embeddings to avoid NaN propagation
        valid_embeddings = embeddings_full[list(valid_indices)]
        similarities = cosine_similarity(batch_embeddings, valid_embeddings)

        # For each book in the batch, find top-k similar books
        valid_indices_list = list(valid_indices)
        for i, sim_row in enumerate(similarities):
            book_idx = batch_indices[i]

            # Get indices of top-k+1 most similar books (including itself)
            top_k_positions = np.argsort(sim_row)[::-1][1:top_k+1]  # Skip first (itself)

            for pos in top_k_positions:
                neighbor_idx = valid_indices_list[pos]

                similarity = sim_row[pos]

                # Skip if similarity is NaN or infinite
                if np.isnan(similarity) or np.isinf(similarity):
                    continue

                similarity = float(similarity)

                # Only add edge if similarity exceeds threshold
                if similarity >= threshold:
                    # Add edge (undirected, so only add once)
                    if book_idx < neighbor_idx:  # Avoid duplicates
                        link = {
                            "source": f"book_{book_idx}",
                            "target": f"book_{neighbor_idx}",
                            "value": similarity
                        }
                        links.append(link)

    # Final safety check: recursively clean any remaining NaN/Inf values
    def clean_value(val):
        """Replace NaN/Inf with None for JSON serialization"""
        if isinstance(val, float):
            if math.isnan(val) or math.isinf(val):
                return None
            return val
        elif isinstance(val, dict):
            return {k: clean_value(v) for k, v in val.items()}
        elif isinstance(val, list):
            return [clean_value(item) for item in val]
        return val

    response_data = {
        "nodes": clean_value(nodes),
        "links": clean_value(links)
    }

    # Store in cache
    graph_cache[cache_key] = response_data
    print(f"Cached result for {cache_key} - {len(nodes)} nodes, {len(links)} links")

    return response_data


@app.post("/books/new/")
async def add_book(request: Request):
    """ Endpoint to add a new book embeding and return its reduced coordinates.
    Expects a JSON payload with 'title', 'author', and 'plot_summary'.
    """
    try:
        data = await request.json()
        new_book = data
        #print(new_book)
        # add embedding and reduce dimensions
        new_embedding = model.encode([new_book['plot_summary']])
        new_point = reducer.transform(new_embedding)
        book = {
            "title": new_book['title'],
            "author": new_book['author'],
            "x": float(new_point[0][0]),
            "y": float(new_point[0][1])
        }

        # Clear graph cache since a new book was added
        graph_cache.clear()
        print("Graph cache cleared due to new book addition")

        return {"message": "Book received", "book": book}
    except Exception as e:
        return {"error": "wrong data format"}



