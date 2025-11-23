import axios from 'axios';
import { GraphData, NewBookRequest, NewBookResponse } from '../types/graph';

const API_BASE_URL = '/api';

export const api = {
  /**
   * Fetch the book graph with nodes and edges
   * @param topK - Number of nearest neighbors per book (default: 5)
   * @param threshold - Minimum similarity threshold (default: 0.5)
   */
  async getGraph(topK: number = 5, threshold: number = 0.5): Promise<GraphData> {
    const response = await axios.get<GraphData>(`${API_BASE_URL}/graph`, {
      params: { top_k: topK, threshold },
    });
    return response.data;
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
