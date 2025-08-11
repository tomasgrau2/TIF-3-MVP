import React, { useMemo } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import AlertIcon from './icons/AlertIcon';
import PillIcon from './icons/PillIcon';
import InfoIcon from './icons/InfoIcon'; // Import InfoIcon

interface DashboardPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

interface CategorizedProducts {
  expired: Product[];
  expiresToday: Product[];
  expiresIn7Days: Product[];
  expiresIn30Days: Product[];
  other: Product[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ products, onSelectProduct }) => {
  const categorizedProducts = useMemo<CategorizedProducts>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const categories: CategorizedProducts = {
      expired: [],
      expiresToday: [],
      expiresIn7Days: [],
      expiresIn30Days: [],
      other: [],
    };

    products.forEach(product => {
      const expiryDate = new Date(product.expiryDate); // Ensure it's a Date object
      expiryDate.setHours(0,0,0,0); // Normalize expiry to start of day for comparison

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        categories.expired.push(product);
      } else if (diffDays === 0) {
        categories.expiresToday.push(product);
      } else if (diffDays <= 7) {
        categories.expiresIn7Days.push(product);
      } else if (diffDays <= 30) {
        categories.expiresIn30Days.push(product);
      } else {
        categories.other.push(product);
      }
    });
    
    // Sort each category by expiry date (soonest first)
    for (const key in categories) {
        categories[key as keyof CategorizedProducts].sort((a, b) => 
            new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
    }

    return categories;
  }, [products]);

  const renderProductSection = (title: string, items: Product[], urgency: 'expired' | 'today' | 'soon' | 'near' | 'normal', iconColor: string) => {
    if (items.length === 0) return null;
    const SectionIcon = urgency === 'normal' ? InfoIcon : AlertIcon;
    return (
      <section className="mb-10" aria-labelledby={`section-title-${urgency}`}>
        <div className="flex items-center mb-5">
          <SectionIcon className={`w-7 h-7 mr-3 ${iconColor}`} aria-hidden="true" />
          <h2 id={`section-title-${urgency}`} className={`text-2xl font-semibold ${iconColor}`}>{title} ({items.length})</h2>
        </div>
        {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map(product => (
                <ProductCard key={product.id} product={product} onSelectProduct={onSelectProduct} urgency={urgency} />
            ))}
            </div>
        ) : (
            <p className="text-slate-500 italic">No hay productos en esta categoría.</p>
        )}
      </section>
    );
  };

  const hasProducts = products.length > 0;
  const hasCategorizedProducts = Object.values(categorizedProducts).some(category => category.length > 0);

  return (
    <div className="space-y-8">
      {renderProductSection('Productos vencidos', categorizedProducts.expired, 'expired', 'text-red-600')}
      {renderProductSection('Vencen hoy', categorizedProducts.expiresToday, 'today', 'text-red-500')}
      {renderProductSection('Vencen en 7 días', categorizedProducts.expiresIn7Days, 'soon', 'text-orange-500')}
      {renderProductSection('Vencen en 30 días', categorizedProducts.expiresIn30Days, 'near', 'text-yellow-600')}
      {renderProductSection('Otros productos', categorizedProducts.other, 'normal', 'text-sky-600')}
      
      {!hasProducts && (
        <div className="text-center py-10">
          <PillIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600">No se encontraron productos</h3>
          <p className="text-slate-400">Agrega productos para verlos aquí.</p>
        </div>
      )}
      {hasProducts && !hasCategorizedProducts && (
         <div className="text-center py-10">
          <PillIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600">Todos los productos están al día.</h3>
          <p className="text-slate-400">Ningún producto está por vencer o vencido.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;