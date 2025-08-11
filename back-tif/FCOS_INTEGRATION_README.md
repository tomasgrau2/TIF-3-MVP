# Integración de FCOS en el Backend

Este documento explica cómo integrar el modelo FCOS (Fully Convolutional One-Stage Object Detection) para la detección de fechas de vencimiento en tu backend.

## 📋 Archivos Necesarios

### 1. Dependencias
Agregar al `requirements.txt`:
```txt
# Dependencias para FCOS/AdelaiDet
detectron2
fvcore
pycocotools
PyYAML
```

### 2. Archivos de FCOS
Necesitas estos archivos desde el directorio `FCOS/AdelaiDet/`:

#### Configuraciones:
- `configs/FCOS-Detection/Base-FCOS.yaml`
- `configs/FCOS-Detection/expiry_dates_R_50_1x.yaml`
- `configs/FCOS-Detection/R_50_1x.yaml`

#### Modelo Entrenado:
- `output/fcos/expiry_dates_R_50_1x/model_final.pth`

#### Código Fuente:
- `adet/config/__init__.py`
- `demo/predictor.py`
- `adet/modeling/fcos/fcos.py`
- Y todos los archivos relacionados en `adet/`

### 3. Archivos del Backend
- `fcos_service.py` - Servicio principal de FCOS
- `verify_fcos_setup.py` - Script de verificación
- `fcos_integration_example.py` - Ejemplo de integración

## 🚀 Instalación

### Paso 1: Instalar Dependencias
```bash
cd back-tif
pip install -r requirements.txt
```

### Paso 2: Verificar Configuración
```bash
python verify_fcos_setup.py
```

### Paso 3: Probar el Servicio
```bash
python fcos_service.py
```

## 🔧 Uso Básico

### Importar el Servicio
```python
from fcos_service import get_fcos_service, detect_dates_in_image

# Obtener instancia del servicio
service = get_fcos_service()

# Detectar fechas en una imagen base64
detections = detect_dates_in_image(image_base64)
```

### Detectar Fechas
```python
# Detectar todas las fechas en una imagen
detections = service.detect_dates_from_base64(image_base64)

# Obtener solo las detecciones de fechas
date_detections = service.get_date_detections(detections)

# Obtener la mejor detección
best_detection = service.get_best_date_detection(detections)
```

## 🔗 Integración con el Endpoint Existente

### Opción 1: Reemplazar Completamente
Modifica tu endpoint `/scan-expiration-date` en `main.py`:

```python
from fcos_service import detect_dates_in_image
from date_ocr_service import extract_date_from_image

@app.post("/scan-expiration-date")
async def scan_expiration_date(
    barcode: str = Body(..., embed=True), 
    image_base64: str = Body(..., embed=True),
    scan_rectangle: dict = Body(None, embed=True),
    screen_dimensions: dict = Body(None, embed=True),
    product_info: dict = Body(None, embed=True)
):
    try:
        # Usar FCOS para detectar regiones de fechas
        fcos_detections = detect_dates_in_image(image_base64)
        
        if not fcos_detections:
            # Fallback al método original
            return await original_scan_method(barcode, image_base64, scan_rectangle, screen_dimensions, product_info)
        
        # Procesar la mejor detección
        best_detection = max(fcos_detections, key=lambda x: x['confidence'])
        
        # Recortar y procesar con OCR
        # ... (código de procesamiento)
        
        return {
            "success": True,
            "expiration_date": extracted_date,
            "confidence": best_detection['confidence'],
            "method": "FCOS + OCR"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### Opción 2: Método Híbrido
Usa FCOS como complemento al método existente:

```python
@app.post("/scan-expiration-date")
async def scan_expiration_date(...):
    # Intentar primero con FCOS
    fcos_result = await try_fcos_detection(barcode, image_base64)
    
    if fcos_result and fcos_result['success']:
        return fcos_result
    
    # Si FCOS falla, usar método original
    return await original_scan_method(barcode, image_base64, scan_rectangle, screen_dimensions, product_info)
```

## 📊 Estructura de Respuesta

### Detección Exitosa
```json
{
    "success": true,
    "barcode": "7791293044507",
    "expiration_date": "2025-12-31",
    "confidence": 0.85,
    "method": "FCOS + OCR",
    "detections_count": 2,
    "all_detections": [
        {
            "detection_id": 1,
            "fcos_confidence": 0.92,
            "bbox": [100, 150, 300, 200],
            "ocr_result": {
                "date": "2025-12-31",
                "confidence": 0.88
            },
            "combined_confidence": 0.81
        }
    ],
    "best_detection": {
        "bbox": [100, 150, 300, 200],
        "fcos_confidence": 0.92,
        "ocr_confidence": 0.88,
        "combined_confidence": 0.81
    }
}
```

### Detección Fallida
```json
{
    "success": false,
    "barcode": "7791293044507",
    "method": "fallback",
    "error": "No se detectaron fechas con FCOS"
}
```

## ⚙️ Configuración Avanzada

### Ajustar Umbral de Confianza
```python
# En fcos_service.py
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.3  # Umbral más bajo = más detecciones
cfg.MODEL.FCOS.INFERENCE_TH_TEST = 0.3
```

### Usar Diferentes Modelos
```python
# Modelo base
service = FCOSDetectionService(
    model_path="path/to/model.pth",
    config_path="path/to/config.yaml"
)
```

### Optimizar Rendimiento
```python
# Reducir tamaño de imagen para mayor velocidad
cfg.INPUT.MIN_SIZE_TEST = 600  # En lugar de 800
cfg.INPUT.MAX_SIZE_TEST = 1000  # En lugar de 1333
```

## 🐛 Solución de Problemas

### Error: "Modelo no encontrado"
- Verifica que el archivo `model_final.pth` existe
- Asegúrate de que la ruta en `fcos_service.py` sea correcta

### Error: "Configuración no encontrada"
- Verifica que los archivos `.yaml` estén en el directorio correcto
- Asegúrate de que las rutas relativas sean correctas

### Error: "ImportError: No module named 'detectron2'"
- Instala detectron2: `pip install detectron2`
- En Windows, puede requerir compilación desde fuente

### Error: "CUDA out of memory"
- Reduce el tamaño de imagen en la configuración
- Usa CPU en lugar de GPU: `cfg.MODEL.DEVICE = "cpu"`

## 📈 Monitoreo y Logs

### Habilitar Logs Detallados
```python
import logging
logging.basicConfig(level=logging.INFO)

# En fcos_service.py
logger = logging.getLogger(__name__)
logger.info(f"Detectadas {len(detections)} regiones")
```

### Métricas de Rendimiento
```python
import time

start_time = time.time()
detections = service.detect_dates(image)
processing_time = time.time() - start_time

print(f"Tiempo de procesamiento: {processing_time:.3f}s")
print(f"Detecciones encontradas: {len(detections)}")
```

## 🔄 Actualización del Modelo

Para actualizar el modelo entrenado:

1. Reemplaza `model_final.pth` con el nuevo modelo
2. Actualiza la configuración si es necesario
3. Ejecuta `verify_fcos_setup.py` para verificar
4. Reinicia el servicio

## 📚 Recursos Adicionales

- [Documentación de AdelaiDet](https://github.com/aim-uofa/AdelaiDet)
- [Documentación de Detectron2](https://detectron2.readthedocs.io/)
- [Paper de FCOS](https://arxiv.org/abs/1904.01355)

## 🤝 Contribución

Para mejorar la integración:

1. Reporta bugs en el repositorio
2. Propón mejoras en el código
3. Comparte ejemplos de uso
4. Documenta casos especiales 