import { Product } from '../types';
import { parseDate, formatDate } from '../utils/dateUtils';

// Configuración del backend - cambiar según el entorno
const BACKEND_URL = __DEV__ 
  ? 'http://192.168.1.17:8000'  // Para desarrollo con Expo Go en celular
  : 'http://localhost:8000';     // Para desarrollo local

export class ApiService {
  static async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();
      
      // Transformar los productos para que sean compatibles con el frontend
      return products.map((product: any) => ({
        ...product,
        id: product._id || product.codebar, // Usar _id como id para compatibilidad
        name: product.productName, // Mapear productName a name
        description: `${product.productName} - ${product.lab}`, // Crear descripción
        category: product.lab, // Usar lab como categoría
        quantity: product.quantity || 1, // Usar cantidad real del backend
        expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(), // Convertir a Date
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getProductByBarcode(barcode: string): Promise<Product> {
    try {
      const response = await fetch(`${BACKEND_URL}/get-product-by-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const product = await response.json();
      
      // Transformar el producto para compatibilidad
      return {
        ...product,
        id: product._id || product.codebar,
        name: product.productName,
        description: `${product.productName} - ${product.lab}`,
        category: product.lab,
        quantity: product.quantity || 1, // Usar cantidad real del backend
        expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(),
      };
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      throw error;
    }
  }

  static async updateProductExpiration(barcode: string, oldExpirationDate: string, newExpirationDate: string): Promise<Product> {
    try {
      // Normalizar ambas fechas
      let normalizedOldDate = oldExpirationDate;
      let normalizedNewDate = newExpirationDate;
      if (normalizedOldDate) {
        const parsed = parseDate(normalizedOldDate.trim());
        if (parsed.isValid && parsed.date) {
          normalizedOldDate = formatDate(parsed.date, 'YYYY-MM-DD');
        }
      }
      if (normalizedNewDate) {
        const parsed = parseDate(normalizedNewDate.trim());
        if (parsed.isValid && parsed.date) {
          normalizedNewDate = formatDate(parsed.date, 'YYYY-MM-DD');
        }
      }
      const response = await fetch(`${BACKEND_URL}/products/${barcode}/expiration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_expiration_date: normalizedOldDate,
          new_expiration_date: normalizedNewDate
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      // Transformar el producto actualizado
      return {
        ...result.product,
        id: result.product._id || result.product.codebar,
        name: result.product.productName,
        description: `${result.product.productName} - ${result.product.lab}`,
        category: result.product.lab,
        quantity: result.product.quantity || 1, // Usar cantidad real del backend
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
      };
    } catch (error) {
      console.error('Error updating product expiration:', error);
      throw error;
    }
  }

  static async deleteProduct(barcode: string, expirationDate?: string): Promise<void> {
    try {
      let url = `${BACKEND_URL}/products/${barcode}`;
      
      // Si se proporciona una fecha de vencimiento, agregarla como parámetro de consulta
      if (expirationDate) {
        url += `?expiration_date=${encodeURIComponent(expirationDate)}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async updateProductQuantity(barcode: string, quantity: number): Promise<Product> {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${barcode}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transformar el producto actualizado
      return {
        ...result.product,
        id: result.product._id || result.product.codebar,
        name: result.product.productName,
        description: `${result.product.productName} - ${result.product.lab}`,
        category: result.product.lab,
        quantity: result.product.quantity || 1,
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
      };
    } catch (error) {
      console.error('Error updating product quantity:', error);
      throw error;
    }
  }

  static async incrementProductQuantity(barcode: string, amount: number, expirationDate?: string): Promise<Product> {
    try {
      let normalizedExpirationDate = expirationDate;
      if (normalizedExpirationDate) {
        const parsed = parseDate(normalizedExpirationDate.trim());
        if (parsed.isValid && parsed.date) {
          normalizedExpirationDate = formatDate(parsed.date, 'YYYY-MM-DD');
        }
      }
      const body: any = { amount };
      if (normalizedExpirationDate) body.expiration_date = normalizedExpirationDate;
      const response = await fetch(`${BACKEND_URL}/products/${barcode}/increment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return {
        ...result.product,
        id: result.product._id || result.product.codebar,
        name: result.product.productName,
        description: `${result.product.productName} - ${result.product.lab}`,
        category: result.product.lab,
        quantity: result.product.quantity || 1,
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
      };
    } catch (error) {
      console.error('Error incrementing product quantity:', error);
      throw error;
    }
  }

  static async decrementProductQuantity(barcode: string, amount: number, expirationDate?: string): Promise<Product> {
    try {
      let normalizedExpirationDate = expirationDate;
      if (normalizedExpirationDate) {
        const parsed = parseDate(normalizedExpirationDate.trim());
        if (parsed.isValid && parsed.date) {
          normalizedExpirationDate = formatDate(parsed.date, 'YYYY-MM-DD');
        }
      }
      const body: any = { amount };
      if (normalizedExpirationDate) body.expiration_date = normalizedExpirationDate;
      const response = await fetch(`${BACKEND_URL}/products/${barcode}/decrement`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return {
        ...result.product,
        id: result.product._id || result.product.codebar,
        name: result.product.productName,
        description: `${result.product.productName} - ${result.product.lab}`,
        category: result.product.lab,
        quantity: result.product.quantity || 1,
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
      };
    } catch (error) {
      console.error('Error decrementing product quantity:', error);
      throw error;
    }
  }

  static async createProduct(productData: any): Promise<Product> {
    try {
      // Mapear los campos del formulario a los campos del backend
      // Normalizar la fecha de vencimiento
      let normalizedExpirationDate = productData.expiryDate || null;
      if (normalizedExpirationDate) {
        const parsed = parseDate(normalizedExpirationDate.trim());
        if (parsed.isValid && parsed.date) {
          normalizedExpirationDate = formatDate(parsed.date, 'YYYY-MM-DD');
        }
      }
      const payload = {
        codebar: productData.codebar || '',
        productName: productData.name || '',
        lab: productData.category || '',
        price: 0,
        matnr: '',
        expirationDate: normalizedExpirationDate,
        quantity: productData.quantity ? parseInt(productData.quantity, 10) : 1,
        batchNumber: productData.batchNumber || '',
        supplier: productData.supplier || '',
        location: productData.location || '',
      };
      const response = await fetch(`${BACKEND_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const product = result.product;
      return {
        ...product,
        id: product._id || product.codebar,
        name: product.productName,
        description: `${product.productName} - ${product.lab}`,
        category: product.lab,
        quantity: product.quantity || 1,
        expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(),
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
} 