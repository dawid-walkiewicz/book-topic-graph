import json

def txt_to_json(txt_path, json_path):
    books = []

    with open(txt_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or not line[0].isdigit():
                continue

            parts = line.split('\t', 6)
            if len(parts) < 7:
                continue

            wiki_id, freebase_id, title, author, pub_date, genres_raw, plot = parts

            try:
                genres = json.loads(genres_raw.replace("'", '"'))
            except Exception:
                genres = genres_raw

            books.append({
                "wikipedia_id": wiki_id,
                "freebase_id": freebase_id,
                "title": title,
                "author": author,
                "publication_date": pub_date,
                "genres": genres,
                "plot_summary": plot
            })

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(books, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(books)} records to {json_path}")

if __name__ == "__main__":
    txt_to_json('booksummaries.txt', 'books.json')