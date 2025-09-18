from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Float
from database import Base
from sqlalchemy.orm import relationship

class Item(Base):
    __tablename__ = 'items'

    id = Column(Integer, primary_key=True, index=True)
    itemName = Column(String, index=True)
    category = Column(String)
    quantity = Column(Integer)
    unit = Column(String)
    lastRestocked = Column(Date)
    expiryDate = Column(Date)
    lowStockThreshold = Column(Integer)

    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    supplier = relationship("Supplier", back_populates="items")

class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, index=True)
    supplierName = Column(String, index=True)
    contactPerson = Column(String)
    email = Column(String)
    phoneNumber = Column(String)
    address = Column(String)
    rating = Column(Float)
    status = Column(String)

    items = relationship("Item", back_populates="supplier")

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String)
    amount = Column(Float)
    quantity = Column(Integer)
    type = Column(String)
    category = Column(String)
    status = Column(String)

    item_id = Column(Integer, ForeignKey("items.id"))
    item = relationship("Item")

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