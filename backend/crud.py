from sqlalchemy.orm import Session
from models import Item, Supplier, Alert, Transaction
from schemas import ItemCreate, ItemUpdate, TransactionBase
from datetime import date


# -------------------------
# Helper functions
# -------------------------
def check_low_stock_alert(db: Session, item: Item):
    """Trigger low stock alert if needed."""
    if item.quantity <= item.lowStockThreshold:
        existing_alert = db.query(Alert).filter(
            Alert.item_id == item.id,
            Alert.type == "Low Stock"
        ).first()
        if not existing_alert:
            alert = Alert(
                type="Low Stock",
                title=f"Low stock for {item.itemName}",
                message=f"Only {item.quantity} left in stock.",
                item_id=item.id
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)


def check_expiry_alert(db: Session, item: Item):
    """Trigger expiry alert if item is expired or close to expiry."""
    if item.expiryDate and item.expiryDate <= date.today():
        existing_alert = db.query(Alert).filter(
            Alert.item_id == item.id,
            Alert.type == "Expiry"
        ).first()
        if not existing_alert:
            alert = Alert(
                type="Expiry",
                title=f"{item.itemName} expired!",
                message=f"{item.itemName} expired on {item.expiryDate}.",
                item_id=item.id
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)


# -------------------------
# Items
# -------------------------
def create_item(db: Session, item: ItemCreate):
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    check_low_stock_alert(db, db_item)
    check_expiry_alert(db, db_item)

    return db_item


def update_item(db: Session, item_id: int, updates: ItemUpdate):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        return None

    for key, value in updates.dict(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    check_low_stock_alert(db, db_item)
    check_expiry_alert(db, db_item)

    return db_item


# -------------------------
# Transactions
# -------------------------
def create_transaction(db: Session, txn: TransactionBase):
    db_txn = Transaction(**txn.dict())
    db.add(db_txn)

    item = db.query(Item).filter(Item.id == txn.item_id).first()
    if item:
        if db_txn.type.lower() == "purchase":
            item.quantity += db_txn.quantity
        elif db_txn.type.lower() == "sale":
            item.quantity -= db_txn.quantity

        check_low_stock_alert(db, item)
        check_expiry_alert(db, item)

    db.commit()
    db.refresh(db_txn)
    return db_txn


# -------------------------
# Alerts
# -------------------------
def create_alert(db: Session, type: str, title: str, message: str, item_id: int = None):
    alert = Alert(type=type, title=title, message=message, item_id=item_id)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert