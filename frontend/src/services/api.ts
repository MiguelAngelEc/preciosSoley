import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Material,
  MaterialCreate,
  MaterialUpdate,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Product,
  ProductCreate,
  ProductUpdate,
  ProductMaterialCreate,
  CostosTotalesResponse,
  Inventory,
  InventoryCreate,
  InventoryUpdate,
  InventoryMovement,
  InventoryMovementCreate,
  InventoryDashboard,
  InventoryEgreso,
  InventoryEgresoCreate,
  InventoryEgresoUpdate
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

  // Inventory Egreso methods
  async createEgreso(inventoryId: number, egreso: InventoryEgresoCreate): Promise<InventoryEgreso> {
    const response: AxiosResponse<InventoryEgreso> = await this.api.post(`/api/inventory/egresos/${inventoryId}`, egreso);
    return response.data;
  }

  async updateEgreso(egresoId: number, egreso: InventoryEgresoUpdate): Promise<InventoryEgreso> {
    const response: AxiosResponse<InventoryEgreso> = await this.api.put(`/api/inventory/egresos/${egresoId}`, egreso);
    return response.data;
  }

  async deleteEgreso(egresoId: number): Promise<void> {
    await this.api.delete(`/api/inventory/egresos/${egresoId}`);
  }

  async getInventoryEgresos(inventoryId: number, skip: number = 0, limit: number = 100): Promise<InventoryEgreso[]> {
    const response: AxiosResponse<InventoryEgreso[]> = await this.api.get(
      `/api/inventory/egresos/inventory/${inventoryId}`,
      { params: { skip, limit } }
    );
    return response.data;
  }

  async getEgresosReport(filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_cliente?: 'publico' | 'mayorista' | 'distribuidor';
  }, skip: number = 0, limit: number = 100): Promise<InventoryEgreso[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });

    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.tipo_cliente) params.append('tipo_cliente', filters.tipo_cliente);

    const response: AxiosResponse<InventoryEgreso[]> = await this.api.get(`/api/inventory/egresos/report?${params}`);
    return response.data;
  }


}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;