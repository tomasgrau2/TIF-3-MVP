import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SmartDateInput from '../components/SmartDateInput';
import SimpleDateInput from '../components/SimpleDateInput';

/**
 * Componente de prueba para verificar formatos de fecha
 * Prueba tanto SmartDateInput como SimpleDateInput
 */
const DateFormatTest: React.FC = () => {
  const [smartDateMM, setSmartDateMM] = useState('12/2024');
  const [smartDateDD, setSmartDateDD] = useState('25/12/2024');
  const [simpleDateMM, setSimpleDateMM] = useState('12/2024');
  const [simpleDateDD, setSimpleDateDD] = useState('25/12/2024');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test Formatos de Fecha</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SmartDateInput - Solo Mes/Año</Text>
        <Text style={styles.label}>Valor actual: {smartDateMM}</Text>
        <SmartDateInput
          value={smartDateMM}
          onChangeText={setSmartDateMM}
          placeholder="MM/YYYY"
          label="Fecha (MM/YYYY)"
        />
        <Text style={styles.result}>Resultado: {smartDateMM}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SmartDateInput - Día/Mes/Año</Text>
        <Text style={styles.label}>Valor actual: {smartDateDD}</Text>
        <SmartDateInput
          value={smartDateDD}
          onChangeText={setSmartDateDD}
          placeholder="DD/MM/YYYY"
          label="Fecha (DD/MM/YYYY)"
        />
        <Text style={styles.result}>Resultado: {smartDateDD}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SimpleDateInput - Solo Mes/Año</Text>
        <Text style={styles.label}>Valor actual: {simpleDateMM}</Text>
        <SimpleDateInput
          value={simpleDateMM}
          onChangeText={setSimpleDateMM}
          placeholder="MM/YYYY"
          label="Fecha (MM/YYYY)"
        />
        <Text style={styles.result}>Resultado: {simpleDateMM}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SimpleDateInput - Día/Mes/Año</Text>
        <Text style={styles.label}>Valor actual: {simpleDateDD}</Text>
        <SimpleDateInput
          value={simpleDateDD}
          onChangeText={setSimpleDateDD}
          placeholder="DD/MM/YYYY"
          label="Fecha (DD/MM/YYYY)"
        />
        <Text style={styles.result}>Resultado: {simpleDateDD}</Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instrucciones de Prueba:</Text>
        <Text style={styles.instructionText}>1. Abre el DatePicker en cada campo</Text>
        <Text style={styles.instructionText}>2. Selecciona una fecha específica</Text>
        <Text style={styles.instructionText}>3. Verifica que el formato se mantiene:</Text>
        <Text style={styles.instructionText}>   • MM/YYYY debe mantener solo mes/año</Text>
        <Text style={styles.instructionText}>   • DD/MM/YYYY debe mantener día/mes/año</Text>
        <Text style={styles.instructionText}>4. Revisa la consola para ver los logs</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e293b',
  },
  section: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#0f172a',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#64748b',
  },
  result: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    textAlign: 'center',
    color: '#0c4a6e',
  },
  instructions: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#92400e',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#92400e',
  },
});

export default DateFormatTest;

/**
 * Instrucciones de uso:
 * 
 * 1. Importar en el componente principal:
 *    import DateFormatTest from '../utils/dateFormatTest';
 *    
 * 2. Reemplazar temporalmente el contenido del render:
 *    return <DateFormatTest />;
 *    
 * 3. Probar ambos formatos en ambos componentes
 *    
 * 4. Verificar que los formatos se mantienen correctamente
 */ 