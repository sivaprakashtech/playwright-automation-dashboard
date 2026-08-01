import api from './api';
import { DashboardStats, TrendData, BrowserDistribution } from '@/types';

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  async getTrend(days?: number): Promise<TrendData[]> {
    const response = await api.get('/analytics/trend', { params: { days } });
    return response.data.trend;
  },

  async getBrowserDistribution(): Promise<BrowserDistribution[]> {
    const response = await api.get('/analytics/browser-distribution');
    return response.data.distribution;
  },

  async getExecutionTime(days?: number): Promise<{ date: string; duration: number; name: string }[]> {
    const response = await api.get('/analytics/execution-time', { params: { days } });
    return response.data.execution_times;
  },

  async getMostFailed(limit?: number): Promise<{ test_name: string; failure_count: number }[]> {
    const response = await api.get('/analytics/most-failed', { params: { limit } });
    return response.data.most_failed;
  },

  async getHeatmap(): Promise<{ day: string; hour: number; count: number }[]> {
    const response = await api.get('/analytics/heatmap');
    return response.data.heatmap;
  },
};
