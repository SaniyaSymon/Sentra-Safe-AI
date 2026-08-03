from fastapi import FastAPI, APIRouter, HTTPException, Query, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="SentraSafe AI API")
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def strip_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    if doc and "_id" in doc:
        doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


# ================= MODELS =================
class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # citizen | operator | campus
    full_name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    state: str
    district: str
    preferred_language: str = "en"
    family_size: Optional[int] = 1
    linked_campus_id: Optional[str] = None
    campus_role: Optional[str] = None  # professor | ncc | security | coordinator | admin | medical
    created_at: str = Field(default_factory=now_iso)


class Shelter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shelter_name: str
    district: str
    state: str
    max_capacity: int
    occupied_spots: int
    status: str = "active"
    latitude: float
    longitude: float
    contact_phone: str
    address: str


class Hospital(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hospital_name: str
    district: str
    state: str
    hospital_type: str
    emergency_support: bool = True
    bed_capacity: int
    available_beds: int
    status: str = "operational"
    latitude: float
    longitude: float
    contact_phone: str
    address: str


class College(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    college_name: str
    district: str
    state: str
    college_type: str
    can_be_relief_center: bool = True
    current_status: str = "operational"
    latitude: float
    longitude: float
    contact_phone: str
    address: str


class HazardZone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    district: str
    state: str
    hazard_type: str  # flood | landslide
    risk_level: str  # low | medium | high | severe
    latitude: float
    longitude: float
    rules_json: Dict[str, Any] = Field(default_factory=dict)


class CampusContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    college_id: str
    contact_name: str
    role_type: str  # professor | ncc | security | coordinator | admin | medical
    phone: str
    preferred_language: str = "en"
    can_receive_sms: bool = True
    can_receive_voice_call: bool = True
    is_primary: bool = False
    is_active: bool = True
    updated_at: str = Field(default_factory=now_iso)


class CampusContactUpdate(BaseModel):
    contact_name: Optional[str] = None
    role_type: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    can_receive_sms: Optional[bool] = None
    can_receive_voice_call: Optional[bool] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None


class DamageAssessRequest(BaseModel):
    image_base64: str  # data:image/...;base64,xxx OR raw base64
    context: Optional[str] = ""
    state: Optional[str] = ""
    district: Optional[str] = ""
    hazard_type: Optional[str] = "general"
    language: Optional[str] = "en"
    sos_id: Optional[str] = None
    mirror_url: Optional[str] = None  # Supabase Storage URL (optional)


class SOSCreate(BaseModel):
    citizen_name: str
    phone: str
    latitude: float
    longitude: float
    hazard_type: str = "general"
    details: Optional[str] = ""
    district: str
    state: str
    preferred_language: str = "en"
    linked_college_id: Optional[str] = None
    trapped_count: Optional[int] = 1
    medical_notes: Optional[str] = ""


class SOS(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    incident_code: str = Field(default_factory=lambda: f"SOS-{uuid.uuid4().hex[:6].upper()}")
    citizen_name: str
    phone: str
    latitude: float
    longitude: float
    hazard_type: str
    details: str = ""
    status: str = "new"  # new | acknowledged | dispatched | resolved
    created_at: str = Field(default_factory=now_iso)
    district: str
    state: str
    preferred_language: str = "en"
    linked_college_id: Optional[str] = None
    operator_status: str = "pending"
    campus_status: str = "pending"
    sync_state: str = "synced"
    trapped_count: int = 1
    medical_notes: str = ""
    assigned_operator: Optional[str] = None
    assigned_team: Optional[str] = None
    eta_minutes: Optional[int] = None
    notes: str = ""


class SOSUpdate(BaseModel):
    status: Optional[str] = None
    operator_status: Optional[str] = None
    campus_status: Optional[str] = None
    assigned_operator: Optional[str] = None
    assigned_team: Optional[str] = None
    eta_minutes: Optional[int] = None
    notes: Optional[str] = None


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target_role: str  # citizen | operator | campus
    target_entity_id: Optional[str] = None
    related_sos_id: Optional[str] = None
    message_title: str
    message_body: str
    notification_type: str = "info"  # info | alert | critical
    delivery_channel: str = "in_app"  # in_app | sms | voice_call
    delivery_status: str = "pending"  # pending | sent | failed | queued_offline | synced
    created_at: str = Field(default_factory=now_iso)


class NotificationCreate(BaseModel):
    target_role: str
    target_entity_id: Optional[str] = None
    related_sos_id: Optional[str] = None
    message_title: str
    message_body: str
    notification_type: str = "info"
    delivery_channel: str = "in_app"


class TestDispatchRequest(BaseModel):
    channel: str  # sms | voice_call
    phone: str
    message: Optional[str] = "SentraSafe AI - Test alert. Please acknowledge."
    college_id: Optional[str] = None
    sos_id: Optional[str] = None
    critical: bool = False


# ================= SEED FALLBACK =================
FALLBACK_SHELTERS = [
    {"shelter_name": "Anna Nagar Community Hall", "district": "Chennai", "state": "Tamil Nadu", "max_capacity": 400, "occupied_spots": 120, "latitude": 13.0850, "longitude": 80.2101, "contact_phone": "+91-9840012301", "address": "Anna Nagar West, Chennai"},
    {"shelter_name": "Marina Relief Camp", "district": "Chennai", "state": "Tamil Nadu", "max_capacity": 600, "occupied_spots": 340, "latitude": 13.0500, "longitude": 80.2824, "contact_phone": "+91-9840012302", "address": "Marina Beach Rd, Chennai"},
    {"shelter_name": "Coimbatore Central Shelter", "district": "Coimbatore", "state": "Tamil Nadu", "max_capacity": 500, "occupied_spots": 210, "latitude": 11.0168, "longitude": 76.9558, "contact_phone": "+91-9840012303", "address": "RS Puram, Coimbatore"},
    {"shelter_name": "Ooty Hillside Shelter", "district": "Nilgiris", "state": "Tamil Nadu", "max_capacity": 200, "occupied_spots": 60, "latitude": 11.4102, "longitude": 76.6950, "contact_phone": "+91-9840012304", "address": "Charring Cross, Ooty"},
    {"shelter_name": "Kalpetta Relief Center", "district": "Wayanad", "state": "Kerala", "max_capacity": 350, "occupied_spots": 190, "latitude": 11.6083, "longitude": 76.0838, "contact_phone": "+91-9847012305", "address": "Kalpetta Town, Wayanad"},
    {"shelter_name": "Munnar Emergency Shelter", "district": "Idukki", "state": "Kerala", "max_capacity": 250, "occupied_spots": 80, "latitude": 10.0889, "longitude": 77.0595, "contact_phone": "+91-9847012306", "address": "Munnar Center, Idukki"},
    {"shelter_name": "Thrissur Town Hall Shelter", "district": "Thrissur", "state": "Kerala", "max_capacity": 400, "occupied_spots": 100, "latitude": 10.5276, "longitude": 76.2144, "contact_phone": "+91-9847012307", "address": "Swaraj Round, Thrissur"},
    {"shelter_name": "Kollam Beach Shelter", "district": "Kollam", "state": "Kerala", "max_capacity": 300, "occupied_spots": 150, "latitude": 8.8932, "longitude": 76.6141, "contact_phone": "+91-9847012308", "address": "Kollam Beach Rd"},
    {"shelter_name": "TVM Central Shelter", "district": "Thiruvananthapuram", "state": "Kerala", "max_capacity": 500, "occupied_spots": 210, "latitude": 8.5241, "longitude": 76.9366, "contact_phone": "+91-9847012309", "address": "MG Rd, Thiruvananthapuram"},
]

FALLBACK_HOSPITALS = [
    {"hospital_name": "Apollo Hospital Chennai", "district": "Chennai", "state": "Tamil Nadu", "hospital_type": "Multi-Specialty", "bed_capacity": 500, "available_beds": 120, "latitude": 13.0637, "longitude": 80.2521, "contact_phone": "+91-4428293333", "address": "Greams Rd, Chennai"},
    {"hospital_name": "Rajiv Gandhi Govt Hospital", "district": "Chennai", "state": "Tamil Nadu", "hospital_type": "Government", "bed_capacity": 800, "available_beds": 260, "latitude": 13.0827, "longitude": 80.2707, "contact_phone": "+91-4425305000", "address": "Park Town, Chennai"},
    {"hospital_name": "PSG Hospital Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu", "hospital_type": "Multi-Specialty", "bed_capacity": 900, "available_beds": 340, "latitude": 11.0244, "longitude": 77.0028, "contact_phone": "+91-4222570170", "address": "Peelamedu, Coimbatore"},
    {"hospital_name": "Ooty Govt Hospital", "district": "Nilgiris", "state": "Tamil Nadu", "hospital_type": "Government", "bed_capacity": 200, "available_beds": 55, "latitude": 11.4133, "longitude": 76.6980, "contact_phone": "+91-4232442218", "address": "Hospital Rd, Ooty"},
    {"hospital_name": "Wayanad Institute of Medical Sciences", "district": "Wayanad", "state": "Kerala", "hospital_type": "Multi-Specialty", "bed_capacity": 450, "available_beds": 130, "latitude": 11.6820, "longitude": 76.1315, "contact_phone": "+91-4936355555", "address": "Meppadi, Wayanad"},
    {"hospital_name": "Idukki District Hospital", "district": "Idukki", "state": "Kerala", "hospital_type": "Government", "bed_capacity": 300, "available_beds": 90, "latitude": 9.8497, "longitude": 76.9681, "contact_phone": "+91-4862232310", "address": "Painavu, Idukki"},
    {"hospital_name": "Amala Institute of Medical Sciences", "district": "Thrissur", "state": "Kerala", "hospital_type": "Multi-Specialty", "bed_capacity": 800, "available_beds": 280, "latitude": 10.5470, "longitude": 76.2110, "contact_phone": "+91-4872307000", "address": "Amala Nagar, Thrissur"},
    {"hospital_name": "Kollam District Hospital", "district": "Kollam", "state": "Kerala", "hospital_type": "Government", "bed_capacity": 400, "available_beds": 110, "latitude": 8.8790, "longitude": 76.5980, "contact_phone": "+91-4742793015", "address": "Kollam, Kerala"},
    {"hospital_name": "SCTIMST Thiruvananthapuram", "district": "Thiruvananthapuram", "state": "Kerala", "hospital_type": "Speciality", "bed_capacity": 550, "available_beds": 170, "latitude": 8.5450, "longitude": 76.9020, "contact_phone": "+91-4712524140", "address": "Poojappura, TVM"},
]

FALLBACK_COLLEGES = [
    {"college_name": "IIT Madras", "district": "Chennai", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 12.9915, "longitude": 80.2337, "contact_phone": "+91-4422578100", "address": "Sardar Patel Rd, Chennai"},
    {"college_name": "Anna University", "district": "Chennai", "state": "Tamil Nadu", "college_type": "University", "can_be_relief_center": True, "latitude": 13.0107, "longitude": 80.2352, "contact_phone": "+91-4422351723", "address": "Guindy, Chennai"},
    {"college_name": "PSG College of Technology", "district": "Coimbatore", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.0244, "longitude": 77.0028, "contact_phone": "+91-4222572177", "address": "Peelamedu, Coimbatore"},
    {"college_name": "Government College Ooty", "district": "Nilgiris", "state": "Tamil Nadu", "college_type": "Arts & Science", "can_be_relief_center": True, "latitude": 11.4131, "longitude": 76.6959, "contact_phone": "+91-4232442334", "address": "Ooty Main Rd"},
    {"college_name": "Nandha College of Technology", "district": "Erode", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.3410, "longitude": 77.7172, "contact_phone": "+91-4242244888", "address": "Perundurai Rd, Erode"},
    {"college_name": "Nandha Engineering College", "district": "Erode", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.3495, "longitude": 77.7225, "contact_phone": "+91-4242244999", "address": "Vaikkaalmedu, Erode"},
    {"college_name": "Kongu Engineering College", "district": "Erode", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.2698, "longitude": 77.6076, "contact_phone": "+91-4294226602", "address": "Perundurai, Erode"},
    {"college_name": "Thiagarajar College of Engineering", "district": "Madurai", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 9.8853, "longitude": 78.0810, "contact_phone": "+91-4522482240", "address": "Thiruparankundram, Madurai"},
    {"college_name": "SRM University Kattankulathur", "district": "Chengalpattu", "state": "Tamil Nadu", "college_type": "University", "can_be_relief_center": True, "latitude": 12.8231, "longitude": 80.0444, "contact_phone": "+91-4427417000", "address": "Kattankulathur, Chengalpattu"},
    {"college_name": "Bharathidasan University", "district": "Tiruchirappalli", "state": "Tamil Nadu", "college_type": "University", "can_be_relief_center": True, "latitude": 10.7305, "longitude": 78.7580, "contact_phone": "+91-4312407088", "address": "Palkalaiperur, Trichy"},
    {"college_name": "Government College of Engineering Salem", "district": "Salem", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.6740, "longitude": 78.1230, "contact_phone": "+91-4272346424", "address": "Salem"},
    {"college_name": "Government College of Technology Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.0018, "longitude": 76.9628, "contact_phone": "+91-4222432221", "address": "Thadagam Rd, Coimbatore"},
    {"college_name": "Manonmaniam Sundaranar University", "district": "Tirunelveli", "state": "Tamil Nadu", "college_type": "University", "can_be_relief_center": True, "latitude": 8.6849, "longitude": 77.7379, "contact_phone": "+91-4622333741", "address": "Abishekapatti, Tirunelveli"},
    {"college_name": "Government College of Engineering Erode (Bargur)", "district": "Krishnagiri", "state": "Tamil Nadu", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 12.5240, "longitude": 78.3610, "contact_phone": "+91-4344268100", "address": "Bargur, Krishnagiri"},
    {"college_name": "Alagappa University", "district": "Sivaganga", "state": "Tamil Nadu", "college_type": "University", "can_be_relief_center": True, "latitude": 9.9138, "longitude": 78.7970, "contact_phone": "+91-4565223125", "address": "Karaikudi, Sivaganga"},
    {"college_name": "Vellore Institute of Technology", "district": "Vellore", "state": "Tamil Nadu", "college_type": "University", "can_be_relief_center": True, "latitude": 12.9692, "longitude": 79.1559, "contact_phone": "+91-4162202020", "address": "Katpadi, Vellore"},
    {"college_name": "Government Engineering College Wayanad", "district": "Wayanad", "state": "Kerala", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.6250, "longitude": 76.0900, "contact_phone": "+91-4936256211", "address": "Mananthavady, Wayanad"},
    {"college_name": "College of Engineering Munnar", "district": "Idukki", "state": "Kerala", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 10.0800, "longitude": 77.0600, "contact_phone": "+91-4865234567", "address": "Munnar, Idukki"},
    {"college_name": "St. Thomas College Thrissur", "district": "Thrissur", "state": "Kerala", "college_type": "Arts & Science", "can_be_relief_center": True, "latitude": 10.5215, "longitude": 76.2131, "contact_phone": "+91-4872420080", "address": "Thrissur"},
    {"college_name": "TKM College of Engineering", "district": "Kollam", "state": "Kerala", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 8.9130, "longitude": 76.6300, "contact_phone": "+91-4742712024", "address": "Karicode, Kollam"},
    {"college_name": "College of Engineering Trivandrum", "district": "Thiruvananthapuram", "state": "Kerala", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 8.5443, "longitude": 76.9052, "contact_phone": "+91-4712515555", "address": "Sreekariyam, TVM"},
    {"college_name": "Cochin University of Science and Technology", "district": "Ernakulam", "state": "Kerala", "college_type": "University", "can_be_relief_center": True, "latitude": 10.0459, "longitude": 76.3272, "contact_phone": "+91-4842577550", "address": "Kalamassery, Ernakulam"},
    {"college_name": "Government College Kottayam", "district": "Kottayam", "state": "Kerala", "college_type": "Arts & Science", "can_be_relief_center": True, "latitude": 9.5916, "longitude": 76.5222, "contact_phone": "+91-4812562374", "address": "Nattakom, Kottayam"},
    {"college_name": "Government Engineering College Palakkad", "district": "Palakkad", "state": "Kerala", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 10.7867, "longitude": 76.6548, "contact_phone": "+91-4922282122", "address": "Sreekrishnapuram, Palakkad"},
    {"college_name": "NIT Calicut", "district": "Kozhikode", "state": "Kerala", "college_type": "Engineering", "can_be_relief_center": True, "latitude": 11.3208, "longitude": 75.9345, "contact_phone": "+91-4952286100", "address": "NIT Campus, Kozhikode"},
    {"college_name": "Government College Malappuram", "district": "Malappuram", "state": "Kerala", "college_type": "Arts & Science", "can_be_relief_center": True, "latitude": 11.0510, "longitude": 76.0711, "contact_phone": "+91-4832734844", "address": "Malappuram"},
    {"college_name": "Kannur University", "district": "Kannur", "state": "Kerala", "college_type": "University", "can_be_relief_center": True, "latitude": 11.8745, "longitude": 75.3704, "contact_phone": "+91-4972806000", "address": "Thavakkara, Kannur"},
    {"college_name": "Central University of Kerala", "district": "Kasaragod", "state": "Kerala", "college_type": "University", "can_be_relief_center": True, "latitude": 12.4996, "longitude": 74.9869, "contact_phone": "+91-4994256400", "address": "Periye, Kasaragod"},
    {"college_name": "Catholicate College Pathanamthitta", "district": "Pathanamthitta", "state": "Kerala", "college_type": "Arts & Science", "can_be_relief_center": True, "latitude": 9.2648, "longitude": 76.7870, "contact_phone": "+91-4682222223", "address": "Pathanamthitta"},
    {"college_name": "SD College Alappuzha", "district": "Alappuzha", "state": "Kerala", "college_type": "Arts & Science", "can_be_relief_center": True, "latitude": 9.4981, "longitude": 76.3388, "contact_phone": "+91-4772243403", "address": "Alappuzha"},
]

FALLBACK_HAZARDS = [
    {"name": "Chennai Coastal Flood Zone", "district": "Chennai", "state": "Tamil Nadu", "hazard_type": "flood", "risk_level": "high", "latitude": 13.0500, "longitude": 80.2824, "rules_json": {"rainfall_mm": 180, "runoff": "critical"}},
    {"name": "Nilgiris Landslide Belt", "district": "Nilgiris", "state": "Tamil Nadu", "hazard_type": "landslide", "risk_level": "severe", "latitude": 11.4102, "longitude": 76.6950, "rules_json": {"slope_movement_mm": 45, "rainfall_mm": 220}},
    {"name": "Wayanad Landslide Sector", "district": "Wayanad", "state": "Kerala", "hazard_type": "landslide", "risk_level": "severe", "latitude": 11.6083, "longitude": 76.0838, "rules_json": {"slope_movement_mm": 60, "rainfall_mm": 260}},
    {"name": "Idukki Reservoir Overflow Zone", "district": "Idukki", "state": "Kerala", "hazard_type": "flood", "risk_level": "high", "latitude": 10.0889, "longitude": 77.0595, "rules_json": {"rainfall_mm": 200, "river_discharge": "high"}},
    {"name": "Thrissur Lowland Flood", "district": "Thrissur", "state": "Kerala", "hazard_type": "flood", "risk_level": "medium", "latitude": 10.5276, "longitude": 76.2144, "rules_json": {"rainfall_mm": 130}},
    {"name": "Coimbatore Urban Flood", "district": "Coimbatore", "state": "Tamil Nadu", "hazard_type": "flood", "risk_level": "medium", "latitude": 11.0168, "longitude": 76.9558, "rules_json": {"rainfall_mm": 120}},
    {"name": "TVM Coastal Surge Zone", "district": "Thiruvananthapuram", "state": "Kerala", "hazard_type": "flood", "risk_level": "medium", "latitude": 8.5241, "longitude": 76.9366, "rules_json": {"rainfall_mm": 140}},
    {"name": "Kollam Backwater Flood", "district": "Kollam", "state": "Kerala", "hazard_type": "flood", "risk_level": "medium", "latitude": 8.8932, "longitude": 76.6141, "rules_json": {"rainfall_mm": 135}},
]


async def seed_if_empty():
    if await db.shelters.count_documents({}) == 0:
        for s in FALLBACK_SHELTERS:
            doc = Shelter(**s).model_dump()
            await db.shelters.insert_one(doc)
    if await db.hospitals.count_documents({}) == 0:
        for h in FALLBACK_HOSPITALS:
            doc = Hospital(**h).model_dump()
            await db.hospitals.insert_one(doc)
    # Upsert-by-name: insert missing colleges so new seeds show up without wiping DB
    existing_names = set()
    async for d in db.colleges.find({}, {"college_name": 1, "_id": 0}):
        existing_names.add(d.get("college_name"))
    for c in FALLBACK_COLLEGES:
        if c["college_name"] not in existing_names:
            doc = College(**c).model_dump()
            await db.colleges.insert_one(doc)
    if await db.hazard_zones.count_documents({}) == 0:
        for h in FALLBACK_HAZARDS:
            doc = HazardZone(**h).model_dump()
            await db.hazard_zones.insert_one(doc)
    # Upsert-by-role: ensure each college has all six roles seeded
    colleges = await db.colleges.find({}, {"_id": 0}).to_list(200)
    roles = [("Prof. Rajesh Kumar", "professor", True), ("Cadet Officer Vikram", "ncc", False), ("Security Chief Suresh", "security", False), ("Emergency Coordinator Priya", "coordinator", False), ("Dr. Meera Nair (Medical)", "medical", False), ("Campus Admin Anitha", "admin", False)]
    for col in colleges:
        existing_roles = set()
        async for cc in db.campus_contacts.find({"college_id": col["id"]}, {"role_type": 1, "_id": 0}):
            existing_roles.add(cc.get("role_type"))
        for name, rtype, primary in roles:
            if rtype in existing_roles:
                continue
            contact = CampusContact(college_id=col["id"], contact_name=name, role_type=rtype, phone=f"+91-98{uuid.uuid4().hex[:8]}", is_primary=primary).model_dump()
            await db.campus_contacts.insert_one(contact)


@app.on_event("startup")
async def on_startup():
    await seed_if_empty()


# ================= ENDPOINTS =================
@api_router.get("/")
async def root():
    return {"app": "SentraSafe AI", "status": "operational"}


@api_router.get("/health")
async def health():
    return {"status": "ok", "time": now_iso()}


# ---- Profiles ----
@api_router.post("/profiles", response_model=UserProfile)
async def create_profile(profile: UserProfile):
    doc = profile.model_dump()
    await db.user_profiles.insert_one(doc)
    return profile


@api_router.get("/profiles/{profile_id}", response_model=UserProfile)
async def get_profile(profile_id: str):
    doc = await db.user_profiles.find_one({"id": profile_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Profile not found")
    return UserProfile(**doc)


# ---- Resources (shelters, hospitals, colleges, hazards) ----
@api_router.get("/shelters")
async def list_shelters(state: Optional[str] = None, district: Optional[str] = None):
    q = {}
    if state: q["state"] = state
    if district: q["district"] = district
    docs = await db.shelters.find(q, {"_id": 0}).to_list(500)
    return docs


@api_router.get("/hospitals")
async def list_hospitals(state: Optional[str] = None, district: Optional[str] = None):
    q = {}
    if state: q["state"] = state
    if district: q["district"] = district
    docs = await db.hospitals.find(q, {"_id": 0}).to_list(500)
    return docs


@api_router.get("/colleges")
async def list_colleges(state: Optional[str] = None, district: Optional[str] = None):
    q = {}
    if state: q["state"] = state
    if district: q["district"] = district
    docs = await db.colleges.find(q, {"_id": 0}).to_list(500)
    return docs


@api_router.get("/hazards")
async def list_hazards(state: Optional[str] = None, district: Optional[str] = None):
    q = {}
    if state: q["state"] = state
    if district: q["district"] = district
    docs = await db.hazard_zones.find(q, {"_id": 0}).to_list(500)
    return docs


@api_router.get("/campus-contacts")
async def list_campus_contacts(college_id: Optional[str] = None, include_inactive: bool = False):
    q = {}
    if college_id: q["college_id"] = college_id
    if not include_inactive: q["is_active"] = {"$ne": False}
    docs = await db.campus_contacts.find(q, {"_id": 0}).to_list(500)
    return docs


def _require_campus_admin(actor_role: Optional[str]):
    if actor_role not in ("coordinator", "admin"):
        raise HTTPException(403, "Only campus coordinator or admin can modify contacts")


@api_router.post("/campus-contacts", response_model=CampusContact)
async def create_campus_contact(contact: CampusContact, x_campus_role: Optional[str] = Header(None)):
    _require_campus_admin(x_campus_role)
    contact.updated_at = now_iso()
    await db.campus_contacts.insert_one(contact.model_dump())
    return contact


@api_router.patch("/campus-contacts/{contact_id}")
async def update_campus_contact(contact_id: str, update: CampusContactUpdate, x_campus_role: Optional[str] = Header(None)):
    _require_campus_admin(x_campus_role)
    upd = {k: v for k, v in update.model_dump().items() if v is not None}
    if not upd:
        raise HTTPException(400, "No fields to update")
    upd["updated_at"] = now_iso()
    res = await db.campus_contacts.update_one({"id": contact_id}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(404, "Contact not found")
    doc = await db.campus_contacts.find_one({"id": contact_id}, {"_id": 0})
    return doc


@api_router.delete("/campus-contacts/{contact_id}")
async def delete_campus_contact(contact_id: str, hard: bool = False, x_campus_role: Optional[str] = Header(None)):
    _require_campus_admin(x_campus_role)
    if hard:
        res = await db.campus_contacts.delete_one({"id": contact_id})
        if res.deleted_count == 0:
            raise HTTPException(404, "Contact not found")
        return {"deleted": True}
    # soft delete
    res = await db.campus_contacts.update_one({"id": contact_id}, {"$set": {"is_active": False, "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(404, "Contact not found")
    return {"deactivated": True}


# ---- SOS ----
@api_router.post("/sos", response_model=SOS)
async def create_sos(payload: SOSCreate):
    sos = SOS(**payload.model_dump())
    await db.sos_queue.insert_one(sos.model_dump())
    # Emit notifications
    op_notif = Notification(target_role="operator", related_sos_id=sos.id,
                            message_title=f"New SOS: {sos.citizen_name}",
                            message_body=f"{sos.hazard_type.upper()} in {sos.district}, {sos.state}",
                            notification_type="critical", delivery_channel="in_app",
                            delivery_status="sent").model_dump()
    await db.notifications.insert_one(op_notif)
    if sos.linked_college_id:
        c_notif = Notification(target_role="campus", target_entity_id=sos.linked_college_id,
                               related_sos_id=sos.id, message_title=f"Campus alert: {sos.citizen_name}",
                               message_body=f"SOS near linked campus - {sos.hazard_type}",
                               notification_type="critical", delivery_channel="in_app",
                               delivery_status="sent").model_dump()
        await db.notifications.insert_one(c_notif)
    return sos


@api_router.get("/sos")
async def list_sos(state: Optional[str] = None, district: Optional[str] = None,
                    status: Optional[str] = None, college_id: Optional[str] = None,
                    since: Optional[str] = None, limit: int = 100):
    q = {}
    if state: q["state"] = state
    if district: q["district"] = district
    if status: q["status"] = status
    if college_id: q["linked_college_id"] = college_id
    if since: q["created_at"] = {"$gt": since}
    docs = await db.sos_queue.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.get("/sos/{sos_id}")
async def get_sos(sos_id: str):
    doc = await db.sos_queue.find_one({"id": sos_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "SOS not found")
    return doc


@api_router.patch("/sos/{sos_id}")
async def update_sos(sos_id: str, update: SOSUpdate):
    upd = {k: v for k, v in update.model_dump().items() if v is not None}
    if not upd:
        raise HTTPException(400, "No fields to update")
    res = await db.sos_queue.update_one({"id": sos_id}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(404, "SOS not found")
    doc = await db.sos_queue.find_one({"id": sos_id}, {"_id": 0})
    return doc


@api_router.delete("/sos/{sos_id}")
async def delete_sos(sos_id: str):
    await db.sos_queue.delete_one({"id": sos_id})
    return {"deleted": True}


# ---- Notifications ----
@api_router.get("/notifications")
async def list_notifications(target_role: Optional[str] = None,
                              target_entity_id: Optional[str] = None,
                              since: Optional[str] = None, limit: int = 100):
    q = {}
    if target_role: q["target_role"] = target_role
    if target_entity_id: q["target_entity_id"] = target_entity_id
    if since: q["created_at"] = {"$gt": since}
    docs = await db.notifications.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.post("/notifications", response_model=Notification)
async def create_notification(payload: NotificationCreate):
    notif = Notification(**payload.model_dump(), delivery_status="sent")
    await db.notifications.insert_one(notif.model_dump())
    return notif


# ---- Test dispatch (SMS/Call) - Mocked ----
@api_router.post("/dispatch/test")
async def test_dispatch(req: TestDispatchRequest):
    """Mocked SMS/Voice dispatch. Logs delivery status. Ready to swap with Twilio."""
    channel = req.channel
    if channel not in ("sms", "voice_call"):
        raise HTTPException(400, "Invalid channel")
    # Simulate: if phone starts with +91 assume delivered
    delivery_status = "sent" if req.phone and req.phone.startswith("+") else "failed"
    notif = Notification(
        target_role="campus" if req.college_id else "operator",
        target_entity_id=req.college_id,
        related_sos_id=req.sos_id,
        message_title=("CRITICAL CALL" if req.critical else "TEST") + f" -> {req.phone}",
        message_body=req.message or "Test alert",
        notification_type="critical" if req.critical else "info",
        delivery_channel=channel,
        delivery_status=delivery_status,
    )
    await db.notifications.insert_one(notif.model_dump())
    return {"delivery_status": delivery_status, "notification": notif.model_dump(), "provider": "mock"}


# ---- Stats ----
@api_router.get("/stats")
async def stats(state: Optional[str] = None, district: Optional[str] = None):
    q = {}
    if state: q["state"] = state
    if district: q["district"] = district
    shelters = await db.shelters.count_documents(q)
    hospitals = await db.hospitals.count_documents(q)
    colleges = await db.colleges.count_documents(q)
    hazards = await db.hazard_zones.count_documents(q)
    active_sos = await db.sos_queue.count_documents({**q, "status": {"$in": ["new", "acknowledged", "dispatched"]}})
    return {"shelters": shelters, "hospitals": hospitals, "colleges": colleges, "hazards": hazards, "active_sos": active_sos}


@api_router.get("/risk-heatmap")
async def risk_heatmap(state: Optional[str] = None):
    """Compute per-district predictive risk score by fusing hazard zones (rainfall/slope) + recent SOS density."""
    from datetime import timedelta
    q = {}
    if state: q["state"] = state
    hazards = await db.hazard_zones.find(q, {"_id": 0}).to_list(500)
    since = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    sos_recent = await db.sos_queue.find({**q, "created_at": {"$gte": since}}, {"_id": 0}).to_list(2000)
    # Aggregate per (state, district)
    agg: Dict[tuple, Dict[str, Any]] = {}
    LEVEL_SCORE = {"low": 2, "medium": 5, "high": 7, "severe": 10}
    for h in hazards:
        key = (h["state"], h["district"])
        rec = agg.setdefault(key, {
            "state": h["state"], "district": h["district"],
            "latitude": h["latitude"], "longitude": h["longitude"],
            "rainfall_mm": 0, "slope_movement_mm": 0, "hazard_types": [],
            "hazard_score": 0, "sos_count": 0
        })
        rj = h.get("rules_json") or {}
        rec["rainfall_mm"] = max(rec["rainfall_mm"], int(rj.get("rainfall_mm", 0) or 0))
        rec["slope_movement_mm"] = max(rec["slope_movement_mm"], int(rj.get("slope_movement_mm", 0) or 0))
        rec["hazard_types"].append(h["hazard_type"])
        rec["hazard_score"] = max(rec["hazard_score"], LEVEL_SCORE.get(h["risk_level"], 3))
    for s in sos_recent:
        key = (s.get("state"), s.get("district"))
        if key not in agg:
            agg[key] = {
                "state": s.get("state"), "district": s.get("district"),
                "latitude": s.get("latitude"), "longitude": s.get("longitude"),
                "rainfall_mm": 0, "slope_movement_mm": 0, "hazard_types": [],
                "hazard_score": 0, "sos_count": 0
            }
        agg[key]["sos_count"] += 1
    # Final score 0..10 = hazard_score*0.7 + min(sos_count*1.2, 3)
    out = []
    for rec in agg.values():
        density = min(rec["sos_count"] * 1.2, 3)
        score = round(min(10, rec["hazard_score"] * 0.7 + density), 1)
        level = "severe" if score >= 8 else "high" if score >= 6 else "medium" if score >= 3.5 else "low"
        out.append({**rec, "risk_score": score, "risk_level": level, "hazard_types": sorted(set(rec["hazard_types"]))})
    out.sort(key=lambda x: -x["risk_score"])
    return out


app.include_router(api_router)


# ================= AI DAMAGE ASSESSMENT =================
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent


def _extract_base64(s: str) -> str:
    if not s:
        return s
    if s.startswith("data:") and "," in s:
        return s.split(",", 1)[1]
    return s


@app.post("/api/damage-assess")
async def damage_assess(req: DamageAssessRequest):
    """Analyzes a disaster damage photo using Claude Sonnet 4.5 vision.
    Returns {severity_score, severity_level, hazard_type, damage_description, guidance_{en,ta,ml}}.
    """
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(500, "LLM key not configured")
    b64 = _extract_base64(req.image_base64)
    if not b64 or len(b64) < 100:
        raise HTTPException(400, "Invalid image")
    session_id = f"damage-{req.sos_id or uuid.uuid4().hex[:8]}"
    system = (
        "You are SentraSafe AI's disaster damage assessor for Kerala and Tamil Nadu, India. "
        "Given a photo of a scene during a flood or landslide, assess severity strictly as JSON. "
        "Return ONLY a compact JSON object with keys: severity_score (integer 0-10), "
        "severity_level (one of: minimal, moderate, severe, critical), "
        "hazard_type (flood|landslide|structural|medical|general), "
        "damage_description (<= 40 words, factual), "
        "guidance_en, guidance_ta, guidance_ml (each <= 30 words, safety-first actionable advice in English, Tamil, Malayalam). "
        "No prose outside JSON."
    )
    prompt = (
        f"Context: state={req.state or 'unknown'}, district={req.district or 'unknown'}, "
        f"reported hazard={req.hazard_type or 'general'}, notes={req.context or 'none'}. "
        "Assess the attached photo."
    )
    try:
        chat = LlmChat(api_key=key, session_id=session_id, system_message=system).with_model("anthropic", "claude-sonnet-4-5-20250929")
        img = ImageContent(image_base64=b64)
        response = await chat.send_message(UserMessage(text=prompt, file_contents=[img]))
        # Response is the full text
        raw = response if isinstance(response, str) else str(response)
        import json as _json, re
        m = re.search(r"\{.*\}", raw, re.S)
        data = _json.loads(m.group(0)) if m else {"severity_score": 5, "severity_level": "moderate", "hazard_type": req.hazard_type or "general", "damage_description": raw[:180], "guidance_en": "Move to higher ground and await rescue.", "guidance_ta": "உயரமான இடத்திற்கு நகர்ந்து மீட்பு குழுவை எதிர்பார்க்கவும்.", "guidance_ml": "ഉയർന്ന സ്ഥലത്തേക്ക് നീങ്ങി രക്ഷാ സംഘത്തെ കാത്തിരിക്കുക."}
        # Detect mime from data url
        mime = "image/jpeg"
        if req.image_base64 and req.image_base64.startswith("data:"):
            try:
                mime = req.image_base64.split(";", 1)[0].split(":", 1)[1]
            except Exception:
                mime = "image/jpeg"
        aid = str(uuid.uuid4())
        photo_url = req.mirror_url or f"/api/damage-photo/{aid}"
        doc = {
            "id": aid,
            "sos_id": req.sos_id,
            "created_at": now_iso(),
            "state": req.state, "district": req.district,
            "photo_base64": b64,
            "photo_mime": mime,
            "photo_url": photo_url,
            **data,
        }
        await db.damage_assessments.insert_one(doc)
        if req.sos_id:
            await db.sos_queue.update_one({"id": req.sos_id}, {"$set": {
                "ai_severity": data.get("severity_score"),
                "ai_severity_level": data.get("severity_level"),
                "ai_hazard_type": data.get("hazard_type"),
                "ai_description": data.get("damage_description"),
                "ai_guidance_en": data.get("guidance_en"),
                "photo_url": photo_url,
            }})
        # Strip photo_base64 from response to keep payload small
        out = {k: v for k, v in doc.items() if k not in ("photo_base64", "_id")}
        return out
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("damage_assess failed")
        raise HTTPException(500, f"Assessment failed: {str(e)[:200]}")


from fastapi.responses import Response as FastResponse


@app.get("/api/damage-photo/{assessment_id}")
async def get_damage_photo(assessment_id: str):
    doc = await db.damage_assessments.find_one({"id": assessment_id}, {"_id": 0, "photo_base64": 1, "photo_mime": 1})
    if not doc or not doc.get("photo_base64"):
        raise HTTPException(404, "Photo not found")
    import base64 as _b64
    data = _b64.b64decode(doc["photo_base64"])
    return FastResponse(content=data, media_type=doc.get("photo_mime") or "image/jpeg", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/api/admin/overview")
async def admin_overview(email: Optional[str] = Header(None, alias="X-Owner-Email"), state: Optional[str] = None):
    if email != "symonsaniya@gmail.com":
        raise HTTPException(403, "Owner only")
    q = {}
    if state: q["state"] = state
    colleges = await db.colleges.find(q, {"_id": 0}).sort("state", 1).to_list(500)
    contacts = await db.campus_contacts.find({}, {"_id": 0}).to_list(2000)
    sos = await db.sos_queue.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    assessments = await db.damage_assessments.find({}, {"_id": 0, "photo_base64": 0}).sort("created_at", -1).to_list(500)
    stats = {
        "total_colleges": len(colleges),
        "total_contacts": len(contacts),
        "total_sos": len(sos),
        "active_sos": len([s for s in sos if s.get("status") in ("new", "acknowledged", "dispatched")]),
        "assessments": len(assessments),
    }
    return {"stats": stats, "colleges": colleges, "contacts": contacts, "sos": sos, "assessments": assessments}


@app.get("/api/damage-assessments")
async def list_damage(sos_id: Optional[str] = None, limit: int = 50):
    q = {}
    if sos_id: q["sos_id"] = sos_id
    docs = await db.damage_assessments.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs

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
