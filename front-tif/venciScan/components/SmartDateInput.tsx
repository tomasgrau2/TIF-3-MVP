import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { parseDate, getFormatSuggestions, formatDate, DateParseResult } from '../utils/dateUtils';

interface SmartDateInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  onValidationChange?: (isValid: boolean) => void;
  style?: any;
  containerStyle?: any;
}

const SmartDateInput: React.FC<SmartDateInputProps> = ({
  value,
  onChangeText,
  placeholder = "MM/YYYY, MM.YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/YY, MM.YY, MM-YY",
  label,
  error,
  onValidationChange,
  style,
  containerStyle,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationResult, setValidationResult] = useState<DateParseResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Parse and validate date when value changes
  useEffect(() => {
    console.log('SmartDateInput value changed:', value);
    if (value.trim()) {
      const result = parseDate(value);
      setValidationResult(result);
      onValidationChange?.(result.isValid);
      
      // Get format suggestions for partial input
      const formatSuggestions = getFormatSuggestions(value);
      setSuggestions(formatSuggestions);
    } else {
      setValidationResult(null);
      setSuggestions([]);
      onValidationChange?.(false);
    }
  }, [value, onValidationChange]);

  const handleTextChange = (text: string) => {
    console.log('SmartDateInput handleTextChange:', text);
    onChangeText(text);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    console.log('DatePicker event:', event.type, 'selectedDate:', selectedDate);
    setShowDatePicker(false);
    
    if (selectedDate && event.type !== 'dismissed') {
      // Determinar el formato apropiado basándose en el valor actual
      const targetFormat = getAppropriateFormat(value);
      
      const formattedDate = formatDate(selectedDate, targetFormat);
      console.log('DatePicker selected:', selectedDate, 'formatted as:', formattedDate, 'using format:', targetFormat);
      onChangeText(formattedDate);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setShowSuggestions(false);
    // Show a hint about the format
    Alert.alert(
      'Formato sugerido',
      `Puedes usar el formato: ${suggestion}`,
      [{ text: 'OK' }]
    );
  };

  // Función helper para determinar el formato apropiado
  const getAppropriateFormat = (currentValue: string): string => {
    if (!currentValue) return 'MM/YYYY'; // Por defecto
    
    // Verificar si el valor actual tiene formato con día
    const currentResult = parseDate(currentValue);
    if (currentResult.isValid && currentResult.format) {
      // Si el formato actual incluye DD, mantener formato con día
      if (currentResult.format.includes('DD')) {
        return 'DD/MM/YYYY';
      }
      // Si el formato actual es solo MM/YYYY, mantener ese formato
      if (currentResult.format === 'MM/YYYY' || currentResult.format === 'MM.YYYY' || currentResult.format === 'MM-YYYY') {
        return 'MM/YYYY';
      }
    }
    
    // Verificar por patrones en el texto
    if (currentValue.includes('/') && currentValue.split('/').length === 3) {
      return 'DD/MM/YYYY';
    }
    if (currentValue.includes('.') && currentValue.split('.').length === 3) {
      return 'DD.MM.YYYY';
    }
    if (currentValue.includes('-') && currentValue.split('-').length === 3) {
      return 'YYYY-MM-DD';
    }
    
    return 'MM/YYYY'; // Por defecto
  };

  const handleFormatHelp = () => {
    const supportedFormats = [
      'MM/YYYY (ej: 12/2024)',
      'MM.YYYY (ej: 12.2024)',
      'MM-YYYY (ej: 12-2024)',
      'MM/YY (ej: 12/24)',
      'MM.YY (ej: 12.24)',
      'MM-YY (ej: 12-24)',
      'DD/MM/YYYY (ej: 25/12/2024)',
      'DD.MM.YYYY (ej: 25.12.2024)',
      'YYYY-MM-DD (ej: 2024-12-25)'
    ];
    
    Alert.alert(
      'Formatos de fecha soportados',
      supportedFormats.join('\n'),
      [{ text: 'Entendido' }]
    );
  };

  const getInputStyle = () => {
    let inputStyle = [styles.input, style];
    
    if (validationResult) {
      if (validationResult.isValid) {
        inputStyle.push(styles.inputValid);
      } else {
        inputStyle.push(styles.inputInvalid);
      }
    }
    
    if (error) {
      inputStyle.push(styles.inputError);
    }
    
    return inputStyle;
  };

  const getValidationIcon = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
    } else {
      return <Ionicons name="close-circle" size={20} color="#ef4444" />;
    }
  };

  const getValidationText = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      return (
        <Text style={styles.validationTextValid}>
          ✓ Fecha válida ({validationResult.format})
        </Text>
      );
    } else {
      return (
        <Text style={styles.validationTextInvalid}>
          ✗ {validationResult.error}
        </Text>
      );
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={getInputStyle()}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow for suggestion press
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        
        <View style={styles.inputActions}>
          {getValidationIcon()}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#0ea5e9" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFormatHelp}
          >
            <Ionicons name="help-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Validation message */}
      {getValidationText()}
      
      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Format suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Formatos sugeridos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker
          value={validationResult?.date || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
          style={Platform.OS === 'ios' ? styles.datePicker : undefined}
          minimumDate={new Date(1900, 0, 1)}
          maximumDate={new Date(2100, 11, 31)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputValid: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  inputInvalid: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  validationTextValid: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '500',
  },
  validationTextInvalid: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  datePicker: {
    width: '100%',
  },
});

export default SmartDateInput; 