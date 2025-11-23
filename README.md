# Book Topic Graph

Wizualizacja sieci powiązań tematycznych między książkami w formie grafu. Projekt wykorzystuje BERTopic do analizy streszczeń fabularnych i wyznaczania powiązań między książkami.

## Baza danych

CMU Book Summary Dataset: https://www.kaggle.com/datasets/ymaricar/cmu-book-summary-dataset

## Przygotowanie danych

1. Uruchom notebook `data/data_processing.ipynb` aby wygenerować niezbędne pliki:
   - `book_embeddings.npy` - embeddingi 384D
   - `book_embeddings_2d.npy` - współrzędne 2D (UMAP)
   - `processed_book_data.csv` - metadane książek

2. Pliki te są wymagane do uruchomienia backendu.

## Backend

Backend FastAPI serwujący API dla grafu książek.

### Instalacja

```bash
pip install -r backend/requirements.txt
```

### Uruchomienie

```bash
uvicorn backend.main:app --reload
```

Backend będzie dostępny pod adresem: http://localhost:8000

### Endpointy API

- `GET /` - health check
- `GET /books/` - lista wszystkich książek z współrzędnymi 2D
- `GET /api/graph?top_k=5&threshold=0.5` - graf z węzłami i krawędziami
- `POST /books/new/` - dodanie nowej książki

## Frontend

Frontend React + TypeScript + Vite z wizualizacją grafu.

### Instalacja

```bash
cd frontend
npm install
```

### Uruchomienie

```bash
cd frontend
npm run dev
```

Frontend będzie dostępny pod adresem: http://localhost:5173

### Funkcjonalności

- Interaktywna wizualizacja grafu książek (zoom, pan, drag)
- Kliknięcie na węzeł wyświetla szczegóły książki
- Dodawanie nowych książek przez formularz
- Krawędzie reprezentują podobieństwo tematyczne (cosine similarity)

## Technologie

### Backend
- FastAPI
- SentenceTransformers (all-MiniLM-L6-v2)
- UMAP (redukcja wymiarowości)
- NumPy, Pandas, scikit-learn

### Frontend
- React 18 + TypeScript
- Vite
- Material-UI
- react-force-graph-2d
- Axios

## Architektura

```
┌─────────────────────────────────────────┐
│  Warstwa Offline (Jednorazowe)          │
│  - Notebook: data_processing.ipynb      │
│  - Generuje embeddingi i redukcje UMAP  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Backend: FastAPI (Python)              │
│  - Ładuje embeddingi i model            │
│  - GET /api/graph                       │
│  - POST /books/new/                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Frontend: React + TypeScript           │
│  - Wizualizacja grafu (react-force-2d)  │
│  - Formularz dodawania książek          │
│  - Panel szczegółów książki             │
└─────────────────────────────────────────┘
```
