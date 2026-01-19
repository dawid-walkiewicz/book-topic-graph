export type GraphNode = {
  id: string;
  title: string;
  author: string;
  publication_date?: string | null;
  x?: number;
  y?: number;
  topic?: number;
  topic_label?: string;
  wiki_id?: number | null;
  genres?: string | null;
}

export type EndpointType = 'umap' | 'pca' | 'hybrid';

export type BookSourceFilter = 'all' | 'user-added' | 'original';

export type GraphLink = {
  source: string;
  target: string;
  value: number;
}

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type NewBookRequest = {
  title: string;
  author: string;
  plot_summary: string;
}

export type NewBookResponse = {
  message: string;
  book: {
    title: string;
    author: string;
    x: number;
    y: number;
  };
}
