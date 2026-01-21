# Book Topic Graph

Wizualizacja sieci powiązań tematycznych między książkami w formie grafu. Projekt wykorzystuje BERTopic do analizy streszczeń fabularnych i wyznaczania powiązań między książkami.

## Baza danych

CMU Book Summary Dataset: https://www.kaggle.com/datasets/ymaricar/cmu-book-summary-dataset

## Przygotowanie danych

Uruchom notebook `data/data_processing.ipynb` aby wygenerować niezbędne pliki.

## Backend

Backend FastAPI serwujący API dla grafu książek.

### Instalacja

```bash
pip install -r backend/requirements.txt
```

### Uruchomienie

```bash
cd backend
uvicorn main:app --reload
```

## Frontend

Frontend React + TypeScript + Vite do wizualizacji.

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
