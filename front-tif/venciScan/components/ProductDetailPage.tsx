import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Fecha de vencimiento</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  const expiryDate = product.expiryDate || (product.expirationDate ? new Date(product.expirationDate) : null);
                  return expiryDate 
                    ? format(expiryDate, 'dd MMMM yyyy', { locale: es })
                    : 'Fecha no disponible';
                })()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cantidad disponible</Text>
              <Text style={styles.detailValue}>{product.quantity} unidades</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  details: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
});

export default ProductDetailPage; 