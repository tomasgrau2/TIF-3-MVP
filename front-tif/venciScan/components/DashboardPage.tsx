import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { Product } from '../types';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import AlertIcon from './icons/AlertIcon';
import InfoIcon from './icons/InfoIcon';
import PillIcon from './icons/PillIcon';

interface DashboardPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onRefresh?: () => Promise<void>;
  onAddProductClick?: () => void;
}

interface CategorizedProducts {
  expired: Product[];
  expiresToday: Product[];
  expiresIn7Days: Product[];
  expiresIn30Days: Product[];
  other: Product[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  products,
  onSelectProduct,
  onRefresh,
  onAddProductClick,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing products:', error);
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const categorizedProducts = useMemo<CategorizedProducts>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const categories: CategorizedProducts = {
      expired: [],
      expiresToday: [],
      expiresIn7Days: [],
      expiresIn30Days: [],
      other: [],
    };

    products.forEach(product => {
      // Validar y crear la fecha de vencimiento de forma segura
      let expiryDate: Date | null = null;
      try {
        if (product.expiryDate) {
          expiryDate = new Date(product.expiryDate);
          // Verificar si la fecha es válida
          if (isNaN(expiryDate.getTime())) {
            expiryDate = null;
          }
        } else if (product.expirationDate) {
          expiryDate = new Date(product.expirationDate);
          // Verificar si la fecha es válida
          if (isNaN(expiryDate.getTime())) {
            expiryDate = null;
          }
        }
      } catch (error) {
        console.warn('Error parsing date for product in categorization:', product.codebar, error);
        expiryDate = null;
      }
      
      if (!expiryDate) {
        // Si no hay fecha de vencimiento válida, agregar a "otros productos"
        categories.other.push(product);
        return;
      }

      const expiryDateNormalized = new Date(expiryDate);
      expiryDateNormalized.setHours(0, 0, 0, 0);

      const diffDays = differenceInDays(expiryDateNormalized, today);

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
      categories[key as keyof CategorizedProducts].sort((a, b) => {
        // Función helper para obtener fecha válida
        const getValidDate = (product: Product): Date => {
          try {
            if (product.expiryDate) {
              const date = new Date(product.expiryDate);
              if (!isNaN(date.getTime())) return date;
            }
            if (product.expirationDate) {
              const date = new Date(product.expirationDate);
              if (!isNaN(date.getTime())) return date;
            }
          } catch (error) {
            console.warn('Error parsing date for sorting:', product.codebar, error);
          }
          return new Date(0); // Fecha por defecto si no hay fecha válida
        };

        const dateA = getValidDate(a);
        const dateB = getValidDate(b);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return categories;
  }, [products]);

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const productName = capitalizeFirst(item.name || item.productName || 'Producto sin nombre');
    const productDescription = capitalizeFirst(item.description || `${item.name || item.productName || 'Producto sin nombre'} - ${item.lab || 'Sin laboratorio'}`);
    
    // Validar y crear la fecha de vencimiento de forma segura
    let expiryDate: Date | null = null;
    try {
      if (item.expiryDate) {
        expiryDate = new Date(item.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = null;
        }
      } else if (item.expirationDate) {
        expiryDate = new Date(item.expirationDate);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = null;
        }
      }
    } catch (error) {
      console.warn('Error parsing date for product in render:', item.codebar, error);
      expiryDate = null;
    }
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => onSelectProduct(item)}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{productName}</Text>
        </View>
        
        <Text style={styles.productDescription} numberOfLines={2}>
          {productDescription}
        </Text>
        
        <View style={styles.productFooter}>
          <Text style={[
            styles.expiryDate,
            expiryDate && (isPast(expiryDate) || isToday(expiryDate)) && styles.expiredText
          ]}>
            Vence: {expiryDate 
              ? format(expiryDate, 'dd MMM yyyy', { locale: es })
              : 'Fecha no disponible'
            }
          </Text>
          <Text style={styles.quantity}>
            Cantidad: {item.quantity || 1}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getUrgencyColor = (urgency: 'expired' | 'today' | 'soon' | 'near' | 'normal') => {
    switch (urgency) {
      case 'expired':
        return '#dc2626'; // red-600
      case 'today':
        return '#ef4444'; // red-500
      case 'soon':
        return '#f97316'; // orange-500
      case 'near':
        return '#d97706'; // yellow-600
      default:
        return '#0284c7'; // sky-600
    }
  };

  const sections = [
    { id: 'expired', title: 'Productos vencidos', data: categorizedProducts.expired, urgency: 'expired' as const },
    { id: 'today', title: 'Vencen hoy', data: categorizedProducts.expiresToday, urgency: 'today' as const },
    { id: '7days', title: 'Vencen en 7 días', data: categorizedProducts.expiresIn7Days, urgency: 'soon' as const },
    { id: '30days', title: 'Vencen en 30 días', data: categorizedProducts.expiresIn30Days, urgency: 'near' as const },
    { id: 'other', title: 'Otros productos', data: categorizedProducts.other, urgency: 'normal' as const },
  ];

  const hasProducts = products.length > 0;
  const hasCategorizedProducts = Object.values(categorizedProducts).some(category => category.length > 0);

  const renderSectionHeader = ({ section }: { section: { title: string; data: Product[]; urgency: 'expired' | 'today' | 'soon' | 'near' | 'normal' } }) => {
    if (section.data.length === 0) return null;

    const getIcon = () => {
      switch (section.urgency) {
        case 'expired':
          return <AlertIcon color="#dc2626" size={24} />;
        case 'today':
          return <AlertIcon color="#ef4444" size={24} />;
        case 'soon':
          return <AlertIcon color="#f97316" size={24} />;
        case 'near':
          return <AlertIcon color="#d97706" size={24} />;
        default:
          return <InfoIcon color="#0284c7" size={24} />;
      }
    };

    return (
      <View style={styles.sectionHeader}>
        {getIcon()}
        <Text style={[styles.sectionTitle, { color: getUrgencyColor(section.urgency) }]}>
          {section.title} ({section.data.length})
        </Text>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (!hasProducts) {
      return (
        <View style={styles.emptyContainer}>
          <PillIcon color="#94a3b8" size={64} />
          <Text style={styles.emptyTitle}>No se encontraron productos</Text>
          <Text style={styles.emptyText}>Agrega productos para verlos aquí.</Text>
        </View>
      );
    }
    if (!hasCategorizedProducts) {
      return (
        <View style={styles.emptyContainer}>
          <PillIcon color="#94a3b8" size={64} />
          <Text style={styles.emptyTitle}>Todos los productos están al día</Text>
          <Text style={styles.emptyText}>Ningún producto está por vencer o vencido.</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id || item._id || item.codebar || 'unknown'}
        renderItem={renderProductItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0ea5e9']}
            tintColor="#0ea5e9"
            title="Actualizando productos..."
            titleColor="#64748b"
          />
        }
      />
      {/* FAB */}
      {onAddProductClick && (
        <TouchableOpacity style={styles.fab} onPress={onAddProductClick}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 96,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  productDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryDate: {
    fontSize: 12,
    color: '#64748b',
  },
  expiredText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  quantity: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 100,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
});

export default DashboardPage; 