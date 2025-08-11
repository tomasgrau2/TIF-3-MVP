# main.py

import io
import re
from typing import List, Optional, Dict
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware # Para permitir peticiones del frontend
from product import ProductData
import os
from dotenv import load_dotenv
from database import products_collection, init_db, find_one_async, insert_one_async, update_one_async, find_async, count_documents_async, delete_one_async
from pymongo.results import DeleteResult, UpdateResult, InsertOneResult
from datetime import datetime, timezone
import base64
from PIL import Image

load_dotenv()
BEARER = os.getenv('BEARER')

# Variable global para el servicio OCR
ocr_service = None

# Variable global para el predictor FCOS
fcos_predictor = None

# Configuración de rutas FCOS
FCOS_MODEL_PATH = "FCOS/output/fcos/expiry_dates_R_50_1x/model_final.pth"
FCOS_CONFIG_PATH = "FCOS/configs/FCOS-Detection/expiry_dates_R_50_1x.yaml"

def parse_expiration_date(date_string: str) -> datetime:
    """
    Parsear fecha de vencimiento en diferentes formatos
    
    Args:
        date_string: String con la fecha en formato MM/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
        
    Returns:
        datetime object
    """
    if not date_string or not date_string.strip():
        raise ValueError("Fecha vacía")
    
    date_string = date_string.strip()
    
    # Patrón para MM/YYYY (ej: 09/2027)
    mm_yyyy_pattern = r'^(\d{1,2})/(\d{4})$'
    match = re.match(mm_yyyy_pattern, date_string)
    if match:
        month, year = match.groups()
        # Para MM/YYYY, asumimos que es el primer día del mes
        return datetime(int(year), int(month), 1, tzinfo=timezone.utc)
    
    # Patrón para MM.YYYY (ej: 09.2027)
    mm_yyyy_dot_pattern = r'^(\d{1,2})\.(\d{4})$'
    match = re.match(mm_yyyy_dot_pattern, date_string)
    if match:
        month, year = match.groups()
        # Para MM.YYYY, asumimos que es el primer día del mes
        return datetime(int(year), int(month), 1, tzinfo=timezone.utc)
    
    # Patrón para DD/MM/YYYY (ej: 15/09/2027)
    dd_mm_yyyy_pattern = r'^(\d{1,2})/(\d{1,2})/(\d{4})$'
    match = re.match(dd_mm_yyyy_pattern, date_string)
    if match:
        day, month, year = match.groups()
        return datetime(int(year), int(month), int(day), tzinfo=timezone.utc)
    
    # Patrón para DD.MM.YYYY (ej: 15.09.2027)
    dd_mm_yyyy_dot_pattern = r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$'
    match = re.match(dd_mm_yyyy_dot_pattern, date_string)
    if match:
        day, month, year = match.groups()
        return datetime(int(year), int(month), int(day), tzinfo=timezone.utc)
    
    # Patrón para YYYY-MM-DD (ej: 2027-09-15)
    yyyy_mm_dd_pattern = r'^(\d{4})-(\d{1,2})-(\d{1,2})$'
    match = re.match(yyyy_mm_dd_pattern, date_string)
    if match:
        year, month, day = match.groups()
        return datetime(int(year), int(month), int(day), tzinfo=timezone.utc)
    
    # Patrón para YYYY.MM.DD (ej: 2027.09.15)
    yyyy_mm_dd_dot_pattern = r'^(\d{4})\.(\d{1,2})\.(\d{1,2})$'
    match = re.match(yyyy_mm_dd_dot_pattern, date_string)
    if match:
        year, month, day = match.groups()
        return datetime(int(year), int(month), int(day), tzinfo=timezone.utc)
    
    # Patrón para DD-MM-YYYY (ej: 15-09-2027)
    dd_mm_yyyy_dash_pattern = r'^(\d{1,2})-(\d{1,2})-(\d{4})$'
    match = re.match(dd_mm_yyyy_dash_pattern, date_string)
    if match:
        day, month, year = match.groups()
        return datetime(int(year), int(month), int(day), tzinfo=timezone.utc)
    
    # Si no coincide con ningún patrón, intentar parsear con datetime.fromisoformat
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except ValueError:
        raise ValueError(f"No se pudo parsear la fecha: {date_string}")

# --- Funciones FCOS ---
def get_adet_cfg(config_path: str, model_path: str):
    """Configurar AdelaiDet para FCOS"""
    try:
        import sys
        from pathlib import Path
        
        # Agregar el directorio FCOS al path para importar adet
        fcos_dir = Path(__file__).parent / "FCOS"
        sys.path.append(str(fcos_dir))
        
        from adet.config import get_cfg as get_adet_cfg
        cfg = get_adet_cfg()
        cfg.merge_from_file(config_path)
        cfg.MODEL.WEIGHTS = model_path
        cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.3
        cfg.DATASETS.TEST = ("expiry_dates_val",)
        cfg.freeze()
        return cfg
    except Exception as e:
        print(f"❌ Error configurando AdelaiDet: {e}")
        raise

