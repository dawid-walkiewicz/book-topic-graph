import axios from 'axios';
import type { GraphData, NewBookRequest, NewBookResponse } from '../types/graph';

const API_BASE_URL = '/api';

export const api = {
  /**
   * Fetch book nodes for scatter plot visualization (lightweight, no similarity computation)
   */
  async getNodes(): Promise<GraphData> {
    const response = await axios.get<{ nodes?: GraphData['nodes']; error?: string }>(`${API_BASE_URL}/nodes`);
    if (response.data.error || !response.data.nodes) {
      throw new Error(response.data.error || 'Failed to load nodes');
    }
    return { nodes: response.data.nodes, links: [] };
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
