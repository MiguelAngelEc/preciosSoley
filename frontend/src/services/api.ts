import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Material,
  MaterialCreate,
  MaterialUpdate,
  CostosResponse,
  CantidadQuery,
  LoginCredentials,
  RegisterData,
  AuthResponse
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/auth/register', data);
    return response.data;
  }

  // Material methods
  async getMaterials(skip: number = 0, limit: number = 100): Promise<Material[]> {
    const response: AxiosResponse<Material[]> = await this.api.get('/api/materials/', {
      params: { skip, limit }
    });
    return response.data;
  }

  async getMaterial(id: number): Promise<Material> {
    const response: AxiosResponse<Material> = await this.api.get(`/api/materials/${id}`);
    return response.data;
  }

  async createMaterial(material: MaterialCreate): Promise<Material> {
    const response: AxiosResponse<Material> = await this.api.post('/api/materials/', material);
    return response.data;
  }

  async updateMaterial(id: number, material: MaterialUpdate): Promise<Material> {
    const response: AxiosResponse<Material> = await this.api.put(`/api/materials/${id}`, material);
    return response.data;
  }

  async deleteMaterial(id: number): Promise<void> {
    await this.api.delete(`/api/materials/${id}`);
  }

  async calculateCosts(id: number, query: CantidadQuery): Promise<CostosResponse> {
    const response: AxiosResponse<CostosResponse> = await this.api.post(`/api/materials/${id}/costos`, query);
    return response.data;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;