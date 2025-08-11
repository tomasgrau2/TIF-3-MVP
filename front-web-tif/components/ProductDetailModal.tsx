import React from 'react';
import { Product } from '../types';
import { DATE_OPTIONS } from '../constants';
import CloseIcon from './icons/CloseIcon';
import PillIcon from './icons/PillIcon';
import InfoIcon from './icons/InfoIcon';
import AlertIcon from './icons/AlertIcon';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void; // Callback to open edit form
  onDelete: () => void; // Callback to delete product
  onIncrementQuantity?: () => void; // Callback to increment quantity
  onDecrementQuantity?: () => void; // Callback to decrement quantity
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  onClose, 
  onEdit, 
  onDelete, 
  onIncrementQuantity, 
  onDecrementQuantity 
}) => {


  const daysDiff = Math.ceil((new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  let expiryStatusColor = 'text-slate-700';
  let expiryText = `Vence el: ${new Date(product.expiryDate).toLocaleDateString('es-ES', DATE_OPTIONS)} (${daysDiff} días restantes)`;

  if (daysDiff < 0) {
    expiryStatusColor = 'text-red-600 font-semibold';
    expiryText = `Venció el: ${new Date(product.expiryDate).toLocaleDateString('es-ES', DATE_OPTIONS)} (hace ${Math.abs(daysDiff)} días)`;
  } else if (daysDiff === 0) {
    expiryStatusColor = 'text-red-500 font-semibold';
    expiryText = `¡Vence hoy! (${new Date(product.expiryDate).toLocaleDateString('es-ES', DATE_OPTIONS)})`;
  } else if (daysDiff <= 7) {
    expiryStatusColor = 'text-orange-500 font-semibold';
    expiryText = `Vence pronto: ${new Date(product.expiryDate).toLocaleDateString('es-ES', DATE_OPTIONS)} (${daysDiff} días)`;
  } else if (daysDiff <= 30) {
    expiryStatusColor = 'text-yellow-600 font-semibold';
    expiryText = `Vence en menos de un mes: ${new Date(product.expiryDate).toLocaleDateString('es-ES', DATE_OPTIONS)} (${daysDiff} días)`;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-opacity duration-300"
      onClick={onClose} 
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()} 
      >
        <header className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold text-sky-700">{product.name}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-100"
            aria-label="Close modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className={`p-4 rounded-lg border-l-4 ${
              daysDiff < 0 ? 'bg-red-50 border-red-500' : 
              daysDiff === 0 ? 'bg-red-50 border-red-500' :
              daysDiff <= 7 ? 'bg-orange-50 border-orange-500' :
              daysDiff <= 30 ? 'bg-yellow-50 border-yellow-500' :
              'bg-sky-50 border-sky-500'
            }`}
          >
            <div className="flex items-center">
              <AlertIcon className={`w-6 h-6 mr-3 ${expiryStatusColor}`} />
              <p className={`text-md ${expiryStatusColor}`}>{expiryText}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div><strong className="text-slate-600">Código de Barras:</strong> <span className="text-slate-800">{product.codebar || 'No especificado'}</span></div>
            <div><strong className="text-slate-600">Laboratorio:</strong> <span className="text-slate-800">{product.manufacturer}</span></div>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-slate-600">Cantidad:</strong> 
                <span className="text-slate-800 ml-2">{product.quantity} {product.unit}</span>
              </div>
              {onIncrementQuantity && onDecrementQuantity && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onDecrementQuantity}
                    disabled={product.quantity <= 0}
                    className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold transition-colors"
                    aria-label="Decrementar cantidad"
                  >
                    -
                  </button>
                  <button
                    onClick={onIncrementQuantity}
                    className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center justify-center text-sm font-bold transition-colors"
                    aria-label="Incrementar cantidad"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <strong className="text-slate-600 block mb-1">Descripción:</strong>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">{product.description}</p>
          </div>


        </div>
        
        <footer className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
            <div className="flex items-center">
              <button 
                  onClick={onEdit}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 text-sm font-medium flex items-center"
                  aria-label="Editar producto"
              >
                  <EditIcon className="w-4 h-4 mr-2" /> Editar
              </button>
              <button 
                  onClick={onDelete}
                  className="ml-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 text-sm font-medium flex items-center"
                  aria-label="Eliminar producto"
              >
                  <DeleteIcon className="w-4 h-4 mr-2" /> Eliminar
              </button>
            </div>
            <button 
                onClick={onClose} 
                className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
                Cerrar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ProductDetailModal;