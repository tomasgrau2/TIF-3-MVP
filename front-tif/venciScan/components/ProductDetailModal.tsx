import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Product } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onIncrementQuantity?: () => void;
  onDecrementQuantity?: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onEdit,
  onDelete,
  onIncrementQuantity,
  onDecrementQuantity,
}) => {
  // Estado local para la cantidad
  const [localQuantity, setLocalQuantity] = useState(product.quantity || 1);

  // Sincronizar con cambios externos (por ejemplo, al cambiar de producto)
  useEffect(() => {
    setLocalQuantity(product.quantity || 1);
  }, [product.quantity]);

  // Handlers locales para + y -
  const handleIncrement = () => {
    setLocalQuantity(q => q + 1);
    if (onIncrementQuantity) onIncrementQuantity();
  };
  const handleDecrement = () => {
    if (localQuantity > 0) {
      setLocalQuantity(q => q - 1);
      if (onDecrementQuantity) onDecrementQuantity();
    }
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const sections = [
    {
      id: 'header',
      render: () => (
        <View style={styles.header}>
          <Text style={styles.title}>{capitalizeFirst(product.name || '')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      id: 'description',
      render: () => (
        <View style={styles.section}>
          <Text style={styles.label}>Descripción</Text>
          <Text style={styles.value}>{capitalizeFirst(product.description || '')}</Text>
        </View>
      ),
    },
    {
      id: 'expiryDate',
      render: () => {
        const expiryDate = product.expiryDate || (product.expirationDate ? new Date(product.expirationDate) : null);
        return (
          <View style={styles.section}>
            <Text style={styles.label}>Fecha de vencimiento</Text>
            <Text style={styles.value}>
              {expiryDate 
                ? format(expiryDate, 'dd MMMM yyyy', { locale: es })
                : 'Fecha no disponible'
              }
            </Text>
          </View>
        );
      },
    },
    {
      id: 'quantity',
      render: () => (
        <View style={styles.section}>
          <Text style={styles.label}>Cantidad</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={handleDecrement}
              disabled={!onDecrementQuantity}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{localQuantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={handleIncrement}
              disabled={!onIncrementQuantity}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    ...(product.batchNumber ? [{
      id: 'batchNumber',
      render: () => (
        <View style={styles.section}>
          <Text style={styles.label}>Número de lote</Text>
          <Text style={styles.value}>{product.batchNumber}</Text>
        </View>
      ),
    }] : []),
    ...(product.supplier ? [{
      id: 'supplier',
      render: () => (
        <View style={styles.section}>
          <Text style={styles.label}>Proveedor</Text>
          <Text style={styles.value}>{product.supplier}</Text>
        </View>
      ),
    }] : []),
    ...(product.location ? [{
      id: 'location',
      render: () => (
        <View style={styles.section}>
          <Text style={styles.label}>Ubicación</Text>
          <Text style={styles.value}>{product.location}</Text>
        </View>
      ),
    }] : []),
  ];

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <FlatList
            data={sections}
            renderItem={({ item }) => item.render()}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.scrollView}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={onEdit}
            >
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onDelete}
            >
              <Text style={[styles.buttonText, styles.deleteButtonText]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748b',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#0f172a',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  quantityValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    minWidth: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#0ea5e9',
  },
  deleteButton: {
    backgroundColor: '#f1f5f9',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});

export default ProductDetailModal; 