def initialize_fcos_service():
    """Inicializar el servicio FCOS para inferencia"""
    global fcos_predictor
    
    print("[FCOS] Inicializando servicio FCOS...")
    
    # Verificar archivos
    if not os.path.exists(FCOS_MODEL_PATH):
        print(f"[FCOS] Modelo no encontrado: {FCOS_MODEL_PATH}")
        return False
    if not os.path.exists(FCOS_CONFIG_PATH):
        print(f"[FCOS] Configuración no encontrada: {FCOS_CONFIG_PATH}")
        return False
    
    try:
        # Configurar modelo directamente
        print("[FCOS] Configurando modelo...")
        cfg = get_adet_cfg(FCOS_CONFIG_PATH, FCOS_MODEL_PATH)
        
        from detectron2.engine import DefaultPredictor
        fcos_predictor = DefaultPredictor(cfg)
        
        print("[FCOS] Modelo cargado exitosamente")
        print(f"[FCOS] Modelo: {FCOS_MODEL_PATH}")
        print(f"[FCOS] Configuración: {FCOS_CONFIG_PATH}")
        return True
        
    except Exception as e:
        print(f"[FCOS] Error inicializando: {e}")
        return False

def detect_expiry_dates_with_fcos(image_base64: str) -> dict:
    """
    Detectar fechas de vencimiento usando FCOS
    
    Args:
        image_base64: Imagen en formato base64
        
    Returns:
        Resultado de la detección FCOS
    """
    global fcos_predictor
    
    if fcos_predictor is None:
        return {"success": False, "message": "Servicio FCOS no disponible"}
    
    try:
        import cv2
        import numpy as np
        from datetime import datetime
        
        # Decodificar imagen
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {"success": False, "message": "No se pudo decodificar la imagen"}
        
        # Realizar predicción
        outputs = fcos_predictor(image)
        instances = outputs["instances"].to("cpu")
        
        if len(instances) == 0:
            return {"success": False, "message": "No se detectaron regiones de fecha"}
        
        # Extraer información de las detecciones
        boxes = instances.pred_boxes.tensor.numpy()
        classes = instances.pred_classes.numpy()
        scores = instances.scores.numpy()
        
        class_names = ["due", "production", "code", "date"]
        detections = []
        
        # Crear directorio para crops si no existe
        crops_dir = "FCOS/fcos_crops"
        os.makedirs(crops_dir, exist_ok=True)
        
        # Procesar cada detección
        for i, (box, cls, score) in enumerate(zip(boxes, classes, scores)):
            x1, y1, x2, y2 = map(int, box)
            
            # Validar coordenadas
            if x1 >= x2 or y1 >= y2:
                continue
            
            # Agregar margen de 5 píxeles
            margin = 5
            x1_margin = max(0, x1 - margin)
            y1_margin = max(0, y1 - margin)
            x2_margin = min(image.shape[1], x2 + margin)
            y2_margin = min(image.shape[0], y2 + margin)
            
            # Recortar región con margen
            crop = image[y1_margin:y2_margin, x1_margin:x2_margin]
            
            if crop.size == 0:
                continue
            
            # Convertir crop a base64
            _, buffer = cv2.imencode('.jpg', crop)
            crop_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Guardar crop como archivo
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            class_name = class_names[cls] if cls < len(class_names) else f"class_{cls}"
            crop_filename = f"{crops_dir}/crop_{i:03d}_{class_name}_score_{score:.2f}_{timestamp}.jpg"
            cv2.imwrite(crop_filename, crop)
            
            # Crear resultado de detección
            detection = {
                "class_name": class_name,
                "confidence": float(score),
                "bbox": [x1_margin, y1_margin, x2_margin, y2_margin],
                "crop_base64": crop_base64,
                "crop_filename": crop_filename
            }
            
            detections.append(detection)
        
        # Ordenar por confianza (mayor a menor)
        detections.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Encontrar la mejor detección de fecha
        best_due_date = None
        for detection in detections:
            if detection["class_name"] == "date":
                best_due_date = detection
                break
        
        # Si no hay "date", buscar "due" como fallback
        if not best_due_date:
            for detection in detections:
                if detection["class_name"] == "due":
                    best_due_date = detection
                    break
        
        return {
            "success": True,
            "message": f"Detectadas {len(detections)} regiones",
            "best_due_date": best_due_date,
            "all_detections": detections,
            "image_info": {
                "width": image.shape[1],
                "height": image.shape[0],
                "channels": image.shape[2] if len(image.shape) > 2 else 1
            },
            "processing_time": 0.0  # Se puede calcular si es necesario
        }
        
    except Exception as e:
        print(f"[FCOS] Error en detección: {e}")
        return {"success": False, "message": f"Error en detección FCOS: {str(e)}"}

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager para inicializar y limpiar recursos"""
    global ocr_service, fcos_predictor
    
    print("[STARTUP] Iniciando servicio de API...")
    
    # Inicializar base de datos
    print("[STARTUP] Inicializando base de datos...")
    init_db()
    print("[STARTUP] Base de datos inicializada")
    
    # Cargar modelos DAN
    print("[STARTUP] Cargando modelos DAN...")
    try:
        from date_ocr_service import DateOCRService
        ocr_service = DateOCRService()
        print("[STARTUP] Modelos DAN cargados exitosamente")
    except Exception as e:
        print(f"[STARTUP] Error cargando modelos DAN: {e}")
        print("[STARTUP] El servicio continuará sin modelos DAN")
        ocr_service = None
    
    # Inicializar servicio FCOS
    print("[STARTUP] Inicializando servicio FCOS...")
    fcos_loaded = initialize_fcos_service()
    if fcos_loaded:
        print("[STARTUP] Servicio FCOS inicializado exitosamente")
    else:
        print("[STARTUP] El servicio continuará sin FCOS")
    
    yield
    
    # Cleanup (opcional)
    print("[SHUTDOWN] Cerrando servicio de API...")

# --- Configuración ---
app = FastAPI(title="API de Extracción de Fechas de Caducidad", lifespan=lifespan)

# Configurar CORS (mantener según tus necesidades), sirve para autorizar origenes
origins = [
    "http://localhost",
    "http://localhost:8081",
    "*", # Temporalmente para desarrollo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Patrones Regex para Fechas (mantener) ---
DATE_PATTERNS = [
    r'\b\d{2}\s+(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{4}\b',  # DD MMM YYYY
    r'\b(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{4}\b',          # MMM YYYY
    r'\b\d{4}\s+(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{2}\b',  # YYYY MMM DD
    r'\b(?:V:|V\.|VEN[CD]\.|VTO\.?|VENCIMIENTO|BEST BEFORE:?|BB:?)\s*\d{2}[/.-]\d{4}\b',  # V: MM/YYYY o BEST BEFORE: MM.YYYY
    r'\b(?:V:|V\.|VEN[CD]\.|VTO\.?|VENCIMIENTO|BEST BEFORE:?|BB:?)\s*\d{2}[/.-]\d{2}[/.-]\d{2,4}\b', # V: DD/MM/YYYY
    r'\b\d{2}\.\d{2}\.\d{4}\b',     # DD.MM.YYYY
    r'\b\d{4}\.\d{2}\.\d{2}\b',     # YYYY.MM.DD
    r'\b\d{2}\.\d{2}\.\d{2}\b',     # DD.MM.YY
    r'\b\d{2}[/-]\d{2}[/-]\d{4}\b',  # DD/MM/YYYY o DD-MM-YYYY
    r'\b\d{4}[/-]\d{2}[/-]\d{2}\b',  # YYYY/MM/DD o YYYY-MM-DD
    r'\b\d{2}[/-]\d{2}[/-]\d{2}\b',  # DD/MM/YY o DD-MM-YY
    r'\b\d{2}\.\d{4}\b',            # MM.YYYY
    r'\b\d{2}/\d{4}\b',             # MM/YYYY
    r'\b\d{2}-\d{4}\b',             # MM-YYYY
    r'\b\d{2}\.\d{2}\b',
    r'\b\d{2}\s+\d{2}\s+\d{4}\b',   # DD MM YYYY
    r'\b\d{4}\s+\d{2}\s+\d{2}\b',   # YYYY MM DD
    r'\b\d{2}\s+\d{2}\s+\d{2}\b',   # DD MM YY
    r'\b\d{2}/(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/\d{4}\b',  # DD/MMM/YYYY
    r'\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[.\s-]+\d{2}[,\s-]+\d{2,4}\b',  # MMM DD YYYY / MMM-DD-YYYY etc.
    r'\b(?:EXP|EXPIRY|EXP\.|CAD|CAD\.|VENC|VENC\.)\s*:?\d{2}[/.-]\d{2}[/.-]\d{2,4}\b',  # EXP: DD/MM/YY o DD.MM.YYYY
    r'\b(?:EXP|EXPIRY|EXP\.|CAD|CAD\.|VENC|VENC\.)\s*:?\d{2}[/.-]\d{4}\b', # EXP: MM/YYYY
    r'\b(?:EXP|EXPIRY|EXP\.|CAD|CAD\.|VENC|VENC\.)\s*:?(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[.\s-]+\d{2,4}\b', # EXP: MMM YYYY
    r'\b(?:EXP|EXPIRY|EXP\.|CAD|CAD\.|VENC|VENC\.)\s*:?\d{2}\s+(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{2,4}\b', # EXP DD MMM YYYY
]

def build_url(barcode: str) -> str:
    """Función para traer la información de un producto por su código de barras"""
    return f"https://apib2b.delsud.com.ar/api/search/v3/materiales?descripcion={barcode}&propertyName=descripcion"

def fetch_product(url: str, bearer_token: str):
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Accept': 'application/json'
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.json()  # Devuelve como dict (más útil)
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None
    
def parse_product_response(data: dict) -> Optional[ProductData]:
    try:
        # Asegurarse de que hay al menos un producto
        if data.get("result") and isinstance(data["result"], list):
            item = data["result"][0]
            return ProductData(
                codebar=item.get("codebar", ""),
                productName=item.get("productName", "").strip(),
                lab=item.get("lab", "").strip(),
                price=item.get("price", 0.0),
                matnr=item.get("matnr", ""),
                expirationDate=None  # La fecha de vencimiento se agregará después del escaneo
            )
    except Exception as e:
        print(f"Error al parsear: {e}")
    
    return None

async def save_product_to_db(product: ProductData) -> dict:
    """Save product to MongoDB database - always creates a new entry"""
    product_dict = product.model_dump()
    product_dict["created_at"] = datetime.now(timezone.utc)
    
    # Always insert as a new product entry
    # The logic for checking duplicates is handled in confirm_and_save_product
    result = await insert_one_async(products_collection, product_dict)
    product_dict["_id"] = str(result.inserted_id)
    return {"message": "Product saved successfully", "product": product_dict}

async def get_product_from_db(barcode: str) -> Optional[dict]:
    """Get product from MongoDB database by barcode"""
    product: Optional[dict] = await find_one_async(products_collection, {"codebar": barcode})
    if product:
        product["_id"] = str(product["_id"])  # Convert ObjectId to string
        return product
    return None

@app.get("/")
async def root():
    """Endpoint raíz con información del estado del servicio"""
    global ocr_service, fcos_predictor
    
    status = {
        "message": "API de Extracción de Fechas de Caducidad funcionando",
        "endpoints": {
            "get_product_by_barcode": "/get-product-by-barcode",
            "scan_expiration_date": "/scan-expiration-date",
            "detect_expiry_fcos": "/detect-expiry-fcos",
            "confirm_and_save_product": "/confirm-and-save-product"
        },
        "services": {
            "database": "Conectado",
            "ocr_service": "Disponible" if ocr_service is not None else "No disponible",
            "fcos_service": "Disponible" if fcos_predictor is not None else "No disponible"
        }
    }
    
    return status

@app.get("/health")
async def health_check():
    """Endpoint para verificar el estado de salud del servicio"""
    global ocr_service, fcos_predictor
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "ok",
            "ocr_service": "ok" if ocr_service is not None else "error",
            "fcos_service": "ok" if fcos_predictor is not None else "error"
        }
    }

@app.post("/get-product-by-barcode")
async def get_product_by_barcode_endpoint(barcode: str = Body(..., embed=True)):
    """
    Endpoint to get product information from barcode (sent from frontend)
    First checks database, then external API if not found
    Returns product info without saving to database
    """
    print(f"[API] Barcode recibido: {barcode}")
    
    # First, check if product exists in database
    db_product = await get_product_from_db(barcode)
    if db_product:
        print(f"[API] Producto encontrado en base de datos: {db_product['productName']}")
        return db_product
    
    # If not in database, fetch from external API
    if not BEARER:
        raise HTTPException(status_code=500, detail="Token BEARER no configurado en el backend.")
    
    print(f"[API] Producto no encontrado en DB, consultando API externa...")
    url = build_url(barcode)
    product_data = fetch_product(url, BEARER)
    
    if not product_data:
        raise HTTPException(status_code=404, detail="Product not found in database or external API")

    # Parse product data
    product = parse_product_response(product_data)
    if not product:
        raise HTTPException(status_code=500, detail="Error parsing product data")
    
    # Return product info without saving to database
    # The product will be saved later when scanning expiration date
    print(f"[API] Producto obtenido de API externa: {product.productName}")
    
    return product

@app.get("/products")
async def get_all_products():
    """Get all products from database, grouped by barcode and expiration date"""
    products = []
    products_list = await find_async(products_collection)
    
    # Ordenar por código de barras y luego por fecha de vencimiento
    sorted_products = sorted(products_list, key=lambda x: (x.get("codebar", ""), x.get("expirationDate", datetime.max)))
    
    for product in sorted_products:
        product["_id"] = str(product["_id"])  # Convert ObjectId to string
        products.append(product)
    
    return products

@app.get("/products/{barcode}")
async def get_product_by_barcode(barcode: str):
    """Get all entries for a product by barcode from database"""
    products = []
    products_list = await find_async(products_collection, {"codebar": barcode})
    
    if not products_list:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Ordenar por fecha de vencimiento
    sorted_products = sorted(products_list, key=lambda x: x.get("expirationDate", datetime.max))
    
    for product in sorted_products:
        product["_id"] = str(product["_id"])  # Convert ObjectId to string
        products.append(product)
    
    return products

@app.delete("/products/{barcode}")
async def delete_product(barcode: str, expiration_date: str = None):
    """Delete product entry from database"""
    if expiration_date:
        # Eliminar entrada específica por fecha
        try:
            parsed_date = parse_expiration_date(expiration_date)
            result = await delete_one_async(products_collection, {"codebar": barcode, "expirationDate": parsed_date})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Product entry not found")
            return {"message": f"Product entry with expiration date {expiration_date} deleted successfully"}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid expiration date format: {expiration_date}")
    else:
        # Eliminar todas las entradas del producto
        result = await delete_one_async(products_collection, {"codebar": barcode})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "All product entries deleted successfully"}

@app.put("/products/{barcode}/expiration")
async def update_product_expiration(barcode: str, body: Dict = Body(...)):
    """
    Update product expiration date (busca por barcode y old_expiration_date)
    """
    old_expiration_date = body.get("old_expiration_date")
    new_expiration_date = body.get("new_expiration_date")
    if not old_expiration_date or not new_expiration_date:
        raise HTTPException(status_code=400, detail="Se requieren old_expiration_date y new_expiration_date")
    try:
        # Parsear ambas fechas
        old_date = parse_expiration_date(old_expiration_date)
        new_date = parse_expiration_date(new_expiration_date)
        # Buscar producto específico
        product = await find_one_async(products_collection, {"codebar": barcode, "expirationDate": old_date})
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado con esa fecha de vencimiento")
        # Actualizar solo esa entrada
        result = await update_one_async(
            products_collection,
            {"codebar": barcode, "expirationDate": old_date},
            {"$set": {"expirationDate": new_date, "updated_at": datetime.now(timezone.utc)}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="No se pudo actualizar el producto")
        # Obtener el producto actualizado
        updated_product = await find_one_async(products_collection, {"codebar": barcode, "expirationDate": new_date})
        if updated_product:
            updated_product["_id"] = str(updated_product["_id"])
        return {"message": "Fecha de vencimiento actualizada exitosamente", "product": updated_product}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Formato de fecha inválido: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando fecha de vencimiento: {str(e)}")

@app.put("/products/{barcode}/quantity")
async def update_product_quantity(barcode: str, quantity: int = Body(..., embed=True)):
    """
    Update product quantity
    """
    try:
        # Validate quantity
        if quantity < 0:
            raise HTTPException(status_code=400, detail="Quantity cannot be negative")
        
        # Update the product in database
        result = await update_one_async(
            products_collection,
            {"codebar": barcode},
            {"$set": {
                "quantity": quantity,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get updated product
        updated_product = await get_product_from_db(barcode)
        return {"message": "Quantity updated successfully", "product": updated_product}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating quantity: {str(e)}")

@app.put("/products/{barcode}/increment")
async def increment_product_quantity(barcode: str, amount: int = Body(..., embed=True), expiration_date: str = Body(None, embed=True)):
    """
    Increment product quantity by specified amount (para una entrada específica si se da expiration_date)
    """
    try:
        query = {"codebar": barcode}
        if expiration_date:
            try:
                parsed_date = parse_expiration_date(expiration_date)
                query["expirationDate"] = parsed_date
            except Exception:
                raise HTTPException(status_code=400, detail=f"Formato de fecha inválido: {expiration_date}")
        result = await update_one_async(
            products_collection,
            query,
            {"$inc": {"quantity": amount}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        updated_product = await find_one_async(products_collection, query)
        if updated_product:
            updated_product["_id"] = str(updated_product["_id"])
        return {"message": "Quantity incremented successfully", "product": updated_product}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error incrementing quantity: {str(e)}")

@app.put("/products/{barcode}/decrement")
async def decrement_product_quantity(barcode: str, amount: int = Body(..., embed=True), expiration_date: str = Body(None, embed=True)):
    """
    Decrement product quantity by specified amount (para una entrada específica si se da expiration_date)
    """
    try:
        query = {"codebar": barcode}
        if expiration_date:
            try:
                parsed_date = parse_expiration_date(expiration_date)
                query["expirationDate"] = parsed_date
            except Exception:
                raise HTTPException(status_code=400, detail=f"Formato de fecha inválido: {expiration_date}")
        current_product = await find_one_async(products_collection, query)
        if not current_product:
            raise HTTPException(status_code=404, detail="Product not found")
        current_quantity = current_product.get("quantity", 0)
        new_quantity = max(0, current_quantity - amount)
        result = await update_one_async(
            products_collection,
            query,
            {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc)}}
        )
        updated_product = await find_one_async(products_collection, query)
        if updated_product:
            updated_product["_id"] = str(updated_product["_id"])
        return {"message": "Quantity decremented successfully", "product": updated_product}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decrementing quantity: {str(e)}")

@app.post("/products")
async def create_product(product: dict = Body(...)):
    """
    Crear un producto manualmente desde el frontend
    """
    try:
        # Validar que el código de barras no exista
        existing = await find_one_async(products_collection, {"codebar": product.get("codebar")})
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un producto con ese código de barras")
        # Convertir expirationDate a datetime UTC si viene como string
        if "expirationDate" in product and isinstance(product["expirationDate"], str):
            try:
                product["expirationDate"] = datetime.fromisoformat(product["expirationDate"])
                if product["expirationDate"].tzinfo is None:
                    product["expirationDate"] = product["expirationDate"].replace(tzinfo=timezone.utc)
                else:
                    product["expirationDate"] = product["expirationDate"].astimezone(timezone.utc)
            except Exception:
                # Si falla, intenta con tu función de parseo
                product["expirationDate"] = parse_expiration_date(product["expirationDate"])
        product["created_at"] = datetime.now(timezone.utc)
        result = await insert_one_async(products_collection, product)
        product["_id"] = str(result.inserted_id)
        return {"message": "Producto creado exitosamente", "product": product}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear producto: {str(e)}")

@app.post("/scan-expiration-date")
async def scan_expiration_date(
    barcode: str = Body(..., embed=True), 
    image_base64: str = Body(..., embed=True),
    use_fcos_detection: bool = Body(True, embed=True),  # Nuevo parámetro
    scan_rectangle: dict = Body(None, embed=True),
    screen_dimensions: dict = Body(None, embed=True),
    product_info: dict = Body(None, embed=True)
):
    """
    Escanear fecha de vencimiento usando FCOS + DAN
    
    Args:
        barcode: Código de barras del producto
        image_base64: Imagen en formato base64
        use_fcos_detection: Si True, usa FCOS para detectar región automáticamente
        scan_rectangle: Coordenadas del recuadro de escaneo (solo si use_fcos_detection=False)
        screen_dimensions: Dimensiones de la pantalla (solo si use_fcos_detection=False)
        product_info: Información del producto obtenida previamente (opcional)
        
    Returns:
        Fecha predicha y nivel de confianza
    """
    print(f"[SCAN] Iniciando escaneo de fecha para barcode: {barcode}")
    print(f"[SCAN] Usando detección automática: {use_fcos_detection}")
    
    try:
        global ocr_service
        
        # Verificar que el servicio OCR esté disponible
        if ocr_service is None:
            raise HTTPException(
                status_code=503, 
                detail="Servicio OCR no disponible. Los modelos DAN no se pudieron cargar al inicio del servicio."
            )
        
        # Crear directorio para guardar imágenes si no existe
        images_dir = "debug_images"
        if not os.path.exists(images_dir):
            os.makedirs(images_dir)
        
        # Generar nombre único para la imagen
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{images_dir}/barcode_{barcode}_{timestamp}.jpg"
        cropped_filename = None
        fcos_result = None
        
        # Decodificar y guardar la imagen original
        try:
            image_data = base64.b64decode(image_base64)
            with open(filename, "wb") as f:
                f.write(image_data)
            print(f"[SCAN] Imagen original guardada: {filename}")
            
        except Exception as save_error:
            print(f"[SCAN] Error guardando imagen: {save_error}")
        
        # Paso 1: Detectar región con FCOS (si está habilitado)
        if use_fcos_detection:
            print("[SCAN] Paso 1: Detectando región con FCOS...")
            try:
                fcos_result = detect_expiry_dates_with_fcos(image_base64)
                if fcos_result and fcos_result.get("success") and fcos_result.get("best_due_date"):
                    best_detection = fcos_result["best_due_date"]
                    print(f"[SCAN] FCOS detectó fecha de vencimiento con confianza: {best_detection['confidence']:.3f}")
                    
                    # Usar el crop de FCOS para DAN
                    crop_base64 = best_detection["crop_base64"]
                    cropped_filename = best_detection["crop_filename"]
                    
                    # Paso 2: Procesar crop con DAN
                    print("[SCAN] Paso 2: Extrayendo texto con DAN...")
                    predicted_date, confidence = ocr_service.process_base64_image(
                        crop_base64, 
                        None,  # No usar scan_rectangle con FCOS
                        None   # No usar screen_dimensions con FCOS
                    )
                    
                else:
                    print("[SCAN] FCOS no detectó fecha de vencimiento, usando método manual")
                    # Fallback al método manual
                    predicted_date, confidence = ocr_service.process_base64_image(
                        image_base64, 
                        scan_rectangle, 
                        screen_dimensions
                    )
                    
            except Exception as fcos_error:
                print(f"[SCAN] Error con FCOS: {fcos_error}, usando método manual")
                # Fallback al método manual
                predicted_date, confidence = ocr_service.process_base64_image(
                    image_base64, 
                    scan_rectangle, 
                    screen_dimensions
                )
        
        else:
            # Método manual (comportamiento original)
            print("[SCAN] Usando método manual con coordenadas proporcionadas")
            
            # Si se proporcionan coordenadas de recorte, guardar también la imagen recortada
            if scan_rectangle and screen_dimensions:
                # Crear imagen PIL
                image = Image.open(io.BytesIO(image_data))
                
                # Usar el servicio OCR global para recortar
                cropped_image = ocr_service.crop_image_to_scan_rectangle(image, scan_rectangle, screen_dimensions)
                
                # Guardar imagen recortada
                cropped_filename = f"{images_dir}/barcode_{barcode}_{timestamp}_cropped.jpg"
                cropped_image.save(cropped_filename)
                print(f"[SCAN] Imagen recortada guardada: {cropped_filename}")
            
            # Procesar la imagen (con recorte si se proporcionan coordenadas)
            predicted_date, confidence = ocr_service.process_base64_image(
                image_base64, 
                scan_rectangle, 
                screen_dimensions
            )
        
        # Validar que se obtuvo una fecha
        if not predicted_date or confidence < 0.1:
            return {
                "predicted_date": "",
                "confidence": 0.0,
                "success": False,
                "message": "No se pudo detectar una fecha válida en la imagen",
                "debug_info": {
                    "image_saved": filename if 'filename' in locals() else None,
                    "cropped_image": cropped_filename,
                    "barcode": barcode,
                    "timestamp": timestamp,
                    "scan_rectangle": scan_rectangle,
                    "screen_dimensions": screen_dimensions,
                    "fcos_used": use_fcos_detection,
                    "fcos_result": fcos_result
                }
            }
        
        # NO guardar automáticamente el producto aquí
        # El producto se guardará cuando el usuario confirme en el frontend
        print(f"[SCAN] Escaneo completado - fecha detectada: {predicted_date} (confianza: {confidence:.2f})")
        
        # Preparar información de FCOS para la respuesta
        fcos_info = None
        if fcos_result and fcos_result.get("success"):
            fcos_info = {
                "used": True,
                "best_detection_confidence": fcos_result.get("best_due_date", {}).get("confidence", 0),
                "total_detections": len(fcos_result.get("all_detections", [])),
                "processing_time": fcos_result.get("processing_time", 0),
                "crop_filename": fcos_result.get("best_due_date", {}).get("crop_filename")
            }
        else:
            fcos_info = {
                "used": use_fcos_detection,
                "best_detection_confidence": 0,
                "total_detections": 0,
                "processing_time": 0,
                "crop_filename": None
            }
        
        return {
            "predicted_date": predicted_date,
            "confidence": confidence,
            "success": True,
            "message": "Fecha detectada correctamente",
            "fcos_info": fcos_info,
            "debug_info": {
                "image_saved": filename if 'filename' in locals() else None,
                "cropped_image": cropped_filename,
                "barcode": barcode,
                "timestamp": timestamp,
                "scan_rectangle": scan_rectangle,
                "screen_dimensions": screen_dimensions,
                "fcos_used": use_fcos_detection,
                "fcos_result": fcos_result
            }
        }
        
    except Exception as e:
        print(f"[SCAN] Error en scan_expiration_date: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error procesando la imagen: {str(e)}"
        )

@app.post("/detect-expiry-fcos")
async def detect_expiry_fcos_endpoint(
    image_base64: str = Body(..., embed=True)
):
    """
    Detectar fecha de vencimiento usando solo FCOS (sin DAN)
    
    Args:
        image_base64: Imagen en formato base64
        
    Returns:
        Resultado de la detección FCOS
    """
    print("[FCOS] Iniciando detección...")
    
    try:
        fcos_result = detect_expiry_dates_with_fcos(image_base64)
        
        if fcos_result.get("success"):
            print(f"[FCOS] Detectó {len(fcos_result.get('all_detections', []))} regiones")
            return fcos_result
        else:
            print(f"[FCOS] No detectó regiones: {fcos_result.get('message')}")
            return fcos_result
            
    except Exception as e:
        print(f"[FCOS] Error en detección: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error en detección FCOS: {str(e)}"
        )

@app.post("/confirm-and-save-product")
async def confirm_and_save_product(
    barcode: str = Body(..., embed=True),
    expiration_date: str = Body(..., embed=True),
    quantity: int = Body(1, embed=True),
    product_info: dict = Body(None, embed=True)
):
    """
    Guardar el producto en la base de datos cuando el usuario confirma el resultado del análisis
    
    Args:
        barcode: Código de barras del producto
        expiration_date: Fecha de vencimiento detectada
        quantity: Cantidad del producto
        product_info: Información del producto obtenida previamente (opcional)
        
    Returns:
        Producto guardado o actualizado
    """
    print(f"[SAVE] Usuario confirmó - Guardando producto: {barcode}")
    print(f"[SAVE] Fecha: {expiration_date}, Cantidad: {quantity}")
    
    try:
        # Parsear la fecha de vencimiento
        try:
            parsed_date = parse_expiration_date(expiration_date)
            print(f"[SAVE] Fecha parseada: {parsed_date}")
        except ValueError as e:
            print(f"[SAVE] Error parseando fecha: {e}")
            raise HTTPException(
                status_code=400, 
                detail=f"Formato de fecha inválido: {expiration_date}. Use formatos como MM/YYYY, MM.YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, YYYY.MM.DD"
            )
        
        # Verificar si el producto ya existe con la misma fecha de vencimiento
        existing_product = await find_one_async(
            products_collection, 
            {"codebar": barcode, "expirationDate": parsed_date}
        )
        
        if existing_product:
            # Si existe con la misma fecha, sumar la cantidad
            new_quantity = existing_product.get("quantity", 0) + quantity
            await update_one_async(
                products_collection,
                {"codebar": barcode, "expirationDate": parsed_date},
                {"$set": {
                    "quantity": new_quantity,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"[SAVE] Cantidad sumada a producto existente: {barcode} (fecha: {expiration_date})")
            
            # Obtener el producto actualizado
            updated_product = await find_one_async(
                products_collection, 
                {"codebar": barcode, "expirationDate": parsed_date}
            )
            if updated_product:
                updated_product["_id"] = str(updated_product["_id"])
            return {
                "message": f"Cantidad sumada exitosamente. Total: {new_quantity}",
                "product": updated_product
            }
        else:
            # Si no existe con esa fecha, crear una nueva entrada
            if product_info:
                # Crear objeto ProductData con la información del producto
                product = ProductData(
                    codebar=barcode,
                    productName=product_info.get("productName", ""),
                    lab=product_info.get("lab", ""),
                    price=product_info.get("price", 0.0),
                    matnr=product_info.get("matnr", ""),
                    expirationDate=parsed_date
                )
                
                # Guardar el producto completo en la base de datos
                await save_product_to_db(product)
                
                # Actualizar la cantidad por separado ya que no está en ProductData
                await update_one_async(
                    products_collection,
                    {"codebar": barcode, "expirationDate": parsed_date},
                    {"$set": {"quantity": quantity}}
                )
                
                print(f"[SAVE] Nueva entrada creada: {product.productName} (fecha: {expiration_date})")
                
                # Obtener el producto completo
                saved_product = await find_one_async(
                    products_collection, 
                    {"codebar": barcode, "expirationDate": parsed_date}
                )
                if saved_product:
                    saved_product["_id"] = str(saved_product["_id"])
                return {
                    "message": "Nueva entrada creada exitosamente",
                    "product": saved_product
                }
            else:
                # Si no tenemos información del producto, crear uno básico
                basic_product = ProductData(
                    codebar=barcode,
                    productName=f"Producto {barcode}",
                    lab="",
                    price=0.0,
                    matnr="",
                    expirationDate=parsed_date
                )
                
                await save_product_to_db(basic_product)
                
                # Actualizar la cantidad por separado
                await update_one_async(
                    products_collection,
                    {"codebar": barcode, "expirationDate": parsed_date},
                    {"$set": {"quantity": quantity}}
                )
                
                print(f"[SAVE] Nueva entrada básica creada: {barcode} (fecha: {expiration_date})")
                
                # Obtener el producto completo
                saved_product = await find_one_async(
                    products_collection, 
                    {"codebar": barcode, "expirationDate": parsed_date}
                )
                if saved_product:
                    saved_product["_id"] = str(saved_product["_id"])
                return {
                    "message": "Nueva entrada básica creada exitosamente",
                    "product": saved_product
                }
                
    except HTTPException:
        # Re-lanzar HTTPException sin modificar
        raise
    except Exception as e:
        print(f"[SAVE] Error guardando producto: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error guardando el producto: {str(e)}"
        )

#Request a api externa para obtener datos del producto

# Para ejecutar el backend:
# fastapi dev main.py
# (Configurado en pyproject.toml para host 0.0.0.0 y puerto 8000)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",  # Usar string de importación para habilitar reload
        host="0.0.0.0",  # Aceptar conexiones desde cualquier IP
        port=8000,
        reload=True
    )


