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
  CostosTotalesResponse,
  Proforma,
  ProformaCreate,
  ProformaListResponse,
  Inventory,
  InventoryCreate,
  InventoryUpdate,
  InventoryMovement,
  InventoryMovementCreate,
  InventorySummary,
  InventoryDashboard
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

  async getMe(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
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

  // Proforma methods
  async getProformas(skip: number = 0, limit: number = 100): Promise<ProformaListResponse> {
    const response: AxiosResponse<ProformaListResponse> = await this.api.get('/api/proformas/', {
      params: { skip, limit }
    });
    return response.data;
  }

  async getProforma(id: number): Promise<Proforma> {
    const response: AxiosResponse<Proforma> = await this.api.get(`/api/proformas/${id}`);
    return response.data;
  }

  async createProforma(proforma: ProformaCreate): Promise<Proforma> {
    const response: AxiosResponse<Proforma> = await this.api.post('/api/proformas/', proforma);
    return response.data;
  }

  async deleteProforma(id: number): Promise<void> {
    await this.api.delete(`/api/proformas/${id}`);
  }

  async duplicateProduct(productId: number, duplicateData: { nombre: string; peso_empaque: number }): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.post(`/api/products/${productId}/duplicate`, duplicateData);
    return response.data;
  }

  // Inventory methods
  async getInventories(skip: number = 0, limit: number = 100, filters?: {
    product_id?: number;
    lote?: string;
    stock_status?: string;
  }): Promise<Inventory[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.lote) params.append('lote', filters.lote);
    if (filters?.stock_status) params.append('stock_status', filters.stock_status);

    const response: AxiosResponse<Inventory[]> = await this.api.get(`/api/inventory/?${params}`);
    return response.data;
  }

  async getInventory(id: number): Promise<Inventory> {
    const response: AxiosResponse<Inventory> = await this.api.get(`/api/inventory/${id}`);
    return response.data;
  }

  async createInventory(inventory: InventoryCreate): Promise<Inventory> {
    const response: AxiosResponse<Inventory> = await this.api.post('/api/inventory/', inventory);
    return response.data;
  }

  async updateInventory(id: number, inventory: InventoryUpdate): Promise<Inventory> {
    const response: AxiosResponse<Inventory> = await this.api.put(`/api/inventory/${id}`, inventory);
    return response.data;
  }

  async deleteInventory(id: number): Promise<void> {
    await this.api.delete(`/api/inventory/${id}`);
  }

  async registerStockMovement(inventoryId: number, movement: InventoryMovementCreate, usuarioResponsable: string): Promise<InventoryMovement> {
    const response: AxiosResponse<InventoryMovement> = await this.api.post(
      `/api/inventory/${inventoryId}/movements?usuario_responsable=${encodeURIComponent(usuarioResponsable)}`,
      movement
    );
    return response.data;
  }

  async getInventoryMovements(inventoryId: number, skip: number = 0, limit: number = 100): Promise<InventoryMovement[]> {
    const response: AxiosResponse<InventoryMovement[]> = await this.api.get(
      `/api/inventory/${inventoryId}/movements`,
      { params: { skip, limit } }
    );
    return response.data;
  }

  async getInventorySummary(): Promise<InventoryDashboard> {
    const response: AxiosResponse<InventoryDashboard> = await this.api.get('/api/inventory/summary');
    return response.data;
  }

  async getLowStockAlerts(): Promise<InventorySummary[]> {
    const response: AxiosResponse<InventorySummary[]> = await this.api.get('/api/inventory/low-stock');
    return response.data;
  }

  async getInventoryByProduct(productId: number): Promise<InventorySummary[]> {
    const response: AxiosResponse<InventorySummary[]> = await this.api.get(`/api/inventory/by-product/${productId}`);
    return response.data;
  }

  async getDailyProductionReport(fecha?: string): Promise<Inventory[]> {
    const params = fecha ? { fecha } : {};
    const response: AxiosResponse<Inventory[]> = await this.api.get('/api/inventory/report/daily', { params });
    return response.data;
  }

  async getPeriodReport(fechaInicio: string, fechaFin: string, productId?: number): Promise<Inventory[]> {
    const params: any = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    if (productId) params.product_id = productId;

    const response: AxiosResponse<Inventory[]> = await this.api.get('/api/inventory/report/period', { params });
    return response.data;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;