import os
import sys
import cv2
import numpy as np
import torch
from typing import List, Dict, Tuple, Optional
import base64
from PIL import Image
import io

# Agregar el directorio de FCOS al path
FCOS_PATH = os.path.join(os.path.dirname(__file__), "..", "FCOS", "AdelaiDet")
sys.path.append(FCOS_PATH)

from adet.config import get_cfg
from demo.predictor import VisualizationDemo


class FCOSDetectionService:
    """Servicio para detección de fechas usando FCOS"""
    
    def __init__(self, model_path: str = None, config_path: str = None):
        """
        Inicializa el servicio de detección FCOS
        
        Args:
            model_path: Ruta al modelo entrenado (.pth)
            config_path: Ruta al archivo de configuración (.yaml)
        """
        self.model_path = model_path or os.path.join(FCOS_PATH, "output/fcos/expiry_dates_R_50_1x/model_final.pth")
        self.config_path = config_path or os.path.join(FCOS_PATH, "configs/FCOS-Detection/expiry_dates_R_50_1x.yaml")
        
        self.predictor = None
        self.class_names = ["due", "production", "code", "date"]
        
        # Verificar que los archivos existan
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Modelo no encontrado: {self.model_path}")
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Configuración no encontrada: {self.config_path}")
        
        self._load_model()
    
    def _load_model(self):
        """Carga el modelo FCOS"""
        try:
            # Configurar el modelo
            cfg = get_cfg()
            cfg.merge_from_file(self.config_path)
            cfg.MODEL.WEIGHTS = self.model_path
            cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.3  # Umbral de confianza
            cfg.MODEL.FCOS.INFERENCE_TH_TEST = 0.3
            cfg.freeze()
            
            # Crear predictor
            self.predictor = VisualizationDemo(cfg)
            print(f"✅ Modelo FCOS cargado exitosamente desde: {self.model_path}")
            
        except Exception as e:
            print(f"❌ Error al cargar el modelo FCOS: {e}")
            raise
    
    def detect_dates(self, image: np.ndarray) -> List[Dict]:
        """
        Detecta fechas en una imagen
        
        Args:
            image: Imagen como array numpy (BGR format)
            
        Returns:
            Lista de detecciones con información de bounding boxes y clases
        """
        if self.predictor is None:
            raise RuntimeError("Modelo no cargado. Llama a _load_model() primero.")
        
        try:
            # Ejecutar predicción
            predictions, _ = self.predictor.run_on_image(image)
            
            # Obtener instancias
            instances = predictions["instances"].to("cpu")
            
            detections = []
            
            if len(instances) > 0:
                classes = instances.pred_classes.numpy()
                scores = instances.scores.numpy()
                boxes = instances.pred_boxes.tensor.numpy()
                
                for i in range(len(instances)):
                    detection = {
                        "class_id": int(classes[i]),
                        "class_name": self.class_names[classes[i]] if classes[i] < len(self.class_names) else f"class_{classes[i]}",
                        "confidence": float(scores[i]),
                        "bbox": boxes[i].tolist(),  # [x1, y1, x2, y2]
                        "bbox_int": boxes[i].astype(int).tolist()
                    }
                    detections.append(detection)
                
                # Ordenar por confianza (mayor a menor)
                detections.sort(key=lambda x: x["confidence"], reverse=True)
            
            return detections
            
        except Exception as e:
            print(f"❌ Error en detección: {e}")
            return []
    
    def detect_dates_from_base64(self, image_base64: str) -> List[Dict]:
        """
        Detecta fechas en una imagen codificada en base64
        
        Args:
            image_base64: Imagen codificada en base64
            
        Returns:
            Lista de detecciones
        """
        try:
            # Decodificar imagen base64
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Convertir a numpy array (BGR para OpenCV)
            image_np = np.array(image)
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                # Convertir RGB a BGR
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            
            return self.detect_dates(image_np)
            
        except Exception as e:
            print(f"❌ Error al procesar imagen base64: {e}")
            return []
    
    def crop_detection(self, image: np.ndarray, bbox: List[float]) -> np.ndarray:
        """
        Recorta una detección de la imagen
        
        Args:
            image: Imagen original
            bbox: Bounding box [x1, y1, x2, y2]
            
        Returns:
            Imagen recortada
        """
        x1, y1, x2, y2 = [int(coord) for coord in bbox]
        return image[y1:y2, x1:x2]
    
    def get_date_detections(self, detections: List[Dict]) -> List[Dict]:
        """
        Filtra solo las detecciones de fechas (clase "date")
        
        Args:
            detections: Lista de todas las detecciones
            
        Returns:
            Lista de detecciones de fechas
        """
        return [det for det in detections if det["class_name"] == "date"]
    
    def get_best_date_detection(self, detections: List[Dict]) -> Optional[Dict]:
        """
        Obtiene la mejor detección de fecha (mayor confianza)
        
        Args:
            detections: Lista de detecciones
            
        Returns:
            Mejor detección de fecha o None
        """
        date_detections = self.get_date_detections(detections)
        if date_detections:
            return max(date_detections, key=lambda x: x["confidence"])
        return None


# Instancia global del servicio
fcos_service = None

def get_fcos_service() -> FCOSDetectionService:
    """Obtiene la instancia global del servicio FCOS"""
    global fcos_service
    if fcos_service is None:
        fcos_service = FCOSDetectionService()
    return fcos_service


def detect_dates_in_image(image_base64: str) -> List[Dict]:
    """
    Función de conveniencia para detectar fechas en una imagen
    
    Args:
        image_base64: Imagen codificada en base64
        
    Returns:
        Lista de detecciones de fechas
    """
    service = get_fcos_service()
    detections = service.detect_dates_from_base64(image_base64)
    return service.get_date_detections(detections)


if __name__ == "__main__":
    # Test del servicio
    print("🧪 Probando servicio FCOS...")
    
    try:
        service = FCOSDetectionService()
        print("✅ Servicio FCOS inicializado correctamente")
        
        # Aquí podrías agregar pruebas con imágenes reales
        
    except Exception as e:
        print(f"❌ Error al inicializar servicio FCOS: {e}") 