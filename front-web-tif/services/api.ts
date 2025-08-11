import { Product } from '../types';

// Configuración del backend - cambiar según el entorno
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://192.168.1.17:8000';

export interface ProductFormData {
  name: string;
  description: string;
  manufacturer: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
  storageConditions: string;
  codebar?: string;
}

export class ApiService {
  static async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();
      
      // Transformar los productos del backend para que sean compatibles con el frontend web
      return products.map((product: any) => ({
        id: product._id || product.codebar || Date.now().toString(),
        codebar: product.codebar || '',
        name: product.productName || product.name || 'Producto sin nombre',
        description: product.description || `${product.productName || 'Producto'} - ${product.lab || 'Sin laboratorio'}`,
        manufacturer: product.lab || product.manufacturer || 'Sin fabricante',
        lotNumber: product.batchNumber || product.lotNumber || 'Sin lote',
        quantity: product.quantity || 1,
        unit: 'unidades', // Valor por defecto ya que el backend no tiene este campo
        expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(),
        category: product.lab || product.category || 'Sin categoría',
        storageConditions: product.storageConditions || 'Almacenar en lugar fresco y seco',
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
        id: product._id || product.codebar || Date.now().toString(),
        codebar: product.codebar || '',
        name: product.productName || product.name || 'Producto sin nombre',
        description: product.description || `${product.productName || 'Producto'} - ${product.lab || 'Sin laboratorio'}`,
        manufacturer: product.lab || product.manufacturer || 'Sin fabricante',
        lotNumber: product.batchNumber || product.lotNumber || 'Sin lote',
        quantity: product.quantity || 1,
        unit: 'unidades',
        expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(),
        category: product.lab || product.category || 'Sin categoría',
        storageConditions: product.storageConditions || 'Almacenar en lugar fresco y seco',
      };
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      throw error;
    }
  }

