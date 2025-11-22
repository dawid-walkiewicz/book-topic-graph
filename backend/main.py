from fastapi import FastAPI, Request
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi.responses import JSONResponse
import umap
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
embeddings_file = directory / 'data' / 'book_embeddings_2d.npy'
book_file = directory / 'data' / 'processed_book_data.csv'


# Check if embeddings were loaded successfully and return an error message if not
data_loaded = False
if not embeddings_file.exists() or not book_file.exists():
    print("Data files not found. Please ensure the embeddings and book data files exist.")
else:
    # Load embeddings and book data
    embeddings = np.load(embeddings_file)
    books_df = pd.read_csv(book_file)
    data_loaded = True


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
reducer.fit_transform(embeddings)



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
        books_response['x'] = embeddings[:, 0]
        books_response['y'] = embeddings[:, 1]
        # remove unnecessary columns
        books_response = books_response.drop(['plot_summary','processed_summary', 'genres', 'wiki_id', 'freebase_id'], axis=1, errors='ignore')
        # Replace NaN with None for JSON serialization
        books_response = books_response.where(pd.notnull(books_response), None)
        #print(books_response.head())
        data=books_response.to_dict(orient='records')
        return JSONResponse(content=data)



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



