from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# -------------------------
# ITEM SCHEMAS
# -------------------------
class ItemBase(BaseModel):
    itemName: str
    category: str
    quantity: int
    unit: str
    supplier: str
    lastRestocked: Optional[date] = None
    expiryDate: Optional[date] = None
    lowStockThreshold: int


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    itemName: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    supplier: Optional[str] = None
    lastRestocked: Optional[date] = None
    expiryDate: Optional[date] = None
    lowStockThreshold: Optional[int] = None


class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True


# -------------------------
# SUPPLIER SCHEMAS
# -------------------------
class SupplierBase(BaseModel):
    supplierName: str
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    itemsProvided: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplierName: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    itemsProvided: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None


class Supplier(SupplierBase):
    id: int

    class Config:
        orm_mode = True


# -------------------------
# TRANSACTION SCHEMAS
# -------------------------
class TransactionBase(BaseModel):
    date: date
    description: str
    amount: float
    type: str
    category: Optional[str] = None
    status: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class Transaction(TransactionBase):
    id: int

    class Config:
        orm_mode = True


# -------------------------
# ALERT SCHEMAS
# -------------------------
class AlertBase(BaseModel):
    type: str
    title: str
    message: str


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None


class Alert(AlertBase):
    id: int

    class Config:
        orm_mode = True

# -------------------------
# EVENT SCHEMAS
# -------------------------
class EventBase(BaseModel):
    title: str
    description: str
    date: date


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None


class Event(EventBase):
    id: int

    class Config:
        orm_mode = True