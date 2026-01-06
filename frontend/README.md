# Book Topic Graph - Frontend

Frontend React + TypeScript + Vite aplikacji do wizualizacji sieci powiązań między książkami.

## Wymagania

- Node.js 18+ i npm
- Backend FastAPI działający na porcie 8000
- Pliki danych wygenerowane przez notebook (book_embeddings.npy, book_embeddings_2d.npy, processed_book_data.csv)

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:5173

## Użycie

1. **Przeglądanie grafu**: Przybliżaj, oddalaj i przeciągaj węzły grafu
2. **Szczegóły książki**: Kliknij na węzeł, aby zobaczyć szczegóły
3. **Dodawanie książki**: Kliknij ikonę "+" w prawym górnym rogu

## Struktura projektu

```
src/
├── components/           # Komponenty React
│   ├── GraphVisualization.tsx    # Wizualizacja grafu
│   ├── Layout.tsx                # Layout aplikacji
│   ├── AddBookForm.tsx           # Formularz dodawania książki
│   └── BookDetailsPanel.tsx      # Panel szczegółów książki
├── services/            # Serwisy API
│   └── api.ts
├── types/               # Typy TypeScript
│   └── graph.ts
├── App.tsx              # Główny komponent
└── main.tsx             # Entry point
```

## Technologie

- **React 18** - biblioteka UI
- **TypeScript** - typowanie
- **Vite** - bundler i dev server
- **Material-UI** - komponenty UI
- **react-force-graph-2d** - wizualizacja grafu
- **axios** - HTTP client
