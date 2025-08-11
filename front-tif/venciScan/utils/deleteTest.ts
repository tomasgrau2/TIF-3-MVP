// Test para verificar la funcionalidad de eliminación específica por fecha
// Este archivo es solo para pruebas y documentación

import { ApiService } from '../services/api';

/**
 * Test: Eliminación específica por fecha de vencimiento
 * 
 * Escenario:
 * 1. Producto A: código 123456, fecha 2024-12-31, cantidad 5
 * 2. Producto B: código 123456, fecha 2025-06-30, cantidad 3
 * 
 * Al eliminar Producto A, solo debe eliminarse la entrada con fecha 2024-12-31
 * Producto B debe mantenerse intacto.
 */

export const testSpecificDeletion = async () => {
  console.log('🧪 Iniciando test de eliminación específica...');
  
  try {
    // 1. Crear dos productos con el mismo código de barras pero diferentes fechas
    const productA = {
      codebar: '123456',
      name: 'Test Product A',
      description: 'Producto de prueba A',
      category: 'Test Lab',
      expiryDate: '2024-12-31',
      quantity: '5',
      batchNumber: 'BATCH-A',
      supplier: 'Test Supplier',
      location: 'Test Location'
    };
    
    const productB = {
      codebar: '123456',
      name: 'Test Product B', 
      description: 'Producto de prueba B',
      category: 'Test Lab',
      expiryDate: '2025-06-30',
      quantity: '3',
      batchNumber: 'BATCH-B',
      supplier: 'Test Supplier',
      location: 'Test Location'
    };
    
    console.log('📝 Creando productos de prueba...');
    const createdA = await ApiService.createProduct(productA);
    const createdB = await ApiService.createProduct(productB);
    
    console.log('✅ Productos creados:', {
      A: { id: createdA.id, expiryDate: createdA.expiryDate },
      B: { id: createdB.id, expiryDate: createdB.expiryDate }
    });
    
    // 2. Verificar que ambos productos existen
    const allProducts = await ApiService.getAllProducts();
    const testProducts = allProducts.filter(p => p.codebar === '123456');
    console.log('📊 Productos con código 123456:', testProducts.length);
    
    // 3. Eliminar solo el producto A (fecha 2024-12-31)
    console.log('🗑️ Eliminando producto A...');
    await ApiService.deleteProduct('123456', '2024-12-31');
    
    // 4. Verificar que solo se eliminó el producto A
    const remainingProducts = await ApiService.getAllProducts();
    const remainingTestProducts = remainingProducts.filter(p => p.codebar === '123456');
    
    console.log('📊 Productos restantes con código 123456:', remainingTestProducts.length);
    
    if (remainingTestProducts.length === 1 && 
        remainingTestProducts[0].expiryDate?.toISOString().split('T')[0] === '2025-06-30') {
      console.log('✅ Test EXITOSO: Solo se eliminó el producto con fecha 2024-12-31');
      console.log('✅ El producto con fecha 2025-06-30 se mantiene intacto');
    } else {
      console.log('❌ Test FALLIDO: La eliminación no funcionó correctamente');
    }
    
    // 5. Limpiar: eliminar el producto restante
    console.log('🧹 Limpiando producto restante...');
    await ApiService.deleteProduct('123456', '2025-06-30');
    
    console.log('✅ Test completado');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
};

/**
 * Instrucciones de uso:
 * 
 * 1. Importar y ejecutar en el componente de desarrollo:
 *    import { testSpecificDeletion } from '../utils/deleteTest';
 *    
 * 2. Llamar la función:
 *    testSpecificDeletion();
 *    
 * 3. Revisar la consola para ver los resultados
 */ 