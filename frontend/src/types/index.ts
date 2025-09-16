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