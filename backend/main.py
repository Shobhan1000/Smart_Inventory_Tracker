from datetime import date
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Annotated
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import models, schemas
from database import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI(title="Inventory Tracker API")
models.Base.metadata.create_all(bind=engine)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# MODELS
# -------------------------

class Item(BaseModel):
    itemName: str
    category: str
    quantity: int
    unit: str
    supplier: str
    lastRestocked: Optional[date] = None
    expiryDate: Optional[date] = None
    lowStockThreshold: int

class Supplier(BaseModel):
    id: int
    supplierName: str
    contactPerson: Optional[str] = "Not specified"
    email: Optional[str] = "No email"
    phoneNumber: Optional[str] = "No phone"
    address: Optional[str] = "Address not provided"
    itemsProvided: Optional[str] = "Various items"
    rating: Optional[float] = 0
    status: Optional[str] = "Active"

class Transaction(BaseModel):
    id: Optional[int] = None
    date: date
    description: str
    amount: float
    type: str  # "Inflow" or "Outflow"
    category: Optional[str] = "General"
    status: Optional[str] = "Completed"

class Alert(BaseModel):
    id: Optional[int] = None
    type: str
    title: str
    message: str

class Event(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    date: date

# -------------------------
# POSTGRESQL 
# -------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# -------------------------
# ITEMS ENDPOINTS
# -------------------------

@app.get("/items/", response_model=List[Item])
async def list_items(db: Annotated[Session, Depends(get_db)]):
    # Query all items from the database
    db_items = db.query(models.Item).all()
    return db_items

'''@app.post("/items/", response_model=Item)
async def add_item(item: Item, db: Annotated[Session, Depends(get_db)]):
    db_item = models.Item(
        itemName=item.itemName,
        category=item.category,
        quantity=item.quantity,
        unit=item.unit,
        supplier=item.supplier,
        lastRestocked=item.lastRestocked,
        expiryDate=item.expiryDate,
        lowStockThreshold=item.lowStockThreshold,  # match your model
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)  # make sure id is populated
    return db_item'''

@app.post("/items/", response_model=schemas.Item)
def add_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Check stock after adding
    if db_item.quantity <= db_item.lowStockThreshold:
        db_alert = models.Alert(
            type="warning",
            title="Low Stock",
            message=f"{db_item.itemName} is low on stock (only {db_item.quantity} {db_item.unit})",
            item_id=db_item.id,
        )
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)

    return db_item


@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    # ---- Stock monitoring ----
    existing_alert = db.query(models.Alert).filter(models.Alert.item_id == db_item.id).first()

    if db_item.quantity <= db_item.lowStockThreshold:
        if not existing_alert:
            db_alert = models.Alert(
                type="warning",
                title="Low Stock",
                message=f"{db_item.itemName} is low on stock (only {db_item.quantity} {db_item.unit})",
                item_id=db_item.id,
            )
            db.add(db_alert)
            db.commit()
            db.refresh(db_alert)
    else:
        if existing_alert:
            db.delete(existing_alert)
            db.commit()

    return db_item

# -------------------------
# SUPPLIERS ENDPOINTS
# -------------------------

@app.get("/suppliers/", response_model=List[Supplier])
async def list_suppliers(db: Annotated[Session, Depends(get_db)]):
    # Query all suppliers from the database
    db_suppliers = db.query(models.Supplier).all()
    return db_suppliers

@app.post("/suppliers/", response_model=Supplier)
async def add_supplier(supplier: Supplier, db: Annotated[Session, Depends(get_db)]):
    db_supplier = models.Supplier(
        supplierName=supplier.supplierName,
        contactPerson=supplier.contactPerson,
        email=supplier.email,
        phoneNumber=supplier.phoneNumber,
        address=supplier.address,
        itemsProvided=supplier.itemsProvided,
        rating=supplier.rating,
        status=supplier.status,  # match your model
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)  # make sure id is populated
    return db_supplier

# -------------------------
# TRANSACTIONS ENDPOINTS
# -------------------------

@app.get("/transactions/", response_model=List[Transaction])
async def list_transactions(db: Annotated[Session, Depends(get_db)]):
    # Query all items from the database
    db_transactions = db.query(models.Transaction).all()
    return db_transactions

@app.post("/transactions/", response_model=Transaction)
async def add_transaction(transaction: Transaction, db: Annotated[Session, Depends(get_db)]):
    db_transaction = models.Transaction(
        date=transaction.date,
        description=transaction.description,
        amount=transaction.amount,
        type=transaction.type,
        category=transaction.category,
        status=transaction.status,
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)  # make sure id is populated
    return db_transaction

@app.delete("/transactions/{transaction_id}", response_model=Transaction)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_transaction)
    db.commit()
    return db_transaction

# -------------------------
# ALERTS ENDPOINTS
# -------------------------

@app.get("/alerts/", response_model=List[Alert])
async def list_alerts(db: Annotated[Session, Depends(get_db)]):
    # Query all items from the database
    db_alerts = db.query(models.Alert).all()
    return db_alerts

@app.post("/alerts/", response_model=Alert)
async def add_alerts(alert: Alert, db: Annotated[Session, Depends(get_db)]):
    db_alert = models.Alert(
        type=alert.type,
        title=alert.title,
        message=alert.message,
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)  # make sure id is populated
    return db_alert

# -------------------------
# EVENTS ENDPOINTS
# -------------------------

@app.get("/events/", response_model=List[Event])
async def list_events(db: Annotated[Session, Depends(get_db)]):
    # Query all items from the database
    db_events = db.query(models.Event).all()
    return db_events

@app.post("/events/", response_model=Event)
async def add_events(event: Event, db: Annotated[Session, Depends(get_db)]):
    db_event = models.Event(
        title=event.title,
        description=event.description,
        date=event.date,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)  # make sure id is populated
    return db_event

# -------------------------
# FORECAST PREDICTION
# -------------------------

# Request model
class ForecastRequest(BaseModel):
    product: str
    currentStock: int
    salesData: str  # comma-separated numbers

# Response model
class ForecastResponse(BaseModel):
    product: str
    forecast: List[float]

@app.post("/api/forecast", response_model=ForecastResponse)
def forecast_demand(request: ForecastRequest):
    # Convert salesData CSV string to list of numbers
    sales_list = [float(x.strip()) for x in request.salesData.split(",") if x.strip()]
    if len(sales_list) < 2:
        return {"product": request.product, "forecast": [0]}  # Not enough data
    
    # Fit ARIMA model (p=1, d=1, q=1 is a simple starting point)
    try:
        model = ARIMA(sales_list, order=(1, 1, 1))
        model_fit = model.fit()
        # Forecast next 6 periods
        forecast = model_fit.forecast(steps=6)
        forecast_list = forecast.tolist()
    except Exception as e:
        print("ARIMA error:", e)
        forecast_list = [0] * 6

    return {"product": request.product, "forecast": forecast_list}