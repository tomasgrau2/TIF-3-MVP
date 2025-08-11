import os
import sys
import torch
import numpy as np
from PIL import Image
import cv2
import base64
import io
from typing import Optional, Tuple, Dict, Any
import json

# Agregar el directorio DAN al path (ahora está en back-tif/DAN)
sys.path.append(os.path.join(os.path.dirname(__file__), 'DAN'))

from DAN import Feature_Extractor, CAM_transposed, DTD
from utils import cha_encdec

class DateOCRService:
    def __init__(self, model_path_prefix: str = None):
        """
        Servicio de OCR para fechas usando el modelo DAN
        
        Args:
            model_path_prefix: Ruta base a los modelos entrenados (opcional)
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Determinar rutas automáticamente basándose en el directorio actual
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        if model_path_prefix is None:
            # Buscar modelos en diferentes ubicaciones posibles
            possible_paths = [
                os.path.join(current_dir, "models", "dates", "exp1_E1_I2000-2560"),
                os.path.join(current_dir, "..", "models", "dates", "exp1_E1_I2000-2560"),
                os.path.join(current_dir, "..", "..", "models", "dates", "exp1_E1_I2000-2560")
            ]
            
            for path in possible_paths:
                if os.path.exists(f"{path}_M0.pth"):
                    self.model_path_prefix = path
                    break
            else:
                raise FileNotFoundError(f"No se encontraron modelos DAN en ninguna de las rutas: {possible_paths}")
        else:
            self.model_path_prefix = model_path_prefix
        
        self.models = None
        self.encdec = None
        
        # Buscar diccionario en diferentes ubicaciones
        dict_paths = [
            os.path.join(current_dir, "DAN", "dict", "dic_79.txt"),
            os.path.join(current_dir, "..", "DAN", "dict", "dic_79.txt"),
            os.path.join(current_dir, "..", "..", "DAN", "dict", "dic_79.txt")
        ]
        
        for path in dict_paths:
            if os.path.exists(path):
                self.dict_path = path
                break
        else:
            raise FileNotFoundError(f"No se encontró el diccionario en ninguna de las rutas: {dict_paths}")
        
        # Configuración del modelo
        self.img_height = 192
        self.img_width = 2048
        
        print(f"🚀 Inicializando DateOCRService en dispositivo: {self.device}")
        print(f"📁 Cargando modelos desde: {self.model_path_prefix}")
        print(f"📚 Diccionario encontrado en: {self.dict_path}")
        self._load_models()
    
    def _load_models(self):
        """Cargar los modelos DAN entrenados"""
        try:
            # Configuración de la red
            fe_args = {
                'strides': [(2,2), (2,2), (2,1), (2,2), (2,2), (2,1)],
                'compress_layer': True, 
                'input_shape': [1, self.img_height, self.img_width],
            }
            
            model_fe = Feature_Extractor(**fe_args)
            cam_args = {
                'maxT': 150,
                'depth': 14, 
                'num_channels': 128,
                'scales': model_fe.Iwantshapes(),
            }
            model_cam = CAM_transposed(**cam_args)
            dtd_args = {
                'nclass': 80,
                'nchannel': 256,
                'dropout': 0.7,
            }
            model_dtd = DTD(**dtd_args)
            
            # Cargar pesos entrenados
            model_fe.load_state_dict(torch.load(f"{self.model_path_prefix}_M0.pth", map_location=self.device))
            model_cam.load_state_dict(torch.load(f"{self.model_path_prefix}_M1.pth", map_location=self.device))
            model_dtd.load_state_dict(torch.load(f"{self.model_path_prefix}_M2.pth", map_location=self.device))
            
            # Mover modelos al dispositivo
            model_fe = model_fe.to(self.device)
            model_cam = model_cam.to(self.device)
            model_dtd = model_dtd.to(self.device)
            
            # Poner en modo evaluación
            model_fe.eval()
            model_cam.eval()
            model_dtd.eval()
            
            self.models = (model_fe, model_cam, model_dtd)
            
            # Inicializar codificador/decodificador
            self.encdec = cha_encdec(self.dict_path, case_sensitive=True)
            
            print("✅ Modelos DAN cargados correctamente")
            
        except Exception as e:
            print(f"❌ Error cargando modelos: {e}")
            raise
    
    def crop_image_to_scan_rectangle(self, image: Image.Image, scan_rect: Dict[str, Any], screen_dimensions: Dict[str, int]) -> Image.Image:
        """
        Recortar imagen según las coordenadas del recuadro de escaneo
        
        Args:
            image: Imagen PIL original
            scan_rect: Diccionario con {x, y, width, height} del recuadro en pantalla
            screen_dimensions: Diccionario con {width, height} de la pantalla
            
        Returns:
            Imagen recortada
        """
        try:
            # Obtener dimensiones de la imagen y pantalla
            img_width, img_height = image.size
            screen_width = screen_dimensions.get('width', 1080)  # Default
            screen_height = screen_dimensions.get('height', 1920)  # Default
            
            # Calcular factor de escala entre pantalla e imagen
            scale_x = img_width / screen_width
            scale_y = img_height / screen_height
            
            # Convertir coordenadas de pantalla a coordenadas de imagen
            crop_x = int(scan_rect['x'] * scale_x)
            crop_y = int(scan_rect['y'] * scale_y)
            crop_width = int(scan_rect['width'] * scale_x)
            crop_height = int(scan_rect['height'] * scale_y)
            
            # Asegurar que las coordenadas estén dentro de los límites de la imagen
            crop_x = max(0, min(crop_x, img_width - 1))
            crop_y = max(0, min(crop_y, img_height - 1))
            crop_width = min(crop_width, img_width - crop_x)
            crop_height = min(crop_height, img_height - crop_y)
            
            print(f"🔍 Recortando imagen: pantalla({screen_width}x{screen_height}) -> imagen({img_width}x{img_height})")
            print(f"📐 Recuadro: ({crop_x}, {crop_y}, {crop_width}, {crop_height})")
            
            # Recortar la imagen
            cropped_image = image.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
            
            return cropped_image
            
        except Exception as e:
            print(f"❌ Error recortando imagen: {e}")
            # Si hay error, devolver la imagen original
            return image
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocesar imagen para el modelo DAN
        
        Args:
            image: Imagen PIL
            
        Returns:
            Tensor preprocesado
        """
        # Convertir a escala de grises
        if image.mode != 'L':
            image = image.convert('L')
        
        # Redimensionar
        image = image.resize((self.img_width, self.img_height), Image.Resampling.LANCZOS)
        
        # Convertir a tensor y normalizar
        img_array = np.array(image)
        img_tensor = torch.from_numpy(img_array).float() / 255.0
        img_tensor = img_tensor.unsqueeze(0).unsqueeze(0)  # [1, 1, H, W]
        
        return img_tensor.to(self.device)
    
    def predict_date(self, image: Image.Image) -> Tuple[str, float]:
        """
        Predecir fecha de vencimiento desde una imagen
        
        Args:
            image: Imagen PIL con la fecha
            
        Returns:
            Tuple con (fecha_predicha, confianza)
        """
        if self.models is None:
            raise RuntimeError("Modelos no cargados")
        
        try:
            # Preprocesar imagen
            input_tensor = self.preprocess_image(image)
            
            with torch.no_grad():
                # Forward pass
                features = self.models[0](input_tensor)
                attention_maps = self.models[1](features)
                
                # Preparar target dummy para inferencia
                batch_size = 1
                max_length = attention_maps.size(1)
                dummy_target = torch.zeros(batch_size, max_length).long().to(self.device)
                dummy_length = torch.ones(batch_size).int().to(self.device) * max_length
                
                # Predicción
                output, output_length = self.models[2](
                    features[-1], attention_maps, dummy_target, dummy_length, test=True
                )
                
                # Decodificar resultado
                decoded_texts, decoded_probs = self.encdec.decode(output, output_length)
                
                predicted_date = decoded_texts[0] if decoded_texts else ""
                confidence = float(decoded_probs[0]) if decoded_probs else 0.0
                
                return predicted_date, confidence
                
        except Exception as e:
            print(f"❌ Error en predicción: {e}")
            return "", 0.0
    
    def process_base64_image(self, base64_string: str, scan_rect: Optional[Dict[str, Any]] = None, 
                           screen_dimensions: Optional[Dict[str, int]] = None) -> Tuple[str, float]:
        """
        Procesar imagen en formato base64 con opción de recorte
        
        Args:
            base64_string: Imagen codificada en base64
            scan_rect: Coordenadas del recuadro de escaneo (opcional)
            screen_dimensions: Dimensiones de la pantalla (opcional)
            
        Returns:
            Tuple con (fecha_predicha, confianza)
        """
        try:
            # Decodificar base64
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            
            # Recortar imagen si se proporcionan coordenadas
            if scan_rect and screen_dimensions:
                image = self.crop_image_to_scan_rectangle(image, scan_rect, screen_dimensions)
            
            return self.predict_date(image)
            
        except Exception as e:
            print(f"❌ Error procesando imagen base64: {e}")
            return "", 0.0

# Instancia global del servicio
date_ocr_service = None

def get_date_ocr_service() -> DateOCRService:
    """Obtener instancia global del servicio de OCR"""
    global date_ocr_service
    if date_ocr_service is None:
        date_ocr_service = DateOCRService()
    return date_ocr_service 