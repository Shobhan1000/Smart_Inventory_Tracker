from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Float
from database import Base

class Item(Base):
    __tablename__ = 'items'

    id = Column(Integer, primary_key=True, index=True)
    itemName = Column(String, index=True)
    category = Column(String)
    quantity = Column(Integer)
    unit = Column(String)
    supplier = Column(String)
    lastRestocked = Column(Date)
    expiryDate = Column(Date)
    lowStockThreshold = Column(Integer)

class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, index=True)
    supplierName = Column(String, index=True)
    contactPerson = Column(String)
    email = Column(String)
    phoneNumber = Column(Integer)
    address = Column(String)
    itemsProvided = Column(String)
    rating = Column(Float)
    status = Column(String)

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String)
    amount = Column(Float)
    type = Column(String)
    category = Column(String)
    status = Column(String)

class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    title = Column(String)
    message = Column(String)
    item_id = Column(Integer, ForeignKey("items.id"))

class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    date = Column(Date)