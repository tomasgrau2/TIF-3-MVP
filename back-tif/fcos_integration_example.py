#!/usr/bin/env python3
"""
Ejemplo de integración de FCOS en el endpoint de detección de fechas
"""

from fcos_service import get_fcos_service, detect_dates_in_image
from date_ocr_service import extract_date_from_image
import cv2
import numpy as np
import base64
from PIL import Image
import io

def enhanced_scan_expiration_date(barcode: str, image_base64: str, scan_rectangle: dict = None, screen_dimensions: dict = None, product_info: dict = None):
    """
    Versión mejorada del endpoint de detección de fechas que usa FCOS
    
    Args:
        barcode: Código de barras del producto
        image_base64: Imagen codificada en base64
        scan_rectangle: Rectángulo de escaneo (opcional)
        screen_dimensions: Dimensiones de la pantalla (opcional)
        product_info: Información del producto (opcional)
    
    Returns:
        Dict con información de la detección
    """
    
    try:
        print(f"🔍 Iniciando detección mejorada para barcode: {barcode}")
        
        # 1. Usar FCOS para detectar regiones de fechas
        print("📊 Detectando regiones de fechas con FCOS...")
        fcos_detections = detect_dates_in_image(image_base64)
        
        if not fcos_detections:
            print("⚠️  No se detectaron regiones de fechas con FCOS")
            # Fallback al método original
            return fallback_to_original_method(barcode, image_base64, scan_rectangle, screen_dimensions, product_info)
        
        print(f"✅ FCOS detectó {len(fcos_detections)} regiones de fechas")
        
        # 2. Procesar cada detección de FCOS
        best_detection = None
        best_confidence = 0
        all_results = []
        
        # Decodificar imagen para procesamiento
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        image_np = np.array(image)
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        for i, detection in enumerate(fcos_detections):
            print(f"🔍 Procesando detección #{i+1} (confianza: {detection['confidence']:.3f})")
            
            # Recortar la región detectada
            bbox = detection['bbox_int']
            cropped_image = image_np[bbox[1]:bbox[3], bbox[0]:bbox[2]]
            
            # Convertir a base64 para el OCR
            _, buffer = cv2.imencode('.jpg', cropped_image)
            cropped_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Usar OCR para extraer fecha
            ocr_result = extract_date_from_image(cropped_base64)
            
            result = {
                "detection_id": i + 1,
                "fcos_confidence": detection['confidence'],
                "bbox": detection['bbox'],
                "bbox_int": detection['bbox_int'],
                "ocr_result": ocr_result,
                "combined_confidence": detection['confidence'] * (ocr_result.get('confidence', 0.5) if ocr_result else 0.1)
            }
            
            all_results.append(result)
            
            # Actualizar mejor detección
            if result['combined_confidence'] > best_confidence:
                best_confidence = result['combined_confidence']
                best_detection = result
        
        # 3. Preparar respuesta
        if best_detection and best_detection['ocr_result']:
            return {
                "success": True,
                "barcode": barcode,
                "expiration_date": best_detection['ocr_result'].get('date'),
                "confidence": best_detection['combined_confidence'],
                "method": "FCOS + OCR",
                "detections_count": len(fcos_detections),
                "all_detections": all_results,
                "best_detection": {
                    "bbox": best_detection['bbox'],
                    "fcos_confidence": best_detection['fcos_confidence'],
                    "ocr_confidence": best_detection['ocr_result'].get('confidence', 0),
                    "combined_confidence": best_detection['combined_confidence']
                }
            }
        else:
            print("⚠️  No se pudo extraer fecha válida de las detecciones de FCOS")
            return fallback_to_original_method(barcode, image_base64, scan_rectangle, screen_dimensions, product_info)
            
    except Exception as e:
        print(f"❌ Error en detección mejorada: {e}")
        return fallback_to_original_method(barcode, image_base64, scan_rectangle, screen_dimensions, product_info)

def fallback_to_original_method(barcode: str, image_base64: str, scan_rectangle: dict = None, screen_dimensions: dict = None, product_info: dict = None):
    """
    Método de respaldo usando el enfoque original
    """
    print("🔄 Usando método de respaldo (original)")
    
    # Aquí iría tu lógica original de detección
    # Por ahora retornamos un resultado básico
    return {
        "success": False,
        "barcode": barcode,
        "method": "fallback",
        "error": "FCOS no disponible, usando método original"
    }

def test_fcos_integration():
    """
    Función de prueba para la integración
    """
    print("🧪 Probando integración de FCOS...")
    
    try:
        # Crear una imagen de prueba (puedes usar una imagen real)
        test_image = np.ones((480, 640, 3), dtype=np.uint8) * 255
        _, buffer = cv2.imencode('.jpg', test_image)
        test_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Probar la integración
        result = enhanced_scan_expiration_date("test_barcode", test_base64)
        
        print("✅ Integración probada exitosamente")
        print(f"Resultado: {result}")
        
    except Exception as e:
        print(f"❌ Error en prueba de integración: {e}")

if __name__ == "__main__":
    test_fcos_integration() 