  static async createProduct(productData: ProductFormData): Promise<Product> {
    try {
      // Mapear los campos del formulario web a los campos del backend
      const payload = {
        codebar: productData.codebar || '',
        productName: productData.name || '',
        lab: productData.manufacturer || '',
        price: 0,
        matnr: '',
        expirationDate: productData.expiryDate || null,
        quantity: productData.quantity ? parseInt(productData.quantity.toString(), 10) : 1,
        batchNumber: productData.lotNumber || '',
        supplier: '',
        location: '',
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
        id: product._id || product.codebar || Date.now().toString(),
        codebar: product.codebar || '',
        name: product.productName || product.name || 'Producto sin nombre',
        description: product.description || `${product.productName || 'Producto'} - ${product.lab || 'Sin laboratorio'}`,
        manufacturer: product.lab || product.manufacturer || 'Sin fabricante',
        lotNumber: product.batchNumber || product.lotNumber || 'Sin lote',
        quantity: product.quantity || 1,
        unit: 'unidades',
        expiryDate: product.expirationDate ? new Date(product.expirationDate) : new Date(),
        category: product.lab || product.category || 'Sin categoría',
        storageConditions: product.storageConditions || 'Almacenar en lugar fresco y seco',
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(productId: string, productData: ProductFormData): Promise<Product> {
    try {
      // Para actualizar, necesitamos el código de barras del producto
      // Primero obtenemos el producto actual para obtener el codebar
      const currentProduct = await this.getProductById(productId);
      
      if (!currentProduct) {
        throw new Error('Producto no encontrado');
      }

      // Usar el codebar para las operaciones del backend
      const codebar = currentProduct.codebar || currentProduct.id;

      // Actualizar la fecha de vencimiento
      if (productData.expiryDate) {
        await this.updateProductExpiration(codebar, productData.expiryDate);
      }

      // Actualizar la cantidad
      if (productData.quantity !== undefined) {
        await this.updateProductQuantity(codebar, productData.quantity);
      }

      // Recargar el producto actualizado
      const updatedProduct = await this.getProductById(productId);
      if (!updatedProduct) {
        throw new Error('Error al recargar el producto actualizado');
      }
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async updateProductExpiration(codebar: string, expirationDate: string): Promise<Product> {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${codebar}/expiration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiration_date: expirationDate }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        id: result.product._id || result.product.codebar || Date.now().toString(),
        codebar: result.product.codebar || '',
        name: result.product.productName || result.product.name || 'Producto sin nombre',
        description: result.product.description || `${result.product.productName || 'Producto'} - ${result.product.lab || 'Sin laboratorio'}`,
        manufacturer: result.product.lab || result.product.manufacturer || 'Sin fabricante',
        lotNumber: result.product.batchNumber || result.product.lotNumber || 'Sin lote',
        quantity: result.product.quantity || 1,
        unit: 'unidades',
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
        category: result.product.lab || result.product.category || 'Sin categoría',
        storageConditions: result.product.storageConditions || 'Almacenar en lugar fresco y seco',
      };
    } catch (error) {
      console.error('Error updating product expiration:', error);
      throw error;
    }
  }

  static async updateProductQuantity(codebar: string, quantity: number): Promise<Product> {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${codebar}/quantity`, {
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
      
      return {
        id: result.product._id || result.product.codebar || Date.now().toString(),
        codebar: result.product.codebar || '',
        name: result.product.productName || result.product.name || 'Producto sin nombre',
        description: result.product.description || `${result.product.productName || 'Producto'} - ${result.product.lab || 'Sin laboratorio'}`,
        manufacturer: result.product.lab || result.product.manufacturer || 'Sin fabricante',
        lotNumber: result.product.batchNumber || result.product.lotNumber || 'Sin lote',
        quantity: result.product.quantity || 1,
        unit: 'unidades',
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
        category: result.product.lab || result.product.category || 'Sin categoría',
        storageConditions: result.product.storageConditions || 'Almacenar en lugar fresco y seco',
      };
    } catch (error) {
      console.error('Error updating product quantity:', error);
      throw error;
    }
  }

  static async deleteProduct(codebar: string, expirationDate?: string): Promise<void> {
    try {
      let url = `${BACKEND_URL}/products/${codebar}`;
      
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

  static async incrementProductQuantity(codebar: string, amount: number): Promise<Product> {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${codebar}/increment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        id: result.product._id || result.product.codebar || Date.now().toString(),
        codebar: result.product.codebar || '',
        name: result.product.productName || result.product.name || 'Producto sin nombre',
        description: result.product.description || `${result.product.productName || 'Producto'} - ${result.product.lab || 'Sin laboratorio'}`,
        manufacturer: result.product.lab || result.product.manufacturer || 'Sin fabricante',
        lotNumber: result.product.batchNumber || result.product.lotNumber || 'Sin lote',
        quantity: result.product.quantity || 1,
        unit: 'unidades',
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
        category: result.product.lab || result.product.category || 'Sin categoría',
        storageConditions: result.product.storageConditions || 'Almacenar en lugar fresco y seco',
      };
    } catch (error) {
      console.error('Error incrementing product quantity:', error);
      throw error;
    }
  }

  static async decrementProductQuantity(codebar: string, amount: number): Promise<Product> {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${codebar}/decrement`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        id: result.product._id || result.product.codebar || Date.now().toString(),
        codebar: result.product.codebar || '',
        name: result.product.productName || result.product.name || 'Producto sin nombre',
        description: result.product.description || `${result.product.productName || 'Producto'} - ${result.product.lab || 'Sin laboratorio'}`,
        manufacturer: result.product.lab || result.product.manufacturer || 'Sin fabricante',
        lotNumber: result.product.batchNumber || result.product.lotNumber || 'Sin lote',
        quantity: result.product.quantity || 1,
        unit: 'unidades',
        expiryDate: result.product.expirationDate ? new Date(result.product.expirationDate) : new Date(),
        category: result.product.lab || result.product.category || 'Sin categoría',
        storageConditions: result.product.storageConditions || 'Almacenar en lugar fresco y seco',
      };
    } catch (error) {
      console.error('Error decrementing product quantity:', error);
      throw error;
    }
  }

  // Método auxiliar para obtener un producto por ID
  private static async getProductById(productId: string): Promise<Product | null> {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.find(p => p.id === productId) || null;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }
} 