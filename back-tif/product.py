from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductData(BaseModel):
    codebar: str
    productName: str
    lab: str
    price: float
    matnr: str
    expirationDate: Optional[datetime] = None
    quantity: Optional[int] = 1  # Cantidad por defecto es 1

