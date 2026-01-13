from bertopic import BERTopic
from fastapi import FastAPI, Request, HTTPException
import numpy as np
import pandas as pd
from pathlib import Path
import pickle
from sentence_transformers import SentenceTransformer
import traceback

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
    topic_model = BERTopic.load(str(topic_model_file), embedding_model='sentence-transformers/all-mpnet-base-v2')
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


def clean_value(val):
    """Convert pandas NaN/NaT to None for JSON serialization"""
    if pd.isna(val):
        return None
    return val


def get_books_with_reduced_coordinates(reducer_name: str):
    """
    Generalized function to get book data with reduced coordinates.
    """
    if not data_loaded:
        return {"error": "Data could not be loaded."}

    coord_x = f"x_{reducer_name}"
    coord_y = f"y_{reducer_name}"

    books = []
    for i, (idx, row) in enumerate(books_df.iterrows()):
        # Skip nodes with NaN or infinite coordinates
        if np.isnan(row[coord_x]) or np.isnan(row[coord_y]) or np.isinf(row[coord_x]) or np.isinf(row[coord_y]):
            continue

        books.append({
            "id": f"book_{i}",
            "title": clean_value(row.get('title', 'Unknown')) or 'Unknown',
            "author": clean_value(row.get('author', 'Unknown')) or 'Unknown',
            "publication_date": clean_value(row.get('publication_date')),
            "genres": clean_value(row.get('genres')),
            "topic": clean_value(row.get('topic_label')),
            "x": row[coord_x],
            "y": row[coord_y]
        })

    return {"books": books}


@app.get("/api/nodes")
def get_nodes():
    """
    Lightweight endpoint - returns only node positions for scatter plot visualization.
    """
    books = get_books_with_reduced_coordinates("umap")["books"]
    return {"nodes": books}


@app.get("/api/pca")
def get_books_with_pca():
    return get_books_with_reduced_coordinates("pca")


@app.get("/api/umap")
def get_books_with_umap():
    return get_books_with_reduced_coordinates("umap")


@app.get("/api/hybrid")
def get_books_with_hybrid():
    return get_books_with_reduced_coordinates("hybrid")


@app.post("/books/new/")
async def add_book(request: Request):
    """ Endpoint to add a new book embeding and return its reduced coordinates.
    Expects a JSON payload with 'title', 'author', and 'plot_summary'.
    """
    global books_df

    try:
        data = await request.json()
        new_book = data
        new_embedding = model.encode([new_book['plot_summary']], normalize_embeddings=True)
        pca_coordinates = pca_model.transform(new_embedding)
        umap_coordinates = umap_model.transform(new_embedding)
        hybrid_coordinates = hybrid_model_umap.transform(hybrid_model_pca.transform(new_embedding))
        topic, _ = topic_model.transform([new_book['plot_summary']], new_embedding)
        topic_label = topic_model.custom_labels_[topic[0]]

        book = {
            "wiki_id": -1,
            "title": new_book['title'],
            "author": new_book['author'],
            "publication_date": None,
            "plot_summary": new_book['plot_summary'],
            "topic": topic[0],
            "topic_label": topic_label,
            "pca_x": pca_coordinates[0][0],
            "pca_y": pca_coordinates[0][1],
            "umap_x": umap_coordinates[0][0],
            "umap_y": umap_coordinates[0][1],
            "hybrid_x": hybrid_coordinates[0][0],
            "hybrid_y": hybrid_coordinates[0][1],
        }
        books_df = pd.concat([books_df, pd.DataFrame([book])], ignore_index=True)

        result_dict = books_df.iloc[-1].replace({np.nan: None}).to_dict()

        return {"message": "Book received", "book": result_dict}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
