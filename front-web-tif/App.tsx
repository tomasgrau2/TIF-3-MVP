import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, ViewMode } from './types';
import { ApiService, ProductFormData } from './services/api';
import Navbar from './components/Navbar';
import DashboardPage from './components/DashboardPage';
import CalendarPage from './components/CalendarPage';
import ProductDetailModal from './components/ProductDetailModal';
import ProductFormModal from './components/ProductFormModal'; // Import ProductFormModal
import AddIcon from './components/icons/AddIcon'; // For Add Product button
import ConfirmModal from './components/ConfirmModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for ProductFormModal
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; productId?: string }>({ open: false });

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
      alert('Error de conexión: No se pudieron cargar los productos desde el servidor. Verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    setProductToEdit(undefined); // Clear any edit state if just viewing details
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

  // CRUD Operations
  const handleAddProduct = useCallback(async (newProductData: Omit<Product, 'id' | 'expiryDate'> & { expiryDate: string }) => {
    try {
      const productFormData: ProductFormData = {
        codebar: newProductData.codebar || '',
        name: newProductData.name,
        description: newProductData.description,
        manufacturer: newProductData.manufacturer,
        lotNumber: newProductData.lotNumber,
        quantity: newProductData.quantity,
        unit: newProductData.unit,
        expiryDate: newProductData.expiryDate,
        category: newProductData.category,
        storageConditions: newProductData.storageConditions,
      };

      await ApiService.createProduct(productFormData);
      await loadProducts(); // Recargar productos
      setIsFormModalOpen(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`Error: ${error.message || 'No se pudo agregar el producto'}`);
    }
  }, []);

  const handleUpdateProduct = useCallback(async (updatedProductData: Product) => {
    try {
      const productFormData: ProductFormData = {
        codebar: updatedProductData.codebar || '',
        name: updatedProductData.name,
        description: updatedProductData.description,
        manufacturer: updatedProductData.manufacturer,
        lotNumber: updatedProductData.lotNumber,
        quantity: updatedProductData.quantity,
        unit: updatedProductData.unit,
        expiryDate: updatedProductData.expiryDate.toISOString().split('T')[0], // Convertir Date a string
        category: updatedProductData.category,
        storageConditions: updatedProductData.storageConditions,
      };

      await ApiService.updateProduct(updatedProductData.id, productFormData);
      await loadProducts(); // Recargar productos
      setIsFormModalOpen(false);
      setSelectedProduct(null); // Close detail modal if it was open for this product
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(`Error: ${error.message || 'No se pudo actualizar el producto'}`);
    }
  }, []);

  const handleDeleteProduct = useCallback((productId: string) => {
    setConfirmDelete({ open: true, productId });
  }, []);

  const confirmDeleteProduct = async () => {
    if (!confirmDelete.productId) return;
    try {
      const productToDelete = products.find(p => p.id === confirmDelete.productId);
      if (productToDelete?.codebar) {
        // Usar la fecha de vencimiento específica para eliminar solo esa entrada
        const expirationDate = productToDelete.expiryDate?.toISOString().split('T')[0];
        await ApiService.deleteProduct(productToDelete.codebar, expirationDate);
        await loadProducts();
        
        // Mostrar mensaje de confirmación
        alert(`Producto eliminado: Se eliminó la entrada con fecha de vencimiento ${expirationDate}. Si hay otras entradas con el mismo código de barras pero diferentes fechas, estas se mantienen.`);
      } else {
        throw new Error('Producto sin código de barras');
      }
      setSelectedProduct(null);
      setIsFormModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(`Error: ${error.message || 'No se pudo eliminar el producto'}`);
    } finally {
      setConfirmDelete({ open: false });
    }
  };

  const cancelDeleteProduct = () => setConfirmDelete({ open: false });

  const handleIncrementQuantity = useCallback(async (product: Product) => {
    try {
      if (product.codebar) {
        const updatedProduct = await ApiService.incrementProductQuantity(product.codebar, 1);
        await loadProducts(); // Recargar productos
        // Actualizar el producto seleccionado en el modal, manteniendo el id original
        setSelectedProduct({
          ...updatedProduct,
          id: product.id // Mantener el id original para consistencia
        });
      } else {
        throw new Error('Producto sin código de barras');
      }
    } catch (error: any) {
      console.error('Error incrementing quantity:', error);
      alert(`Error: ${error.message || 'No se pudo incrementar la cantidad'}`);
    }
  }, []);

  const handleDecrementQuantity = useCallback(async (product: Product) => {
    try {
      if (product.codebar && (product.quantity || 0) > 0) {
        const updatedProduct = await ApiService.decrementProductQuantity(product.codebar, 1);
        await loadProducts(); // Recargar productos
        // Actualizar el producto seleccionado en el modal, manteniendo el id original
        setSelectedProduct({
          ...updatedProduct,
          id: product.id // Mantener el id original para consistencia
        });
      } else if (!product.codebar) {
        throw new Error('Producto sin código de barras');
      }
    } catch (error: any) {
      console.error('Error decrementing quantity:', error);
      alert(`Error: ${error.message || 'No se pudo decrementar la cantidad'}`);
    }
  }, []);

  // Handlers for ProductFormModal
  const handleOpenFormModal = useCallback((product?: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
    setSelectedProduct(null); // Close detail modal when opening edit form
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setProductToEdit(undefined);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return []; 
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);
  
  const showSearchResults = searchTerm.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar 
        currentView={currentView} 
        onNavigate={handleNavigation}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      
      <main className="flex-grow p-4 md:p-6 lg:p-8 flex flex-col">
        {showSearchResults ? (
           <div className="mb-6 bg-white shadow-lg rounded-lg p-4">
             <h2 className="text-xl font-semibold text-slate-700 mb-3">Resultados de búsqueda para "{searchTerm}"</h2>
             {filteredProducts.length > 0 ? (
                <ul className="divide-y divide-slate-200 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {filteredProducts.map(product => (
                    <li 
                      key={product.id} 
                      onClick={() => handleSelectProduct(product)}
                      className="py-3 px-2 hover:bg-slate-100 cursor-pointer rounded-md transition-colors"
                    >
                      <h3 className="font-medium text-sky-600">{product.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      <p className="text-xs text-slate-400">Vence: {new Date(product.expiryDate).toLocaleDateString('es-ES')}</p>
                    </li>
                  ))}
                </ul>
             ) : (
                <p className="text-slate-500">No se encontraron productos que coincidan con tu búsqueda.</p>
             )}
           </div>
        ) : ( 
          <>
            {currentView === ViewMode.DASHBOARD && (
              <>
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => handleOpenFormModal()}
                    className="flex items-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-400"
                    aria-label="Agregar nuevo producto"
                  >
                    <AddIcon className="h-5 w-5 mr-2" />
                    Agregar Nuevo Producto
                  </button>
                </div>
                <DashboardPage products={products} onSelectProduct={handleSelectProduct} />
              </>
            )}
            {currentView === ViewMode.CALENDAR && (
              <div className="flex-grow min-h-0">
                <CalendarPage products={products} onSelectProduct={handleSelectProduct} />
              </div>
            )}
          </>
        )}
      </main>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={handleCloseDetailModal}
          onEdit={() => handleOpenFormModal(selectedProduct)}
          onDelete={() => handleDeleteProduct(selectedProduct.id)}
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
      
      <footer className="bg-slate-800 text-slate-300 text-center p-4 text-sm">
        VenciScan &copy; {new Date().getFullYear()}
      </footer>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteProduct}
        onCancel={cancelDeleteProduct}
      />
    </div>
  );
};

export default App;