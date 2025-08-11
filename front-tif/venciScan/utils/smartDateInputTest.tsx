import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SmartDateInput from '../components/SmartDateInput';

/**
 * Componente de prueba para SmartDateInput
 * Para usar este test, importa y renderiza este componente temporalmente
 */
const SmartDateInputTest: React.FC = () => {
  const [testDate, setTestDate] = useState('12/2024');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test SmartDateInput</Text>
      
      <Text style={styles.label}>Fecha actual: {testDate}</Text>
      
      <SmartDateInput
        value={testDate}
        onChangeText={setTestDate}
        placeholder="MM/YYYY, MM.YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/YY, MM.YY, MM-YY"
        label="Fecha de vencimiento"
      />
      
      <Text style={styles.result}>
        Resultado: {testDate}
      </Text>
    </View>
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
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#374151',
  },
  result: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    textAlign: 'center',
  },
});

export default SmartDateInputTest;

/**
 * Instrucciones de uso:
 * 
 * 1. Importar en el componente principal:
 *    import SmartDateInputTest from '../utils/smartDateInputTest';
 *    
 * 2. Reemplazar temporalmente el contenido del render:
 *    return <SmartDateInputTest />;
 *    
 * 3. Probar el DatePicker y verificar que la fecha se actualiza correctamente
 *    
 * 4. Revisar la consola para ver los logs de debug
 */ 