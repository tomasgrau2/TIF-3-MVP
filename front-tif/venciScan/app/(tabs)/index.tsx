import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, Text, TouchableOpacity } from 'react-native';
import { Product, ViewMode, ProductFormData } from '../../types';
import { ApiService } from '../../services/api';
import Navbar from '../../components/Navbar';
import DashboardPage from '../../components/DashboardPage';
import CalendarPage from '../../components/CalendarPage';
import ProductDetailModal from '../../components/ProductDetailModal';
import ProductFormModal from '../../components/ProductFormModal';
import ScanPage from '../../screens/ScanPage';
import { formatDate } from '../../utils/dateUtils';

export default function HomeScreen() {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Cargar productos desde la base de datos al iniciar
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsFromApi = await ApiService.getAllProducts();
      setProducts(productsFromApi);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudieron cargar los productos desde el servidor. Verifica que el backend esté funcionando.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    setProductToEdit(undefined);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const handleNavigation = useCallback((view: ViewMode) => {
    setCurrentView(view);
    setSearchTerm('');
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleAddProduct = useCallback(async (newProductData: ProductFormData) => {
    try {
      // Lógica de creación manual de producto
      await ApiService.createProduct(newProductData);
      await loadProducts();
      setIsFormModalOpen(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      Alert.alert('Error', error.message || 'No se pudo agregar el producto');
    }
  }, []);

  const handleUpdateProduct = useCallback(async (updatedProductData: ProductFormData) => {
    if (!productToEdit) return;

    try {
      // Actualizar la fecha de vencimiento si se proporciona
      if (updatedProductData.expiryDate && productToEdit.codebar) {
        // Pasar la fecha original y la nueva
        await ApiService.updateProductExpiration(
          productToEdit.codebar,
          productToEdit.expiryDate ? formatDate(productToEdit.expiryDate, 'YYYY-MM-DD') : '', // fecha original
          updatedProductData.expiryDate // nueva fecha (puede ser en cualquier formato)
        );
      }
      
      // Recargar productos para obtener los datos actualizados
      await loadProducts();
      setIsFormModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  }, [productToEdit]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      const productToDelete = products.find(p => p.id === productId);
      if (productToDelete?.codebar) {
        // Usar la fecha de vencimiento específica para eliminar solo esa entrada
        const expirationDate = productToDelete.expiryDate?.toISOString().split('T')[0];
        await ApiService.deleteProduct(productToDelete.codebar, expirationDate);
        await loadProducts(); // Recargar productos
        
        // Mostrar mensaje de confirmación
        Alert.alert(
          'Producto eliminado',
          `Se eliminó la entrada con fecha de vencimiento ${expirationDate}. Si hay otras entradas con el mismo código de barras pero diferentes fechas, estas se mantienen.`
        );
      }
      setSelectedProduct(null);
      setIsFormModalOpen(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'No se pudo eliminar el producto');
    }
  }, [products]);

  const handleIncrementQuantity = useCallback(async (product: Product) => {
    try {
      if (product.codebar) {
        await ApiService.incrementProductQuantity(
          product.codebar,
          1,
          product.expiryDate ? formatDate(product.expiryDate, 'YYYY-MM-DD') : undefined
        );
        await loadProducts(); // Recargar productos
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
      Alert.alert('Error', 'No se pudo incrementar la cantidad');
    }
  }, []);

  const handleDecrementQuantity = useCallback(async (product: Product) => {
    try {
      if (product.codebar && (product.quantity || 0) > 0) {
        await ApiService.decrementProductQuantity(
          product.codebar,
          1,
          product.expiryDate ? formatDate(product.expiryDate, 'YYYY-MM-DD') : undefined
        );
        await loadProducts(); // Recargar productos
      }
    } catch (error) {
      console.error('Error decrementing quantity:', error);
      Alert.alert('Error', 'No se pudo decrementar la cantidad');
    }
  }, []);

  const handleOpenFormModal = useCallback((product?: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
    setSelectedProduct(null);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setProductToEdit(undefined);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const searchLower = searchTerm.toLowerCase();
    return products.filter(product =>
      (product.name || product.productName || '').toLowerCase().includes(searchLower) ||
      (product.description || '').toLowerCase().includes(searchLower) ||
      (product.category || product.lab || '').toLowerCase().includes(searchLower)
    );
  }, [products, searchTerm]);

  // Handler para el FAB
  const handleFabClick = () => {
    setShowAddProductModal(true);
  };

  // Handler para agregar manualmente
  const handleAddManual = () => {
    setShowAddProductModal(false);
    handleOpenFormModal();
  };

  // Handler para escanear
  const handleAddScan = () => {
    setShowAddProductModal(false);
    setCurrentView(ViewMode.SCAN);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case ViewMode.DASHBOARD:
        return (
          <DashboardPage
            products={filteredProducts}
            onSelectProduct={handleSelectProduct}
            onRefresh={loadProducts}
            onAddProductClick={handleFabClick}
          />
        );
      case ViewMode.CALENDAR:
        return (
          <CalendarPage
            products={filteredProducts}
            onSelectProduct={handleSelectProduct}
            onRefresh={loadProducts}
          />
        );
      case ViewMode.SCAN:
        return <ScanPage />;
      default:
        return null;
    }
  };

  // Modal intermedio para elegir acción
  const renderAddProductModal = () => (
    <Modal
      visible={showAddProductModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAddProductModal(false)}
    >
      <View style={styles.addProductModalOverlay}>
        <View style={styles.addProductModalContent}>
          <Text style={styles.addProductModalTitle}>¿Cómo quieres agregar el producto?</Text>
          <TouchableOpacity style={styles.addProductModalButton} onPress={handleAddManual}>
            <Text style={styles.addProductModalButtonText}>Agregar manualmente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addProductModalButton} onPress={handleAddScan}>
            <Text style={styles.addProductModalButtonText}>Escanear producto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addProductModalCancel} onPress={() => setShowAddProductModal(false)}>
            <Text style={styles.addProductModalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigation}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      
      {renderCurrentView()}
      {renderAddProductModal()}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleCloseDetailModal}
          onEdit={() => handleOpenFormModal(selectedProduct)}
          onDelete={() => handleDeleteProduct(selectedProduct.id || '')}
          onIncrementQuantity={() => handleIncrementQuantity(selectedProduct)}
          onDecrementQuantity={() => handleDecrementQuantity(selectedProduct)}
        />
      )}

      {isFormModalOpen && (
        <ProductFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onSave={productToEdit ? handleUpdateProduct : handleAddProduct}
          productToEdit={productToEdit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  addProductModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: 300,
    alignItems: 'center',
  },
  addProductModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    color: '#0f172a',
    textAlign: 'center',
  },
  addProductModalButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  addProductModalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  addProductModalCancel: {
    marginTop: 8,
    alignItems: 'center',
  },
  addProductModalCancelText: {
    color: '#64748b',
    fontSize: 15,
  },
});
