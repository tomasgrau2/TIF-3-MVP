from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.cursor import Cursor
from pymongo.results import DeleteResult, UpdateResult, InsertOneResult
from dotenv import load_dotenv
import os
import asyncio
from typing import Optional, List

load_dotenv()

# MongoDB connection string from environment variable
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

# Create MongoDB client
client = MongoClient(MONGODB_URL)
db: Database = client.productos_farmacia
products_collection: Collection = db.products

# Ensure database and collection exist
def init_db():
    try:
        # Create collection if it doesn't exist
        collections = db.list_collection_names()
        if "products" not in collections:
            db.create_collection("products")
            print("Base de datos 'productos_farmacia' y colección 'products' creadas exitosamente")
        else:
            print("Base de datos 'productos_farmacia' ya existe")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")

# Async wrapper functions for database operations
async def find_one_async(collection: Collection, filter_dict: dict) -> Optional[dict]:
    """Async wrapper for find_one operation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, collection.find_one, filter_dict)

async def insert_one_async(collection: Collection, document: dict) -> InsertOneResult:
    """Async wrapper for insert_one operation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, collection.insert_one, document)

async def update_one_async(collection: Collection, filter_dict: dict, update_dict: dict) -> UpdateResult:
    """Async wrapper for update_one operation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, collection.update_one, filter_dict, update_dict)

async def delete_one_async(collection: Collection, filter_dict: dict) -> DeleteResult:
    """Async wrapper for delete_one operation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, collection.delete_one, filter_dict)

async def find_async(collection: Collection, filter_dict: dict = None) -> List[dict]:
    """Async wrapper for find operation - returns list instead of cursor"""
    loop = asyncio.get_event_loop()
    if filter_dict is None:
        filter_dict = {}
    cursor = await loop.run_in_executor(None, collection.find, filter_dict)
    # Convert cursor to list
    return await loop.run_in_executor(None, list, cursor)

async def count_documents_async(collection: Collection, filter_dict: dict = None) -> int:
    """Async wrapper for count_documents operation"""
    loop = asyncio.get_event_loop()
    if filter_dict is None:
        filter_dict = {}
    return await loop.run_in_executor(None, collection.count_documents, filter_dict)

# No ejecutamos init_db() aquí, lo haremos en el evento de inicio de FastAPI