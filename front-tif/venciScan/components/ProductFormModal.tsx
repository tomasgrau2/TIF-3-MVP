import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Product, ProductFormData } from '../types';
import SmartDateInput from './SmartDateInput';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: ProductFormData) => void;
  productToEdit?: Product;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    codebar: '',
    name: '',
    description: '',
    category: '',
    expiryDate: new Date().toISOString().split('T')[0],
    quantity: '0',
    batchNumber: '',
    supplier: '',
    location: '',
  });

  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        codebar: productToEdit.codebar || '',
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        category: productToEdit.category || '',
        expiryDate: productToEdit.expiryDate ? productToEdit.expiryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        quantity: (productToEdit.quantity || 1).toString(),
        batchNumber: productToEdit.batchNumber || '',
        supplier: productToEdit.supplier || '',
        location: productToEdit.location || '',
      });
    }
    // Limpiar errores cuando se abre el modal
    setValidationErrors(new Set());
  }, [productToEdit, isOpen]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const errorFields = new Set<string>();
    
    if (!formData.codebar.trim()) {
      errors.push('• Código de barras');
      errorFields.add('codebar');
    }
    if (!formData.name.trim()) {
      errors.push('• Nombre del producto');
      errorFields.add('name');
    }
    if (!formData.description.trim()) {
      errors.push('• Descripción');
      errorFields.add('description');
    }
    if (!formData.expiryDate) {
      errors.push('• Fecha de vencimiento');
      errorFields.add('expiryDate');
    }
    if (!formData.quantity.trim() || parseInt(formData.quantity) <= 0) {
      errors.push('• Cantidad (debe ser mayor a 0)');
      errorFields.add('quantity');
    }
    setValidationErrors(errorFields);
    return errors.length === 0;
  };

  const getInputStyle = (fieldName: string) => {
    const hasError = validationErrors.has(fieldName);
    return [
      styles.input,
      hasError && styles.inputError
    ];
  };



  const getLabelStyle = (fieldName: string) => [
    styles.label,
    validationErrors.has(fieldName) && styles.labelError
  ];

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };



  const clearFieldError = (fieldName: string) => {
    if (validationErrors.has(fieldName)) {
      const newErrors = new Set(validationErrors);
      newErrors.delete(fieldName);
      setValidationErrors(newErrors);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    clearFieldError(fieldName);
  };

  const formSections = [
    {
      id: 'header',
      render: () => (
        <View style={styles.header}>
          <Text style={styles.title}>
            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      id: 'codebar',
      render: () => (
        <View style={styles.formGroup}>
          <Text style={getLabelStyle('codebar')}>Código de barras *</Text>
          <TextInput
            style={getInputStyle('codebar')}
            value={formData.codebar}
            onChangeText={(text) => handleFieldChange('codebar', text)}
            placeholder="Código de barras del producto"
            keyboardType="numeric"
          />
        </View>
      ),
    },
    {
      id: 'name',
      render: () => (
        <View style={styles.formGroup}>
          <Text style={getLabelStyle('name')}>Nombre *</Text>
          <TextInput
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={(text) => handleFieldChange('name', text)}
            placeholder="Nombre del producto"
          />
        </View>
      ),
    },
    {
      id: 'description',
      render: () => (
        <View style={styles.formGroup}>
          <Text style={getLabelStyle('description')}>Descripción *</Text>
          <TextInput
            style={[getInputStyle('description'), styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleFieldChange('description', text)}
            placeholder="Descripción del producto"
            multiline
            numberOfLines={3}
          />
        </View>
      ),
    },
    {
      id: 'expiryDate',
      render: () => (
        <View style={styles.formGroup}>
          <Text style={getLabelStyle('expiryDate')}>Fecha de vencimiento *</Text>
          <SmartDateInput
            value={formData.expiryDate}
            onChangeText={(text) => handleFieldChange('expiryDate', text)}
            placeholder="MM/YYYY, MM.YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/YY, MM.YY, MM-YY"
            error={validationErrors.has('expiryDate') ? 'Fecha de vencimiento es requerida' : undefined}
            onValidationChange={(isValid) => {
              if (isValid) {
                clearFieldError('expiryDate');
              }
            }}
          />
        </View>
      ),
    },
    {
      id: 'quantity',
      render: () => (
        <View style={styles.formGroup}>
          <Text style={getLabelStyle('quantity')}>Cantidad *</Text>
          <TextInput
            style={getInputStyle('quantity')}
            value={formData.quantity}
            onChangeText={(text) => handleFieldChange('quantity', text)}
            placeholder="Cantidad"
            keyboardType="numeric"
          />
        </View>
      ),
    },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {validationErrors.size > 0 && (
            <View style={styles.validationWarningBox}>
              <Text style={styles.validationWarningText}>
                Por favor completa los campos obligatorios marcados en rojo.
              </Text>
            </View>
          )}
          <FlatList
            data={formSections}
            renderItem={({ item }) => item.render()}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.scrollView}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>
                {productToEdit ? 'Guardar' : 'Crear'}
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
    maxHeight: '90%',
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#64748b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  labelError: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  validationWarningBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginBottom: 0,
    alignItems: 'center',
  },
  validationWarningText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProductFormModal; 