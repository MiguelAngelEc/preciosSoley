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
  costo_etiqueta: string;
  costo_envase: string;
  costo_caja: string;
  costo_transporte: string;
  iva_percentage: number;
  iva_publico: string;
  iva_mayorista: string;
  iva_distribuidor: string;
  margen_publico: number;
  margen_mayorista: number;
  margen_distribuidor: number;
  precio_publico: string;
  precio_mayorista: string;
  precio_distribuidor: string;
  precio_publico_con_iva: string;
  precio_mayorista_con_iva: string;
  precio_distribuidor_con_iva: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_materials: ProductMaterial[];
}

export interface ProductCreate {
  nombre: string;
  iva_percentage?: number;
  margen_publico: number;
  margen_mayorista: number;
  margen_distribuidor: number;
  costo_etiqueta?: number | string;
  costo_envase?: number | string;
  costo_caja?: number | string;
  costo_transporte: number | string;
  product_materials: ProductMaterialCreate[];
}

export interface ProductMaterialCreate {
  material_id: number;
  cantidad: string;
}

export interface ProductUpdate {
  nombre?: string;
  iva_percentage?: number;
  margen_publico?: number;
  margen_mayorista?: number;
  margen_distribuidor?: number;
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