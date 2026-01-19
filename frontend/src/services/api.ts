import axios from 'axios';
import type { GraphData, NewBookRequest, NewBookResponse, EndpointType } from '../types/graph';

const API_BASE_URL = '/api';

export const api = {
  /**
   * Fetch book nodes for scatter plot visualization (lightweight, no similarity computation)
   */
  async getNodes(): Promise<GraphData> {
    return this.getNodesByEndpoint('umap');
  },

  /**
   * Fetch book nodes by specific endpoint type (pca, umap, or hybrid)
   */
  async getNodesByEndpoint(endpoint: EndpointType): Promise<GraphData> {
    const response = await axios.get<{ books?: GraphData['nodes']; nodes?: GraphData['nodes']; error?: string }>(
      `${API_BASE_URL}/${endpoint}`
    );
    const nodes = response.data.books || response.data.nodes;
    if (response.data.error || !nodes) {
      throw new Error(response.data.error || 'Failed to load nodes');
    }
    return { nodes, links: [] };
  },

  /**
   * Add a new book to the collection
   * @param book - New book data
   */
  async addBook(book: NewBookRequest): Promise<NewBookResponse> {
    const response = await axios.post<NewBookResponse>('/books/new/', book);
    return response.data;
  },
};
