import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { parseDate, formatDate } from './dateUtils';
import SmartDateInput from '../components/SmartDateInput';
import SimpleDateInput from '../components/SimpleDateInput';

/**
 * Componente de prueba específico para fechas de vencimiento
 * Prueba la nueva lógica de interpretación de años de dos dígitos
 */
const ExpirationDateTest: React.FC = () => {
  const [testInput, setTestInput] = useState('09.25');
  const [parseResult, setParseResult] = useState<any>(null);
  const [smartDateInput, setSmartDateInput] = useState('09.25');
  const [simpleDateInput, setSimpleDateInput] = useState('09.25');

  const testCases = [
    { input: '09.25', description: 'Septiembre 2025' },
    { input: '12.24', description: 'Diciembre 2024' },
    { input: '01.30', description: 'Enero 2030' },
    { input: '06.99', description: 'Junio 2099' },
    { input: '03.00', description: 'Marzo 2000' },
    { input: '09/25', description: 'Septiembre 2025 (con /)' },
    { input: '12-24', description: 'Diciembre 2024 (con -)' },
  ];

  const testParsing = (input: string) => {
    const result = parseDate(input);
    setParseResult(result);
    console.log('Test parsing:', input, '->', result);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test Fechas de Vencimiento</Text>
      <Text style={styles.subtitle}>Nueva lógica: años 00-99 = 2000-2099</Text>
      
      {/* Test de parsing directo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test de Parsing Directo</Text>
        <Text style={styles.label}>Input: {testInput}</Text>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => testParsing(testInput)}
        >
          <Text style={styles.testButtonText}>Probar Parsing</Text>
        </TouchableOpacity>
        
        {parseResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Resultado:</Text>
            <Text style={styles.resultText}>
              Válido: {parseResult.isValid ? '✅ Sí' : '❌ No'}
            </Text>
            {parseResult.isValid && (
              <>
                <Text style={styles.resultText}>
                  Fecha: {parseResult.date?.toISOString().split('T')[0]}
                </Text>
                <Text style={styles.resultText}>
                  Formato: {parseResult.format}
                </Text>
                <Text style={styles.resultText}>
                  Año: {parseResult.date?.getFullYear()}
                </Text>
              </>
            )}
            {!parseResult.isValid && (
              <Text style={styles.errorText}>Error: {parseResult.error}</Text>
            )}
          </View>
        )}
      </View>

      {/* Casos de prueba predefinidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Casos de Prueba</Text>
        {testCases.map((testCase, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testCaseButton}
            onPress={() => {
              setTestInput(testCase.input);
              testParsing(testCase.input);
            }}
          >
            <Text style={styles.testCaseText}>
              {testCase.input} → {testCase.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test con SmartDateInput */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SmartDateInput Test</Text>
        <Text style={styles.label}>Valor actual: {smartDateInput}</Text>
        <SmartDateInput
          value={smartDateInput}
          onChangeText={setSmartDateInput}
          placeholder="MM.YY"
          label="Fecha (MM.YY)"
        />
        <Text style={styles.result}>Resultado: {smartDateInput}</Text>
      </View>

      {/* Test con SimpleDateInput */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SimpleDateInput Test</Text>
        <Text style={styles.label}>Valor actual: {simpleDateInput}</Text>
        <SimpleDateInput
          value={simpleDateInput}
          onChangeText={setSimpleDateInput}
          placeholder="MM.YY"
          label="Fecha (MM.YY)"
        />
        <Text style={styles.result}>Resultado: {simpleDateInput}</Text>
      </View>

      {/* Instrucciones */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instrucciones:</Text>
        <Text style={styles.instructionText}>1. Prueba los casos predefinidos</Text>
        <Text style={styles.instructionText}>2. Abre el DatePicker en los componentes</Text>
        <Text style={styles.instructionText}>3. Verifica que se inicialice en el año correcto</Text>
        <Text style={styles.instructionText}>4. 09.25 debe inicializar en septiembre 2025, no 1925</Text>
        <Text style={styles.instructionText}>5. Revisa la consola para logs detallados</Text>
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
    marginBottom: 8,
    textAlign: 'center',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
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
  testButton: {
    backgroundColor: '#0ea5e9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 4,
  },
  testCaseButton: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testCaseText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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

export default ExpirationDateTest;

/**
 * Instrucciones de uso:
 * 
 * 1. Importar en el componente principal:
 *    import ExpirationDateTest from '../utils/expirationDateTest';
 *    
 * 2. Reemplazar temporalmente el contenido del render:
 *    return <ExpirationDateTest />;
 *    
 * 3. Probar específicamente el caso 09.25
 *    
 * 4. Verificar que se inicializa en 2025, no 1925
 */ 