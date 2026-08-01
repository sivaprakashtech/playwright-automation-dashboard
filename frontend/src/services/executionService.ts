import api from './api';
import { Execution, ExecutionResult, PaginatedResponse } from '@/types';

export interface RunExecutionParams {
  project_id: number;
  name?: string;
  execution_type?: string;
  browser?: string;
  environment?: string;
  headless?: boolean;
  parallel_workers?: number;
  timeout?: number;
  retries?: number;
  suite_id?: number;
  test_case_id?: number;
}

export const executionService = {
  async getAll(params?: { page?: number; per_page?: number; project_id?: number; status?: string }): Promise<PaginatedResponse<Execution>> {
    const response = await api.get('/executions', { params });
    return {
      data: response.data.executions,
      total: response.data.total,
      pages: response.data.pages,
      currentPage: response.data.current_page,
    };
  },

  async getById(id: number): Promise<{ execution: Execution; results: ExecutionResult[] }> {
    const response = await api.get(`/executions/${id}`);
    return response.data;
  },

  async run(params: RunExecutionParams): Promise<Execution> {
    const response = await api.post('/executions/run', params);
    return response.data.execution;
  },

  async cancel(id: number): Promise<Execution> {
    const response = await api.post(`/executions/${id}/cancel`);
    return response.data.execution;
  },

  async getStats(): Promise<{
    total_executions: number;
    running: number;
    queued: number;
    completed: number;
    total_tests: number;
    passed: number;
    failed: number;
    skipped: number;
    success_rate: number;
    avg_duration: number;
  }> {
    const response = await api.get('/executions/stats');
    return response.data;
  },
};
