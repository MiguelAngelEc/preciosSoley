// API Response Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Material {
  id: number;
  nombre: string;
  precio_base: string;
  unidad_base: 'kg' | 'litros';
  precio_unidad_pequena: string;
  is_active: boolean;
}

export interface MaterialCreate {
  nombre: string;
  precio_base: number | string;
  unidad_base: 'kg' | 'litros';
  cantidades_deseadas?: number[];
}

export interface MaterialUpdate {
  nombre?: string;
  precio_base?: number | string;
  unidad_base?: 'kg' | 'litros';
}

export interface CostosResponse {
  material: Material;
  costos: Record<string, string>;
}

export interface CantidadQuery {
  cantidades: number[];
}

// Product Types
export interface ProductMaterial {
  id: number;
  product_id: number;
  material_id: number;
  cantidad: string;
  costo: string;
  material: Material;
}

export interface Product {
  id: number;
  nombre: string;
  costo_total: string;
  iva_percentage: number;
  iva_amount: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_materials: ProductMaterial[];
}

export interface ProductCreate {
  nombre: string;
  iva_percentage?: number;
  product_materials: ProductMaterialCreate[];
}

export interface ProductMaterialCreate {
  material_id: number;
  cantidad: number;
}

export interface ProductUpdate {
  nombre?: string;
  iva_percentage?: number;
  product_materials?: ProductMaterialCreate[];
}

export interface ProductSummary {
  id: number;
  nombre: string;
  costo_total: string;
  materiales_count: number;
}

export interface CostosTotalesResponse {
  productos: ProductSummary[];
  costo_total_general: string;
  total_productos: number;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Error Types
export interface ApiError {
  detail: string;
}

// Component Props Types
export interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}