import { Platform } from 'react-native';

// Función para obtener la IP local del dispositivo
export const getLocalIPAddress = async (): Promise<string | null> => {
  try {
    // En React Native, necesitamos usar una librería externa para obtener la IP
    // Por ahora, retornamos null y el usuario debe configurar manualmente
    return null;
  } catch (error) {
    console.error('Error obteniendo IP local:', error);
    return null;
  }
};

// Función para verificar si dos dispositivos están en la misma red
export const checkSameNetwork = (deviceIP: string, backendIP: string): boolean => {
  try {
    // Extraer los primeros 3 octetos de las IPs
    const deviceSubnet = deviceIP.split('.').slice(0, 3).join('.');
    const backendSubnet = backendIP.split('.').slice(0, 3).join('.');
    
    return deviceSubnet === backendSubnet;
  } catch (error) {
    console.error('Error verificando red:', error);
    return false;
  }
};

// Función para hacer ping al backend
export const pingBackend = async (url: string): Promise<{ success: boolean; latency: number; error?: string }> => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    if (response.ok) {
      return {
        success: true,
        latency,
      };
    } else {
      return {
        success: false,
        latency,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    return {
      success: false,
      latency,
      error: error?.message || 'Error de conexión',
    };
  }
};

// Función para diagnosticar problemas de red
export const diagnoseNetworkIssues = async (backendUrl: string): Promise<string[]> => {
  const issues: string[] = [];
  
  try {
    console.log('🔍 Iniciando diagnóstico de red...');
    
    // 1. Verificar que la URL sea válida
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      issues.push('❌ URL del backend inválida. Debe comenzar con http:// o https://');
    }
    
    // 2. Extraer IP del backend
    const urlParts = backendUrl.replace('http://', '').replace('https://', '').split(':');
    const backendIP = urlParts[0];
    
    if (!backendIP || backendIP === 'localhost') {
      issues.push('⚠️ El backend está configurado como localhost. En dispositivos físicos, usa la IP de red.');
    }
    
    // 3. Hacer ping al backend
    const pingResult = await pingBackend(backendUrl);
    
    if (!pingResult.success) {
      issues.push(`❌ No se puede conectar al backend: ${pingResult.error}`);
      issues.push('💡 Posibles soluciones:');
      issues.push('   - Verifica que el backend esté ejecutándose');
      issues.push('   - Verifica que la IP sea correcta');
      issues.push('   - Verifica que ambos dispositivos estén en la misma red WiFi');
      issues.push('   - Verifica que el firewall no esté bloqueando la conexión');
    } else {
      console.log(`✅ Ping exitoso: ${pingResult.latency}ms`);
    }
    
    // 4. Verificar plataforma
    if (Platform.OS === 'android') {
      issues.push('📱 Dispositivo Android detectado');
      if (backendIP === 'localhost') {
        issues.push('⚠️ En Android, localhost no funciona. Usa la IP de red del backend.');
      }
    } else if (Platform.OS === 'ios') {
      issues.push('📱 Dispositivo iOS detectado');
    }
    
  } catch (error: any) {
    issues.push(`❌ Error durante el diagnóstico: ${error?.message}`);
  }
  
  return issues;
};

// Función para obtener sugerencias de configuración
export const getConfigurationSuggestions = (): string[] => {
  const suggestions: string[] = [];
  
  suggestions.push('🔧 Sugerencias de configuración:');
  suggestions.push('');
  suggestions.push('1. **Para desarrollo con emulador Android:**');
  suggestions.push('   - Backend: http://10.0.2.2:8000');
  suggestions.push('');
  suggestions.push('2. **Para desarrollo con dispositivo físico:**');
  suggestions.push('   - Backend: http://[IP-DE-TU-PC]:8000');
  suggestions.push('   - Ejemplo: http://192.168.1.17:8000');
  suggestions.push('');
  suggestions.push('3. **Para desarrollo con Expo Go:**');
  suggestions.push('   - Backend: http://localhost:8000');
  suggestions.push('');
  suggestions.push('4. **Verificar IP de tu PC:**');
  suggestions.push('   - Windows: ipconfig');
  suggestions.push('   - Mac/Linux: ifconfig o ip addr');
  
  return suggestions;
};
