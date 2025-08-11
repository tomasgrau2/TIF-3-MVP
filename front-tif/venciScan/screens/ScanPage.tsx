import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

// Configuración del backend - cambiar según el entorno
const BACKEND_URL = __DEV__ 
  ? 'http://192.168.1.17:8000'  // Para desarrollo con Expo Go en celular
  : 'http://localhost:8000';     // Para desarrollo local

const ScanPage: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.resultText}>Se necesita permiso para usar la cámara.</Text>
        <Text style={[styles.resultText, { color: '#0ea5e9', textDecorationLine: 'underline' }]} onPress={requestPermission}>
          Toca aquí para conceder permiso
        </Text>
      </View>
    );
  }

  const sendBarcodeToBackend = async (barcodeData: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/get-product-by-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode: barcodeData }),
      });

      if (response.ok) {
        const data = await response.json();
        setProductData(data);
        setShowModal(true);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'No se pudo obtener información del producto', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      console.error('Error al enviar código de barras:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = (result: any) => {
    if (scanned) return;
    if (result.data && result.type === 'ean13') {
      setScanned(true);
      setBarcode(result.data);
      sendBarcodeToBackend(result.data);
    }
  };

  const handleScanExpiration = () => {
    setShowModal(false);
    
    // Navegar a la página de escaneo de vencimiento con el código de barras y la información del producto
    router.push({
      pathname: '/scan-expiration',
      params: { 
        barcode: productData?.codebar || barcode,
        productInfo: JSON.stringify(productData)
      }
    });
  };

  const handleRescan = () => {
    setShowModal(false);
    setScanned(false);
    setProductData(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13'],
        }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View style={styles.resultContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.resultText}>Consultando producto...</Text>
          </View>
        ) : (
          <Text style={styles.resultText}>
            {barcode ? `Último código escaneado: ${barcode}` : 'Escanear código de barras'}
          </Text>
        )}
        {productData && !showModal && (
          <View style={styles.productInfo}>
            <Text style={styles.productText}>Producto: {productData.productName}</Text>
            <Text style={styles.productText}>Lab: {productData.lab}</Text>
            <Text style={styles.productText}>Precio: ${productData.price}</Text>
          </View>
        )}
      </View>

      {/* Modal de producto encontrado */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Producto Encontrado</Text>
            
            {productData && (
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductText}>Nombre: {productData.productName}</Text>
                <Text style={styles.modalProductText}>Laboratorio: {productData.lab}</Text>
                <Text style={styles.modalProductText}>Código: {productData.codebar}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.scanExpirationButton]} 
                onPress={handleScanExpiration}
              >
                <Text style={styles.modalButtonText}>Escanear Vencimiento</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.rescanButton]} 
                onPress={handleRescan}
              >
                <Text style={styles.modalButtonText}>Volver a Escanear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    minWidth: 300,
  },
  resultText: {
    fontSize: 20,
    color: '#1e293b',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  productInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    width: '100%',
  },
  productText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProductInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalProductText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 4,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanExpirationButton: {
    backgroundColor: '#0ea5e9',
  },
  rescanButton: {
    backgroundColor: '#64748b',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  expirationWarning: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

export default ScanPage; 