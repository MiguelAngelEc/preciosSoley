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
  AuthResponse,
  Product,
  ProductCreate,
  ProductUpdate,
  ProductMaterialCreate,
  CostosTotalesResponse
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

  // Product methods
  async getProducts(skip: number = 0, limit: number = 100): Promise<Product[]> {
    const response: AxiosResponse<Product[]> = await this.api.get('/api/products/', {
      params: { skip, limit }
    });
    return response.data;
  }

  async getProduct(id: number): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.get(`/api/products/${id}`);
    return response.data;
  }

  async createProduct(product: ProductCreate): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.post('/api/products/', product);
    return response.data;
  }

  async updateProduct(id: number, product: ProductUpdate): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.put(`/api/products/${id}`, product);
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.api.delete(`/api/products/${id}`);
  }

  async addMaterialToProduct(productId: number, materialData: ProductMaterialCreate): Promise<void> {
    await this.api.post(`/api/products/${productId}/materials`, materialData);
  }

  async removeMaterialFromProduct(productId: number, materialId: number): Promise<void> {
    await this.api.delete(`/api/products/${productId}/materials/${materialId}`);
  }

  async calculateTotalCosts(): Promise<CostosTotalesResponse> {
    const response: AxiosResponse<CostosTotalesResponse> = await this.api.get('/api/products/costs/total');
    return response.data;
  }

  async calculateCostByUnit(productId: number, quantity: number, unit: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/api/products/${productId}/cost-calculator`, {
      params: { quantity, unit }
    });
    return response.data;
  }

  async duplicateProduct(productId: number, duplicateData: { nombre: string; peso_empaque: number }): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.post(`/api/products/${productId}/duplicate`, duplicateData);
    return response.data;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;