from fastapi import FastAPI, Request
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi.responses import JSONResponse
import umap
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

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
embeddings_2d_file = directory / 'data' / 'book_embeddings_2d.npy'
embeddings_full_file = directory / 'data' / 'book_embeddings.npy'
book_file = directory / 'data' / 'processed_book_data.csv'


# Check if embeddings were loaded successfully and return an error message if not
data_loaded = False
embeddings_2d = None
embeddings_full = None
books_df = None

if not embeddings_2d_file.exists() or not book_file.exists():
    print("Data files not found. Please ensure the embeddings and book data files exist.")
else:
    # Load embeddings and book data
    embeddings_2d = np.load(embeddings_2d_file)
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
# Fit the UMAP reducer on the existing embeddings
if data_loaded and embeddings_full is not None:
    reducer.fit(embeddings_full)
elif data_loaded:
    # Fallback to 2D embeddings if full embeddings not available
    reducer.fit(embeddings_2d)



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
        books_response = books_df.copy()
        books_response['x'] = embeddings_2d[:, 0]
        books_response['y'] = embeddings_2d[:, 1]
        # remove unnecessary columns
        books_response = books_response.drop(['plot_summary','processed_summary', 'genres', 'wiki_id', 'freebase_id'], axis=1, errors='ignore')
        # Replace NaN with None for JSON serialization
        books_response = books_response.where(pd.notnull(books_response), None)
        #print(books_response.head())
        data=books_response.to_dict(orient='records')
        return JSONResponse(content=data)



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

    # Prepare nodes
    nodes = []
    for idx, row in books_df.iterrows():
        node = {
            "id": f"book_{idx}",
            "title": row.get('book_title', 'Unknown'),
            "author": row.get('author', 'Unknown'),
            "publication_date": row.get('publication_date', None),
            "x": float(embeddings_2d[idx, 0]),
            "y": float(embeddings_2d[idx, 1])
        }
        nodes.append(node)

    # Calculate cosine similarity matrix (only for a subset to avoid memory issues)
    # For 16k books, full similarity matrix would be 16k x 16k = 256M values
    # Instead, compute top-k neighbors for each book
    links = []

    # Process in batches to avoid memory issues
    batch_size = 1000
    n_books = len(embeddings_full)

    for batch_start in range(0, n_books, batch_size):
        batch_end = min(batch_start + batch_size, n_books)
        batch_embeddings = embeddings_full[batch_start:batch_end]

        # Calculate similarity of this batch against all books
        similarities = cosine_similarity(batch_embeddings, embeddings_full)

        # For each book in the batch, find top-k similar books
        for i, sim_row in enumerate(similarities):
            book_idx = batch_start + i

            # Get indices of top-k+1 most similar books (including itself)
            top_indices = np.argsort(sim_row)[::-1][1:top_k+1]  # Skip first (itself)

            for neighbor_idx in top_indices:
                similarity = float(sim_row[neighbor_idx])

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

    return {
        "nodes": nodes,
        "links": links
    }


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

        return {"message": "Book received", "book": book}
    except Exception as e:
        return {"error": "wrong data format"}



