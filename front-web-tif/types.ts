export interface Product {
  id: string;
  codebar?: string; // Código de barras del producto
  name: string;
  description: string;
  manufacturer: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  expiryDate: Date;
  category: string;
  storageConditions: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
}

export interface CalendarEventType {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any; // To store the original product data or other info
  product: Product; // Explicitly store the product
}