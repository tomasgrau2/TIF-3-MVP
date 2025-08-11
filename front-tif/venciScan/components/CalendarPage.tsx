import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, FlatList } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Product } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onRefresh?: () => Promise<void>;
}

const CalendarPage: React.FC<CalendarPageProps> = ({
  products,
  onSelectProduct,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [productListModalVisible, setProductListModalVisible] = useState(false);
  const [productsForSelectedDate, setProductsForSelectedDate] = useState<Product[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  const markedDates = useMemo(() => {
    const dates: { [key: string]: { marked: boolean; dotColor: string } } = {};
    
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
        console.warn('Error parsing date for product in calendar:', product.codebar, error);
        expiryDate = null;
      }
      
      if (!expiryDate) {
        // Si no hay fecha de vencimiento válida, saltar este producto
        return;
      }
      
      const dateStr = format(expiryDate, 'yyyy-MM-dd');
      dates[dateStr] = {
        marked: true,
        dotColor: '#0ea5e9',
      };
    });
    
    return dates;
  }, [products]);

  const getProductsForDate = (date: string) => {
    return products.filter(product => {
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
        console.warn('Error parsing date for product in getProductsForDate:', product.codebar, error);
        expiryDate = null;
      }
      
      return expiryDate && format(expiryDate, 'yyyy-MM-dd') === date;
    });
  };

  const handleDayPress = (dateObj: any) => {
    const dateString = dateObj.dateString;
    const productsForDate = getProductsForDate(dateString);
    if (productsForDate.length === 1) {
      onSelectProduct(productsForDate[0]);
    } else if (productsForDate.length > 1) {
      setProductsForSelectedDate(productsForDate);
      setProductListModalVisible(true);
    }
  };

  const renderDayComponent = ({ date, state }: any) => {
    const productsForDate = getProductsForDate(date.dateString);
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          state === 'today' && styles.todayContainer,
        ]}
        onPress={() => handleDayPress(date)}
      >
        <Text style={[
          styles.dayText,
          state === 'disabled' && styles.disabledText,
          state === 'today' && styles.todayText,
        ]}>
          {date.day}
        </Text>
        {productsForDate.length > 0 && (
          <View style={styles.dot} />
        )}
      </TouchableOpacity>
    );
  };

  const renderProductListModal = () => (
    <Modal
      visible={productListModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setProductListModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.productListModalContent}>
          <Text style={styles.productListTitle}>Productos que vencen este día</Text>
          <FlatList
            data={productsForSelectedDate}
            keyExtractor={item => item.id || item._id || item.codebar || 'unknown'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productListItem}
                onPress={() => {
                  setProductListModalVisible(false);
                  onSelectProduct(item);
                }}
              >
                <Text style={styles.productListItemText}>{item.name || item.productName}</Text>
                <Text style={styles.productListItemLab}>{item.lab || item.category}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeProductListButton}
            onPress={() => setProductListModalVisible(false)}
          >
            <Text style={styles.closeProductListButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Productos que vencen en el mes visible
  const productsForCurrentMonth = useMemo(() => {
    return products.filter(product => {
      let expiryDate: Date | null = null;
      try {
        if (product.expiryDate) {
          expiryDate = new Date(product.expiryDate);
          if (isNaN(expiryDate.getTime())) expiryDate = null;
        } else if (product.expirationDate) {
          expiryDate = new Date(product.expirationDate);
          if (isNaN(expiryDate.getTime())) expiryDate = null;
        }
      } catch {
        expiryDate = null;
      }
      if (!expiryDate) return false;
      const year = expiryDate.getFullYear();
      const month = expiryDate.getMonth() + 1;
      const [currYear, currMonth] = currentMonth.split('-').map(Number);
      return year === currYear && month === currMonth;
    });
  }, [products, currentMonth]);

  // Configurar el calendario en español
  LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy'
  };
  LocaleConfig.defaultLocale = 'es';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
      >
        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#64748b',
            selectedDayBackgroundColor: '#0ea5e9',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#0ea5e9',
            dayTextColor: '#0f172a',
            textDisabledColor: '#cbd5e1',
            dotColor: '#0ea5e9',
            selectedDotColor: '#ffffff',
            arrowColor: '#0ea5e9',
            monthTextColor: '#0f172a',
            indicatorColor: '#0ea5e9',
          }}
          dayComponent={renderDayComponent}
          markedDates={markedDates}
          enableSwipeMonths={true}
          onMonthChange={(date) => {
            setCurrentMonth(`${date.year}-${String(date.month).padStart(2, '0')}`);
          }}
        />
        {/* Lista de productos que vencen en el mes */}
        <View style={styles.monthListContainer}>
          <Text style={styles.monthListTitle}>Productos que vencen este mes</Text>
          {productsForCurrentMonth.length === 0 ? (
            <Text style={styles.monthListEmpty}>No hay productos que venzan este mes.</Text>
          ) : (
            productsForCurrentMonth.map(product => {
              let expiryDate: Date | null = null;
              try {
                if (product.expiryDate) {
                  expiryDate = new Date(product.expiryDate);
                  if (isNaN(expiryDate.getTime())) expiryDate = null;
                } else if (product.expirationDate) {
                  expiryDate = new Date(product.expirationDate);
                  if (isNaN(expiryDate.getTime())) expiryDate = null;
                }
              } catch {
                expiryDate = null;
              }
              const productName = product.name || product.productName || 'Producto sin nombre';
              const productDescription = product.description || `${productName} - ${product.lab || 'Sin laboratorio'}`;
              return (
                <TouchableOpacity
                  key={product.id || product._id || product.codebar || Math.random().toString()}
                  style={styles.productCard}
                  onPress={() => onSelectProduct(product)}
                >
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{productName}</Text>
                  </View>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {productDescription}
                  </Text>
                  <View style={styles.productFooter}>
                    <Text style={styles.expiryDate}>
                      Vence: {expiryDate ? format(expiryDate, 'dd MMM yyyy', { locale: es }) : 'Fecha no disponible'}
                    </Text>
                    <Text style={styles.quantity}>
                      Cantidad: {product.quantity || 1}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      {renderProductListModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  calendar: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
  },
  todayContainer: {
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#0f172a',
  },
  disabledText: {
    color: '#cbd5e1',
  },
  todayText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0ea5e9',
    position: 'absolute',
    bottom: 4,
  },
  // Modal de selección de productos
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  productListModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '60%',
  },
  productListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#0f172a',
    textAlign: 'center',
  },
  productListItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  productListItemText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  productListItemLab: {
    fontSize: 13,
    color: '#64748b',
  },
  closeProductListButton: {
    marginTop: 18,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeProductListButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  monthListContainer: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
  },
  monthListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  monthListEmpty: {
    color: '#64748b',
    fontSize: 15,
    fontStyle: 'italic',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  quantity: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default CalendarPage; 