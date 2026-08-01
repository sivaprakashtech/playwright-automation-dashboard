import api from './api';
import { Project, PaginatedResponse } from '@/types';

export const projectService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; status?: string }): Promise<PaginatedResponse<Project>> {
    const response = await api.get('/projects', { params });
    return {
      data: response.data.projects,
      total: response.data.total,
      pages: response.data.pages,
      currentPage: response.data.current_page,
    };
  },

  async getById(id: number): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data.project;
  },

  async create(data: Partial<Project>): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data.project;
  },

  async update(id: number, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
