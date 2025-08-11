import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, Dimensions, Animated, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import SmartDateInput from '../components/SmartDateInput';
import SimpleDateInput from '../components/SimpleDateInput';
import { parseDate, formatDate } from '../utils/dateUtils';
import { BACKEND_URL, testBackendConnectivity } from '../config/backend';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const REC_FRAME_WIDTH = 160;
const REC_FRAME_HEIGHT = 80;

const HEADER_HEIGHT = 56; // Alto fijo del header (ajustar si es necesario)

const ScanExpirationPage: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Verificando conexión...');
  
  // Debug: Log cuando cambia expirationDate
  useEffect(() => {
    console.log('expirationDate changed to:', expirationDate);
  }, [expirationDate]);
  const [quantity, setQuantity] = useState<string>('1');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const barcode = params.barcode as string;
  const productInfoParam = params.productInfo as string;
  const productInfo = productInfoParam ? JSON.parse(productInfoParam) : null;
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [cameraPreviewSize, setCameraPreviewSize] = useState({ width: screenWidth, height: screenHeight });

  // Animaciones
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // DEBUG: Log para verificar navegación y parámetros
  useEffect(() => {
    console.log('DEBUG: ScanExpirationPage montado. barcode:', barcode, 'productInfo:', productInfo, 'params:', params);
  }, [barcode, productInfo]);

  // Verificar conectividad al montar el componente
  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      setConnectionStatus('Probando conexión...');
      
      const result = await testBackendConnectivity();
      
      if (result.success) {
        console.log('✅ Conexión exitosa al backend');
        setConnectionStatus('Conectado al backend');
      } else {
        console.log('⚠️ Error de conexión:', result.message);
        setConnectionStatus(result.message);
      }
    } catch (error: any) {
      console.error('❌ Error de conexión al backend:', error);
      setConnectionStatus(`Error: ${error?.message || 'Conexión fallida'}`);
    }
  };

  useEffect(() => {
    // Animación de escaneo
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    // Animación de pulso
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  if (!permission) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Se necesita permiso para usar la cámara.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Toca aquí para conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;
    
    // Feedback táctil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      });
      const { width: imgW, height: imgH } = photo;
      // Usar el tamaño real del preview de la cámara
      const previewW = cameraPreviewSize.width;
      const previewH = cameraPreviewSize.height;
      const scaleX = imgW / previewW;
      const scaleY = imgH / previewH;
      const scale = Math.min(scaleX, scaleY);
      // Ajustes manuales para alinear el recorte con el recuadro azul
      // Aumenta verticalOffset para bajar el recorte
      // Disminuye (más negativo) horizontalOffset para moverlo a la izquierda
      const verticalOffset = 80;    // <-- Ajusta este valor según tu prueba
      const horizontalOffset = -20; // <-- Ajusta este valor según tu prueba
      const cropRect = {
        originX: ((previewW - REC_FRAME_WIDTH) / 2 + horizontalOffset) * scaleX,
        originY: ((previewH - REC_FRAME_HEIGHT) / 2 + verticalOffset) * scaleY,
        width: (REC_FRAME_WIDTH * scale) + 150,
        height: (REC_FRAME_HEIGHT * scale) + 80,
      };
      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: cropRect }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      // Procesar la imagen directamente sin mostrar previsualización
      await processImageWithDAN(cropped.base64 || null);
    } catch (error) {
      console.error('Error al tomar o recortar foto:', error);
      Alert.alert('Error', 'No se pudo tomar o recortar la foto');
    } finally {
      setLoading(false);
    }
  };

  const processImageWithDAN = async (base64Image: string | null) => {
    if (!base64Image || !barcode) return;
    
    // Feedback táctil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setProcessing(true);
    try {
      // Enviar al backend para procesamiento con DAN
      const response = await fetch(`${BACKEND_URL}/scan-expiration-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: barcode,
          image_base64: base64Image,
          // No enviar scan_rectangle ni screen_dimensions, ya que solo mandamos el recorte
          product_info: productInfo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setOcrResult(result);
        
        // Inicializar campos con los valores detectados
        if (result.success && result.predicted_date) {
          console.log('Setting predicted date:', result.predicted_date);
          setExpirationDate(result.predicted_date);
        } else {
          console.log('No predicted date, setting empty');
          setExpirationDate('');
        }
        setQuantity('1'); // Cantidad por defecto
        
        setShowResultModal(true);
        
        // Feedback de éxito
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Error procesando la imagen');
        
        // Feedback de error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error procesando imagen:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
      
      // Feedback de error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRetake = () => {
    setOcrResult(null);
    setShowResultModal(false);
  };

  const handleConfirm = async () => {
    if (!ocrResult || !barcode) {
      setShowResultModal(false);
      router.back();
      return;
    }

    // Validar que se haya ingresado una fecha
    if (!expirationDate.trim()) {
      Alert.alert('Error', 'Por favor ingresa una fecha de vencimiento');
      return;
    }

    // Normalizar la fecha de vencimiento a YYYY-MM-DD si es válida
    const normalizedExpirationDate = (() => {
      const parsed = parseDate(expirationDate.trim());
      if (parsed.isValid && parsed.date) {
        return formatDate(parsed.date, 'YYYY-MM-DD');
      }
      return expirationDate.trim();
    })();

    // Validar que la cantidad sea un número válido
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida (mínimo 1)');
      return;
    }

    try {
      // Guardar el producto en la base de datos
      const response = await fetch(`${BACKEND_URL}/confirm-and-save-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: barcode,
          expiration_date: normalizedExpirationDate,
          quantity: quantityNum,
          product_info: productInfo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Producto guardado:', result.message);
        
        // Feedback de éxito
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Mostrar mensaje de éxito
        Alert.alert(
          'Éxito', 
          result.message || 'Producto guardado correctamente',
          [{ text: 'OK', onPress: () => {
            setShowResultModal(false);
            router.back();
          }}]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Error guardando el producto');
        
        // Feedback de error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      Alert.alert('Error de conexión', 'No se pudo guardar el producto');
      
      // Feedback de error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Componente para el overlay con recuadro guía
  const CameraOverlay = () => (
    <View style={[styles.overlay, { marginTop: 0 }]} pointerEvents="none">
      {/* Overlay superior */}
      <View style={[styles.overlayRow, { height: (cameraPreviewSize.height - REC_FRAME_HEIGHT) / 2 }]} />

      {/* Overlay central: izquierda, recuadro transparente, derecha */}
      <View style={styles.centerRow}>
        <View style={[styles.overlayCol, { width: (cameraPreviewSize.width - REC_FRAME_WIDTH) / 2 }]} />
        <View style={styles.transparentFrame}>
          {/* Esquinas del recuadro */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={[styles.overlayCol, { width: (cameraPreviewSize.width - REC_FRAME_WIDTH) / 2 }]} />
      </View>

      {/* Overlay inferior */}
      <View style={[styles.overlayRow, { height: (cameraPreviewSize.height - REC_FRAME_HEIGHT) / 2 + 24 }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header responsive y por encima de la cámara y overlay */}
      <View
        style={[styles.header, { paddingTop: insets.top + 12, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#1e293b' }]}
        onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
         
        </TouchableOpacity>
        <Text style={[styles.title, { marginLeft: 28 }]}>Escanear Vencimiento</Text>
      </View>

      {/* Cámara y overlay debajo del header */}
      <View
        style={[styles.cameraContainer, { marginTop: headerHeight }]}
        onLayout={e => setCameraPreviewSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        <CameraOverlay />
      </View>
      {/* Controles e instrucciones debajo de la cámara */}
      <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 20 }]}> 
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Coloca la fecha de vencimiento dentro del recuadro
          </Text>
          <Text style={styles.barcodeText}>
            Código: {barcode}
          </Text>
          <Text style={[styles.connectionStatus, { color: connectionStatus.includes('Error') ? '#ef4444' : connectionStatus.includes('Conectado') ? '#10b981' : '#f59e0b' }]}>
            {connectionStatus}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.captureButton, (loading || processing) && styles.captureButtonDisabled]}
          onPress={handleTakePicture}
          disabled={loading || processing}
        >
          {(loading || processing) ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.captureButtonText}>Escanear vencimiento</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de resultados */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resultado del Análisis</Text>
            
            {ocrResult && (
              <View style={styles.modalResultInfo}>
                {/* Información del producto */}
                <View style={styles.productInfoSection}>
                  <Text style={styles.sectionTitle}>Información del Producto</Text>
                  
                  <View style={styles.productField}>
                    <Text style={styles.fieldLabel}>Nombre:</Text>
                    <Text style={styles.fieldValue}>
                      {productInfo?.productName || 'No disponible'}
                    </Text>
                  </View>
                  
                  <View style={styles.productField}>
                    <Text style={styles.fieldLabel}>Laboratorio:</Text>
                    <Text style={styles.fieldValue}>
                      {productInfo?.lab || 'No disponible'}
                    </Text>
                  </View>
                  
                  <View style={styles.productField}>
                    <Text style={styles.fieldLabel}>Código:</Text>
                    <Text style={styles.fieldValue}>
                      {barcode}
                    </Text>
                  </View>
                </View>

                {/* Información del análisis */}
                <View style={styles.analysisSection}>
                  <Text style={styles.sectionTitle}>Resultado del Análisis</Text>
                  
                  <View style={styles.analysisField}>
                    <Text style={styles.fieldLabel}>Confianza:</Text>
                    <Text style={styles.fieldValue}>
                      {(ocrResult.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={styles.analysisField}>
                    <Text style={styles.fieldLabel}>Estado:</Text>
                    <Text style={[styles.fieldValue, { color: ocrResult.success ? '#10b981' : '#ef4444' }]}>
                      {ocrResult.success ? 'Exitoso' : 'Fallido'}
                    </Text>
                  </View>
                </View>

                {/* Campos editables */}
                <View style={styles.editableSection}>
                  <Text style={styles.sectionTitle}>Datos a Guardar</Text>
                  
                  {/* Campo editable para fecha de vencimiento */}
                  <View style={styles.inputContainer}>
                    <SimpleDateInput
                      value={expirationDate}
                      onChangeText={(text) => {
                        console.log('SimpleDateInput onChangeText:', text);
                        setExpirationDate(text);
                      }}
                      placeholder="MM/YYYY, DD/MM/YYYY, etc."
                      label="Fecha de vencimiento"
                    />
                    {ocrResult.predicted_date && (
                      <Text style={styles.detectedText}>
                        Detectada: {ocrResult.predicted_date}
                      </Text>
                    )}
                  </View>

                  {/* Campo editable para cantidad */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Cantidad:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="1"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirm}
              >
                <Text style={styles.modalButtonText}>✅ Confirmar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.retakeModalButton]} 
                onPress={handleRetake}
              >
                <Text style={styles.modalButtonText}>🔄 Volver a Intentar</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(14,165,233,0.08)',
    marginRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayRow: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  centerRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCol: {
    height: REC_FRAME_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  transparentFrame: {
    width: REC_FRAME_WIDTH,
    height: REC_FRAME_HEIGHT,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#0ea5e9',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanText: {
    color: '#0ea5e9',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bottomOverlay: {
    height: undefined,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    paddingBottom: 20,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  barcodeText: {
    color: '#0ea5e9',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  captureButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#64748b',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  modalResultInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalResultText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  retakeModalButton: {
    backgroundColor: '#64748b',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  helpTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helpText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  smartDateInputContainer: {
    marginBottom: 0,
  },
  inputLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  detectedText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
  },
  productInfoSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  analysisSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  editableSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  productField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 2,
    textAlign: 'right',
  },
  connectionStatus: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ScanExpirationPage; 