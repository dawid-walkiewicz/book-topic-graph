from bertopic import BERTopic
from fastapi import FastAPI, Request
import numpy as np
import pandas as pd
from pathlib import Path
import pickle
from sentence_transformers import SentenceTransformer

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
pca_model_file = directory / 'data' / 'pca_model.pkl'
umap_model_file = directory / 'data' / 'umap_model.pkl'
hybrid_model_pca_file = directory / 'data' / 'hybrid_pca_model.pkl'
hybrid_model_umap_file = directory / 'data' / 'hybrid_umap_model.pkl'
embeddings_full_file = directory / 'data' / 'book_embeddings.npy'
topic_model_file = directory / 'data' / 'model' / 'bertopic_model'
books_file = directory / 'data' / 'processed_book_data.csv'

# Check if embeddings were loaded successfully and return an error message if not
data_loaded = False
pca_model = None
umap_model = None
hybrid_model_pca = None
hybrid_model_umap = None
embeddings_full = None
topic_model = None
books_df = None

if pca_model_file.exists():
    with open(pca_model_file, 'rb') as f:
        pca_model = pickle.load(f)
else:
    print("PCA model file not found.")

if umap_model_file.exists():
    with open(umap_model_file, 'rb') as f:
        umap_model = pickle.load(f)
else:
    print("UMAP model file not found.")

if hybrid_model_pca_file.exists():
    with open(hybrid_model_pca_file, 'rb') as f:
        hybrid_model_pca = pickle.load(f)
else:
    print("Hybrid PCA model file not found.")

if hybrid_model_umap_file.exists():
    with open(hybrid_model_umap_file, 'rb') as f:
        hybrid_model_umap = pickle.load(f)
else:
    print("Hybrid UMAP model file not found.")

if embeddings_full_file.exists():
    embeddings_full = np.load(embeddings_full_file)
else:
    print("Full embeddings file not found.")

if topic_model_file.exists():
    topic_model = BERTopic.load(str(topic_model_file))
else:
    print("Topic model file not found.")

if books_file.exists():
    books_df = pd.read_csv(books_file)
else:
    print("Books data file not found.")

if (
        pca_model is not None and
        umap_model is not None and
        hybrid_model_pca is not None and
        hybrid_model_umap is not None and
        embeddings_full is not None and
        topic_model is not None and
        books_df is not None
):
    data_loaded = True
    print("All data loaded successfully.")
else:
    print("Error loading data.")

# model and reducer can be loaded here if needed for other endpoints
model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')

@app.get("/")
def home():
    """ Simple test endpoint returning a greeting message. """
    return {"message": "hello"}


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

    nodes = []
    for i, (idx, row) in enumerate(books_df.iterrows()):
        # Skip nodes with NaN or infinite coordinates
        if np.isnan(row['x_umap']) or np.isnan(row['y_umap']) or np.isinf(row['x_umap']) or np.isinf(row['y_umap']):
            continue

        nodes.append({
            "id": f"book_{i}",
            "title": clean_value(row.get('title', 'Unknown')) or 'Unknown',
            "author": clean_value(row.get('author', 'Unknown')) or 'Unknown',
            "publication_date": clean_value(row.get('publication_date')),
            "genres": clean_value(row.get('genres')),
            "topic": clean_value(row.get('topic_label')),
            "x": row['x_umap'],
            "y": row['y_umap']
        })

    return {"nodes": nodes}


@app.post("/books/new/")
async def add_book(request: Request):
    """ Endpoint to add a new book embeding and return its reduced coordinates.
    Expects a JSON payload with 'title', 'author', and 'plot_summary'.
    """
    try:
        data = await request.json()
        new_book = data
        # print(new_book)
        # add embedding and reduce dimensions
        new_embedding = model.encode([new_book['plot_summary']])
        new_point = umap_model.transform(new_embedding)
        book = {
            "title": new_book['title'],
            "author": new_book['author'],
            "x": float(new_point[0][0]),
            "y": float(new_point[0][1])
        }

        return {"message": "Book received", "book": book}
    except Exception as e:
        return {"error": "wrong data format"}
