import React from 'react';
import { Product } from '../types';
import { DATE_OPTIONS } from '../constants';
import PillIcon from './icons/PillIcon';
import AlertIcon from './icons/AlertIcon';
import InfoIcon from './icons/InfoIcon'; // Import InfoIcon

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  urgency?: 'expired' | 'today' | 'soon' | 'near' | 'normal';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct, urgency }) => {
  const getBorderColor = () => {
    switch (urgency) {
      case 'expired': return 'border-red-600 bg-red-50';
      case 'today': return 'border-red-500 bg-red-50';
      case 'soon': return 'border-orange-500 bg-orange-50';
      case 'near': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-slate-300 bg-white'; // 'normal' or undefined
    }
  };

  const getTextColor = () => {
     switch (urgency) {
      case 'expired': return 'text-red-700';
      case 'today': return 'text-red-600';
      case 'soon': return 'text-orange-600';
      case 'near': return 'text-yellow-700';
      default: return 'text-slate-700'; // 'normal' or undefined for main title
    }
  };
  
  const getExpiryMessageColor = () => {
    switch (urgency) {
      case 'expired': return 'text-red-700';
      case 'today': return 'text-red-600';
      case 'soon': return 'text-orange-600';
      // 'near' and 'normal' can use a less urgent color for the message itself if needed
      // but usually the specific message string already conveys this.
      default: return 'text-slate-600'; 
    }
  }


  const daysDiff = Math.ceil((new Date(product.expiryDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 3600 * 24));
  let expiryMessage: React.ReactNode;

  if (daysDiff < 0) {
    expiryMessage = <span className="font-semibold">Vencido hace {Math.abs(daysDiff)} días</span>;
  } else if (daysDiff === 0) {
    expiryMessage = <span className="font-semibold">¡Vence hoy!</span>;
  } else if (daysDiff === 1) {
    expiryMessage = <span className="font-semibold">Vence mañana</span>;
  } else {
    expiryMessage = `Vence en ${daysDiff} días`;
  }


  return (
    <div 
      className={`rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out border-t-4 p-5 cursor-pointer flex flex-col justify-between h-full ${getBorderColor()}`}
      onClick={() => onSelectProduct(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProduct(product);}}
      aria-label={`View details for ${product.name}`}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          {/* Status Icon: Alert for urgent, Info for normal */}
          {urgency === 'expired' && <AlertIcon className={`w-6 h-6 ${getTextColor()}`} aria-label="Expired product" />}
          {urgency === 'today' && <AlertIcon className={`w-6 h-6 ${getTextColor()}`} aria-label="Product expires today" />}
          {urgency === 'soon' && <AlertIcon className={`w-6 h-6 ${getTextColor()}`} aria-label="Product expiring soon" />}
          {urgency === 'near' && <AlertIcon className={`w-6 h-6 ${getTextColor()}`} aria-label="Product expiring in the near future" />}
          {(urgency === 'normal' || !urgency) && <InfoIcon className="w-6 h-6 text-sky-600" aria-label="Product information" />}
        </div>
        <h3 className={`text-lg font-semibold mb-1 ${getTextColor()}`}>{product.name}</h3>
        <p className="text-xs text-slate-500 mb-1">Código: {product.codebar || 'N/A'}</p>
        <p className={`text-sm ${getExpiryMessageColor()} mb-3`}>
          {expiryMessage} ({new Date(product.expiryDate).toLocaleDateString('es-ES', DATE_OPTIONS)})
        </p>
        <p className="text-xs text-slate-600 line-clamp-2">{product.description}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          <span className="font-medium">Cantidad:</span> {product.quantity} {product.unit}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;