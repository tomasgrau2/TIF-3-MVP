import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface SimpleDateInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
}

const SimpleDateInput: React.FC<SimpleDateInputProps> = ({
  value,
  onChangeText,
  placeholder = "MM/YYYY",
  label,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    console.log('SimpleDateInput - DatePicker event:', event.type, 'selectedDate:', selectedDate);
    setShowDatePicker(false);
    
    if (selectedDate && event.type !== 'dismissed') {
      let targetFormat = 'DD/MM/YYYY'; // Por defecto, ahora SIEMPRE día/mes/año

      // Si el valor actual tiene formato con día, respétalo
      if (value) {
        if (value.includes('/') && value.split('/').length === 3) {
          targetFormat = 'DD/MM/YYYY';
        } else if (value.includes('.') && value.split('.').length === 3) {
          targetFormat = 'DD.MM.YYYY';
        } else if (value.includes('-') && value.split('-').length === 3) {
          targetFormat = 'YYYY-MM-DD';
        } else if (
          // Si el valor actual tiene solo mes/año, pero el día seleccionado es 1, usar solo mes/año
          (value.includes('/') && value.split('/').length === 2) ||
          (value.includes('.') && value.split('.').length === 2) ||
          (value.includes('-') && value.split('-').length === 2)
        ) {
          // Si el usuario selecciona el primer día del mes, puedes mantener MM/YYYY
          if (selectedDate.getDate() === 1) {
            if (value.includes('/')) targetFormat = 'MM/YYYY';
            if (value.includes('.')) targetFormat = 'MM.YYYY';
            if (value.includes('-')) targetFormat = 'MM-YYYY';
          }
        }
      }

      // Si el campo está vacío, usar siempre DD/MM/YYYY
      if (!value) {
        targetFormat = 'DD/MM/YYYY';
      }

      let formattedDate: string;
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const day = String(selectedDate.getDate()).padStart(2, '0');

      switch (targetFormat) {
        case 'DD/MM/YYYY':
          formattedDate = `${day}/${month}/${year}`;
          break;
        case 'DD.MM.YYYY':
          formattedDate = `${day}.${month}.${year}`;
          break;
        case 'YYYY-MM-DD':
          formattedDate = `${year}-${month}-${day}`;
          break;
        case 'MM.YYYY':
          formattedDate = `${month}.${year}`;
          break;
        case 'MM-YYYY':
          formattedDate = `${month}-${year}`;
          break;
        default:
          formattedDate = `${month}/${year}`;
      }

      console.log('SimpleDateInput - Formatted date:', formattedDate, 'using format:', targetFormat);
      onChangeText(formattedDate);
    }
  };

  const getCurrentDate = () => {
    if (value) {
      // Intentar parsear diferentes formatos
      let parts: string[] = [];
      
      if (value.includes('/')) {
        parts = value.split('/');
      } else if (value.includes('.')) {
        parts = value.split('.');
      } else if (value.includes('-')) {
        parts = value.split('-');
      }
      
      if (parts.length === 2) {
        // Formato MM/YYYY, MM.YYYY, MM-YYYY, MM/YY, MM.YY, MM-YY
        const month = parseInt(parts[0]) - 1;
        const yearStr = parts[1];
        
        if (!isNaN(month) && month >= 0 && month <= 11) {
          // Si el año tiene 2 dígitos, interpretar como 2000-2099
          if (yearStr.length === 2) {
            const year = parseInt(yearStr);
            const fullYear = 2000 + year;
            return new Date(fullYear, month, 1);
          } else if (yearStr.length === 4) {
            // Si el año tiene 4 dígitos, usar directamente
            const year = parseInt(yearStr);
            if (!isNaN(year)) {
              return new Date(year, month, 1);
            }
          }
        }
      } else if (parts.length === 3) {
        // Formato DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD
        let day: number, month: number, year: number;
        
        if (value.includes('-') && parts[0].length === 4) {
          // Formato YYYY-MM-DD
          year = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          day = parseInt(parts[2]);
        } else {
          // Formato DD/MM/YYYY o DD.MM.YYYY
          day = parseInt(parts[0]);
          month = parseInt(parts[1]) - 1;
          year = parseInt(parts[2]);
        }
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    return new Date();
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
        />
        
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => {
            console.log('SimpleDateInput - Opening DatePicker');
            setShowDatePicker(true);
          }}
        >
          <Ionicons name="calendar" size={20} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={getCurrentDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
          style={Platform.OS === 'ios' ? styles.datePicker : undefined}
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
  calendarButton: {
    padding: 12,
    marginRight: 8,
  },
  datePicker: {
    width: '100%',
  },
});

export default SimpleDateInput; 