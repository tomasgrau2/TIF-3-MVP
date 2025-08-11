// Configuración del backend según el entorno
export const BACKEND_CONFIG = {
  // URLs del backend según el entorno
  development: {
    // Para desarrollo local con emulador
    localhost: 'http://10.0.2.2:8000', // Android emulator
    // Para desarrollo con dispositivo físico en la misma red
    network: 'http://192.168.1.17:8000', // Tu IP actual
    // Para desarrollo con Expo Go
    expo: 'http://localhost:8000',
  },
  production: {
    // URL de producción (cuando se haga build)
    url: 'https://tu-backend-produccion.com',
  }
};

// Función para obtener la URL correcta según el entorno
export const getBackendUrl = (): string => {
  if (__DEV__) {
    // En desarrollo, intentar diferentes URLs
    const platform = require('react-native').Platform.OS;
    
    if (platform === 'android') {
      // En Android, usar la IP de red para dispositivos físicos
      return BACKEND_CONFIG.development.network;
    } else {
      // En iOS o web, usar localhost
      return BACKEND_CONFIG.development.expo;
    }
  } else {
    // En producción
    return BACKEND_CONFIG.production.url;
  }
};

// URL del backend
export const BACKEND_URL = getBackendUrl();

// Función para probar conectividad
export const testBackendConnectivity = async (): Promise<{ success: boolean; message: string; url: string }> => {
  const testUrl = `${BACKEND_URL}/health`;
  
  try {
    console.log('🔍 Probando conexión a:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
    });
    
    if (response.ok) {
      return {
        success: true,
        message: 'Conexión exitosa',
        url: BACKEND_URL
      };
    } else {
      return {
        success: false,
        message: `Backend responde pero con error: ${response.status}`,
        url: BACKEND_URL
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error de conexión: ${error?.message || 'Desconocido'}`,
      url: BACKEND_URL
    };
  }
};
