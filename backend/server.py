from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="ClimaRentas API")
api_router = APIRouter(prefix="/api")


# ----- Models -----
ProductType = Literal["calenton", "cooler"]
RentalStatus = Literal["pendiente", "en_progreso", "terminado", "atrasado"]


class RentalBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    client_name: str
    phone: Optional[str] = ""
    location: str
    product_type: ProductType
    product_model: str
    cost: float
    start_date: str  # ISO datetime string
    end_date: str    # ISO datetime string
    status: RentalStatus = "pendiente"
    notes: Optional[str] = ""


class Rental(RentalBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RentalCreate(RentalBase):
    pass


class RentalUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    client_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    product_type: Optional[ProductType] = None
    product_model: Optional[str] = None
    cost: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[RentalStatus] = None
    notes: Optional[str] = None


# ----- Helpers -----
def compute_status(rental: dict) -> str:
    """Auto-compute status based on current time vs dates, but respect 'terminado'."""
    if rental.get("status") == "terminado":
        return "terminado"
    now = datetime.now(timezone.utc)
    try:
        start = datetime.fromisoformat(rental["start_date"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(rental["end_date"].replace("Z", "+00:00"))
    except Exception:
        return rental.get("status", "pendiente")
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    if now > end:
        return "atrasado"
    if now >= start:
        return "en_progreso"
    return "pendiente"


def enrich(rental: dict) -> dict:
    rental.pop("_id", None)
    rental["status"] = compute_status(rental)
    return rental


# ----- Routes -----
@api_router.get("/")
async def root():
    return {"message": "ClimaRentas API", "status": "ok"}


@api_router.post("/rentals", response_model=Rental)
async def create_rental(payload: RentalCreate):
    rental = Rental(**payload.model_dump())
    doc = rental.model_dump()
    await db.rentals.insert_one(doc)
    return Rental(**enrich(doc))


@api_router.get("/rentals", response_model=List[Rental])
async def list_rentals(status: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if q:
        query["client_name"] = {"$regex": q, "$options": "i"}
    docs = await db.rentals.find(query, {"_id": 0}).sort("start_date", 1).to_list(1000)
    docs = [enrich(d) for d in docs]
    if status and status != "todas":
        docs = [d for d in docs if d["status"] == status]
    return [Rental(**d) for d in docs]


@api_router.get("/rentals/today", response_model=List[Rental])
async def todays_rentals():
    """Returns rentals with deliveries or returns happening today."""
    now = datetime.now(timezone.utc)
    today = now.date()
    docs = await db.rentals.find({}, {"_id": 0}).to_list(1000)
    out = []
    for d in docs:
        try:
            start = datetime.fromisoformat(d["start_date"].replace("Z", "+00:00")).date()
            end = datetime.fromisoformat(d["end_date"].replace("Z", "+00:00")).date()
            if start == today or end == today:
                out.append(enrich(d))
        except Exception:
            continue
    out.sort(key=lambda r: r["start_date"])
    return [Rental(**d) for d in out]


@api_router.get("/rentals/upcoming", response_model=List[Rental])
async def upcoming_rentals(days: int = 7):
    """Returns rentals starting or ending in next N days."""
    now = datetime.now(timezone.utc)
    limit = now + timedelta(days=days)
    docs = await db.rentals.find({}, {"_id": 0}).to_list(1000)
    out = []
    for d in docs:
        try:
            start = datetime.fromisoformat(d["start_date"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(d["end_date"].replace("Z", "+00:00"))
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            # Upcoming = either start in window OR end in window OR active now
            if (now <= start <= limit) or (now <= end <= limit) or (start <= now <= end):
                out.append(enrich(d))
        except Exception:
            continue
    out.sort(key=lambda r: r["start_date"])
    return [Rental(**d) for d in out]


@api_router.get("/stats")
async def get_stats():
    docs = await db.rentals.find({}, {"_id": 0}).to_list(2000)
    docs = [enrich(d) for d in docs]
    now = datetime.now(timezone.utc)
    today = now.date()
    by_status = {"pendiente": 0, "en_progreso": 0, "terminado": 0, "atrasado": 0}
    today_deliveries = 0
    today_returns = 0
    monthly_revenue = 0.0
    for d in docs:
        by_status[d["status"]] = by_status.get(d["status"], 0) + 1
        try:
            start = datetime.fromisoformat(d["start_date"].replace("Z", "+00:00")).date()
            end = datetime.fromisoformat(d["end_date"].replace("Z", "+00:00")).date()
            if start == today:
                today_deliveries += 1
            if end == today:
                today_returns += 1
            if start.year == now.year and start.month == now.month:
                monthly_revenue += float(d.get("cost", 0))
        except Exception:
            continue
    return {
        "total": len(docs),
        "by_status": by_status,
        "today_deliveries": today_deliveries,
        "today_returns": today_returns,
        "monthly_revenue": round(monthly_revenue, 2),
    }


@api_router.get("/rentals/{rental_id}", response_model=Rental)
async def get_rental(rental_id: str):
    doc = await db.rentals.find_one({"id": rental_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Renta no encontrada")
    return Rental(**enrich(doc))


@api_router.put("/rentals/{rental_id}", response_model=Rental)
async def update_rental(rental_id: str, payload: RentalUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Sin cambios")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.rentals.update_one({"id": rental_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Renta no encontrada")
    doc = await db.rentals.find_one({"id": rental_id}, {"_id": 0})
    return Rental(**enrich(doc))


@api_router.delete("/rentals/{rental_id}")
async def delete_rental(rental_id: str):
    result = await db.rentals.delete_one({"id": rental_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Renta no encontrada")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
