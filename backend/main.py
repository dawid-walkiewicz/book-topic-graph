from fastapi import FastAPI
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi.responses import JSONResponse

app = FastAPI()


@app.get("/")
def home():
    """ Simple test endpoint returning a greeting message. """
    return {"message": "hello"}


@app.get("/books/")
def get_books():
    """ 
    Load book embeddings and metadata, merge them, and return as JSON response.
    """

    # Build paths to embeddings and books files as relative to this file
    directory = Path(__file__).parent.parent
    embeddings_file = directory / 'data' / 'book_embeddings_2d.npy'
    book_file = directory / 'data' / 'processed_book_data.csv'

    
    # Check if embeddings were loaded successfully and return an error message if not
    if not embeddings_file.exists() or not book_file.exists():
        return {"error": "Data could not be loaded."} 
    else:
        # Load embeddings and book data and merge them
        embeddings = np.load(embeddings_file)
        books_df = pd.read_csv(book_file)
        books_df['x'] = embeddings[:, 0]
        books_df['y'] = embeddings[:, 1]
        # remove unnecessary columns
        books_df = books_df.drop(['plot_summary','processed_summary', 'genres', 'wiki_id', 'freebase_id'], axis=1, errors='ignore')
        # Replace NaN with None for JSON serialization
        books_df = books_df.where(pd.notnull(books_df), None)
        #print(books_df.head())
        data=books_df.to_dict(orient='records')
        return JSONResponse(content=data)

    

