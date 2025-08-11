export interface Product {
  _id?: string;
  codebar: string;
  productName: string;
  lab: string;
  price: number;
  matnr: string;
  expirationDate?: string | null;
  created_at?: string;
  updated_at?: string;
  // Campos opcionales para compatibilidad con el frontend
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  quantity?: number;
  batchNumber?: string;
  supplier?: string;
  location?: string;
  // Campo para compatibilidad con DashboardPage
  expiryDate?: Date;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  SCAN = 'SCAN',
}

export interface ProductFormData {
  codebar: string;
  name: string;
  description: string;
  category: string;
  expiryDate: string;
  quantity: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
} 