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
  costo_mano_obra: string;
  costo_energia: string;
  costo_depreciacion: string;
  costo_mantenimiento: string;
  costo_administrativo: string;
  costo_comercializacion: string;
  costo_financiero: string;
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
  peso_ingredientes_base?: number;
  peso_final_producido?: number;
  peso_empaque?: number;
  costo_paquete: string;
  precio_publico_paquete: string;
  precio_mayorista_paquete: string;
  precio_distribuidor_paquete: string;
  precio_publico_con_iva_paquete: string;
  precio_mayorista_con_iva_paquete: string;
  precio_distribuidor_con_iva_paquete: string;
  costo_por_gramo: string;
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
  costo_mano_obra?: number | string;
  costo_energia?: number | string;
  costo_depreciacion?: number | string;
  costo_mantenimiento?: number | string;
  costo_administrativo?: number | string;
  costo_comercializacion?: number | string;
  costo_financiero?: number | string;
  peso_ingredientes_base?: number;
  peso_final_producido?: number;
  peso_empaque?: number;
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
  costo_etiqueta?: number | string;
  costo_envase?: number | string;
  costo_caja?: number | string;
  costo_transporte?: number | string;
  costo_mano_obra?: number | string;
  costo_energia?: number | string;
  costo_depreciacion?: number | string;
  costo_mantenimiento?: number | string;
  costo_administrativo?: number | string;
  costo_comercializacion?: number | string;
  costo_financiero?: number | string;
  peso_ingredientes_base?: number;
  peso_final_producido?: number;
  peso_empaque?: number;
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

// Proforma Types
export interface ProformaItem {
  id: number;
  proforma_id: number;
  product_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal_item: string;
  product: Product;
}

export interface Proforma {
  id: number;
  numero_proforma: string;
  tipo_cliente: 'publico' | 'mayorista' | 'distribuidor';
  cliente_nombre: string;
  cliente_empresa?: string;
  cliente_ruc?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  fecha_emision: string;
  fecha_validez: string;
  iva_aplicado: string;
  subtotal: string;
  total_iva: string;
  total_final: string;
  proforma_items: ProformaItem[];
}

export interface ProformaCreate {
  tipo_cliente: 'publico' | 'mayorista' | 'distribuidor';
  cliente_nombre: string;
  cliente_empresa?: string;
  cliente_ruc?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  iva_aplicado: number;
  items: ProformaItemCreate[];
}

export interface ProformaItemCreate {
  product_id: number;
  cantidad: number;
}

export interface ProformaListResponse {
  proformas: Proforma[];
  total_count: number;
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