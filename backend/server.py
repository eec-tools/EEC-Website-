from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
import requests
import boto3
import smtplib
from email.message import EmailMessage
from botocore.config import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Header, Query, Depends
from fastapi.responses import Response as FastResponse, RedirectResponse, FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, field_validator

# ============ Configuration ============
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "elan-exports-v2")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@eectrade.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# AWS S3 — read strictly from environment (never hardcoded)
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME")
AWS_REGION = os.environ.get("AWS_REGION")
LOCAL_UPLOAD_DIR = ROOT_DIR / "uploads"
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "0") == "1"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3001")
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USERNAME or "no-reply@eectrade.com")

SOURCING_CATEGORIES = [
    "Food Commodities",
    "Processed & Packaged Foods",
    "Fresh & Agricultural Products",
    "Healthcare & Hospital Textile Supplies",
    "Home Textile, Apparel & Hospitality Products",
    "Eco-Friendly, Sustainable & Organic Products",
]

CATEGORY_RECORDS = [
    {
        "id": "food",
        "anchor": "food-commodities",
        "name": "Food Commodities",
        "tagline": "Rice, sugar, pulses, edible oils, spices.",
        "image": "/images/categories/food-commodities.jpg",
        "cta": "Source food commodities",
        "alt": "Rice, spices, pulses, edible oils and whole spices laid out for food commodity sourcing",
        # NOTE: EU Health Certificate and Rainforest Alliance don't map cleanly to an existing category (most
        # relevant to frozen food / dried fruit sub-segments). Folded into Food Commodities for now — flag for
        # manual review on whether these warrant their own category longer-term.
        "body": "EEC sources rice, sugar, pulses, edible oils and spices from manufacturers screened for FSSAI registration, BRC/BRCGS and amfori BSCI certification. HACCP certification is screened as a baseline requirement, with Aflatoxin testing reports, EU Health Certificates and Rainforest Alliance certification coordinated where required by the destination market.",
    },
    {
        "id": "processed",
        "anchor": "processed-packaged-foods",
        "name": "Processed & Packaged Foods",
        "tagline": "Snacks, beverages, frozen foods, ready meals.",
        "image": "/images/categories/processed-packaged-foods.jpg",
        "cta": "Source processed foods",
        "alt": "Assorted packaged snacks and confectionery bars for processed and packaged food sourcing",
        "body": "EEC sources snacks, beverages, frozen foods and ready meals from manufacturers screened for BRC/BRCGS, FSSC 22000 and amfori BSCI certification. IFS Food certification is required for suppliers serving German and French buyers, with Aflatoxin testing reports coordinated where required.",
    },
    {
        "id": "fresh",
        "anchor": "fresh-agricultural",
        "name": "Fresh & Agricultural Products",
        "tagline": "Fruits, vegetables, organic produce.",
        "image": "/images/categories/fresh-agricultural-products.jpg",
        "cta": "Source fresh produce",
        "alt": "Crates of fresh fruits, vegetables and organic produce including peppers, tomatoes, carrots and greens",
        "body": "EEC sources fruits, vegetables and organic produce from farms screened for GlobalG.A.P., GRASP and amfori BSCI certification. Phytosanitary certificates and MRL testing reports are coordinated where required by the destination market.",
    },
    {
        "id": "healthcare",
        "anchor": "healthcare-hospital",
        "name": "Healthcare and Hospital Textile Supplies",
        "tagline": "Patient gowns, scrubs, surgical drapes, hospital bed linen, institutional uniforms.",
        "image": "/images/categories/healthcare-hospital-textiles.jpg",
        "cta": "Source healthcare textiles",
        "alt": "Hospital gowns, scrubs, PPE, bed linen, towels and institutional uniforms in blue and teal",
        "body": "EEC sources hospital textiles, PPE, medical linen and non-regulated consumables from manufacturers screened for ISO 9001, OEKO-TEX Standard 100 and BSCI compliance. Medical devices, pharmaceuticals and regulated clinical products are outside EEC scope.",
    },
    {
        "id": "home-textile",
        "anchor": "home-textile-hospitality",
        "name": "Home Textile, Apparel & Hospitality Products",
        "tagline": "Bed linen, towels, uniforms, hotel amenities.",
        "image": "/images/categories/home-textile-apparel-hospitality.jpg",
        "cta": "Source home textiles",
        "alt": "Bed linen, towels, uniforms and hotel amenities for home textile and hospitality sourcing",
        "body": "EEC sources bed linen, towels, uniforms and hotel amenities from manufacturers screened for BSCI and/or SEDEX audit compliance. GOTS and OEKO-TEX STEP certification is available for organic and sustainable textile requirements.",
    },
    {
        "id": "eco",
        "anchor": "eco-friendly-sustainable",
        "name": "Eco-Friendly, Sustainable & Organic Products",
        "tagline": "Biodegradable packaging, organic textiles, green alternatives.",
        "image": "/images/categories/eco-friendly-sustainable-organic.jpg",
        "cta": "Source eco-friendly products",
        "alt": "Biodegradable packaging, organic textiles and green alternative products",
        "body": "EEC sources biodegradable packaging, organic textiles and green alternatives from manufacturers screened for GOTS certification and EU Organic / NPOP equivalence.",
    },
]

ENGAGEMENT_TIERS = [
    {
        "id": "scout",
        "name": "Scout",
        "price": "Discovery call",
        "cadence": "One-time engagement",
        "tagline": "Ideal for businesses seeking new sourcing opportunities or evaluating potential manufacturers.",
        "features": [
            "Supplier identification",
            "Initial supplier qualification",
            "Manufacturer profiling",
            "Market insights",
            "Sourcing landscape report with supplier recommendations for buyer review",
        ],
        "cta": "Request Scout brief",
    },
    {
        "id": "engage",
        "name": "Engage",
        "price": "Tailored",
        "cadence": "Per sourcing project",
        "tagline": "End-to-end sourcing with negotiated terms.",
        "popular": True,
        "features": [
            "Full sourcing brief deployment and RFQ to qualified bench",
            "Up to 10 qualified suppliers, 3 in-depth factory assessments (on-ground or documentary based on category and geography)",
            "On-ground factory visit at one location",
            "Negotiated MOQ, payment terms and lead times",
            "Sample QC and third-party AQL pre-shipment inspection",
            "Open-book landed cost and duty optimisation",
        ],
        "cta": "Submit a sourcing brief",
    },
    {
        "id": "embed",
        "name": "Embed",
        "price": "Custom",
        "cadence": "Quarterly retainer",
        "tagline": "For organisations seeking ongoing sourcing support across multiple categories, suppliers or destination markets including Europe, the US, the Middle East and Asia.",
        "features": [
            "Dedicated sourcing support",
            "Multi supplier management",
            "Procurement planning",
            "Supply chain collaboration",
            "Long term sourcing partnership",
        ],
        "cta": "Book a free discovery call",
    },
]

# MongoDB / local fallback
class _InMemoryResult:
    def __init__(self, **data):
        self.__dict__.update(data)


class _InMemoryCursor:
    def __init__(self, documents):
        self._documents = documents

    def sort(self, key, direction):
        reverse = direction == -1
        self._documents.sort(key=lambda doc: doc.get(key), reverse=reverse)
        return self

    async def to_list(self, length):
        return self._documents[:length]


def _matches_filter(document, query):
    for key, value in (query or {}).items():
        if isinstance(value, dict) and "$in" in value:
            if document.get(key) not in value["$in"]:
                return False
        elif document.get(key) != value:
            return False
    return True


def _apply_projection(document, projection):
    if not projection:
        return document.copy()
    include_keys = {key for key, value in projection.items() if value and key != "_id"}
    exclude_keys = {key for key, value in projection.items() if not value}
    if include_keys:
        result = {key: document.get(key) for key in include_keys if key in document}
        if projection.get("_id", 1):
            result["_id"] = document.get("_id")
        return result
    result = document.copy()
    for key in exclude_keys:
        result.pop(key, None)
    return result


class _InMemoryCollection:
    def __init__(self):
        self._documents = []

    async def create_index(self, *args, **kwargs):
        return None

    async def insert_one(self, document):
        self._documents.append(document.copy())
        return _InMemoryResult(inserted_id=document.get("_id", len(self._documents)))

    async def find_one(self, query, projection=None):
        for document in self._documents:
            if _matches_filter(document, query):
                return _apply_projection(document, projection)
        return None

    def find(self, query=None, projection=None):
        documents = [
            _apply_projection(document, projection)
            for document in self._documents
            if _matches_filter(document, query or {})
        ]
        return _InMemoryCursor(documents)

    async def update_one(self, query, update):
        for document in self._documents:
            if _matches_filter(document, query):
                set_data = update.get("$set", {})
                document.update(set_data)
                return _InMemoryResult(matched_count=1, modified_count=1)
        return _InMemoryResult(matched_count=0, modified_count=0)

    async def delete_one(self, query):
        for index, document in enumerate(self._documents):
            if _matches_filter(document, query):
                self._documents.pop(index)
                return _InMemoryResult(deleted_count=1)
        return _InMemoryResult(deleted_count=0)

    async def delete_many(self, query):
        kept = []
        deleted = 0
        for document in self._documents:
            if _matches_filter(document, query):
                deleted += 1
            else:
                kept.append(document)
        self._documents = kept
        return _InMemoryResult(deleted_count=deleted)


class _InMemoryDatabase:
    def __init__(self):
        self.users = _InMemoryCollection()
        self.user_sessions = _InMemoryCollection()
        self.files = _InMemoryCollection()
        self.buyer_intakes = _InMemoryCollection()
        self.supplier_applications = _InMemoryCollection()
        self.leads = _InMemoryCollection()
        self.password_reset_tokens = _InMemoryCollection()


client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=1000,
    connectTimeoutMS=1000,
    socketTimeoutMS=1000,
)
db = client[DB_NAME]
use_in_memory_db = os.environ.get("USE_IN_MEMORY_DB", "1") != "0"

# S3 client (lazy-initialized; reused across requests)
s3_client = None

# ============ Logging ============
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ============ App ============
app = FastAPI(title="Elan Exports Consultancy API")
api_router = APIRouter(prefix="/api")


# ============ Helpers - Password & JWT ============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60 * 24),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token", value=access_token, httponly=True, secure=COOKIE_SECURE,
        samesite="none", max_age=60 * 60 * 24, path="/",
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True, secure=COOKIE_SECURE,
        samesite="none", max_age=60 * 60 * 24 * 7, path="/",
    )


def set_session_cookie(response: Response, session_token: str):
    response.set_cookie(
        key="session_token", value=session_token, httponly=True, secure=COOKIE_SECURE,
        samesite="none", max_age=60 * 60 * 24 * 7, path="/",
    )


async def get_current_user(request: Request) -> dict:
    """Resolve user from JWT cookie/header OR Emergent session_token."""
    # Try JWT access_token
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") == "access":
                user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
                if user:
                    return user
        except jwt.PyJWTError:
            pass

    # Try Google session_token
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at >= datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
                if user:
                    return user

    raise HTTPException(status_code=401, detail="Not authenticated")


# ============ Object Storage (AWS S3) ============
def init_storage() -> bool:
    """Initialize the boto3 S3 client once and reuse. Returns True if usable."""
    global s3_client
    if s3_client is not None:
        return True
    if not (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET_NAME and AWS_REGION):
        logger.warning("AWS S3 env vars not fully set; storage disabled")
        return False
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
            endpoint_url=f"https://s3.{AWS_REGION}.amazonaws.com",
            config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )
        logger.info(f"AWS S3 client initialized (bucket={AWS_S3_BUCKET_NAME}, region={AWS_REGION})")
        return True
    except Exception as e:
        logger.error(f"AWS S3 init failed: {e}")
        s3_client = None
        return False


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload bytes to S3 at key=path. Returns {path, size, etag}."""
    if not init_storage():
        local_path = LOCAL_UPLOAD_DIR / path
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(data)
        logger.info(f"Stored upload locally at {local_path}")
        return {
            "path": f"local://{path}",
            "size": len(data),
            "etag": str(uuid.uuid5(uuid.NAMESPACE_URL, path)),
            "provider": "local",
        }
    try:
        resp = s3_client.put_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=path,
            Body=data,
            ContentType=content_type or "application/octet-stream",
        )
        return {
            "path": path,
            "size": len(data),
            "etag": (resp.get("ETag") or "").strip('"'),
            "provider": "s3",
        }
    except (BotoCoreError, ClientError) as e:
        logger.error(f"S3 put_object failed for {path}: {e}")
        raise HTTPException(status_code=502, detail="Upload to storage failed")


def get_object(path: str) -> tuple:
    """Download object from S3. Returns (bytes, content_type). Kept for admin/internal use."""
    if path.startswith("local://"):
        local_path = LOCAL_UPLOAD_DIR / path.removeprefix("local://")
        if not local_path.exists():
            raise HTTPException(status_code=404, detail="File not found in storage")
        return local_path.read_bytes(), "application/octet-stream"
    if not init_storage():
        raise HTTPException(status_code=503, detail="Storage not available")
    try:
        resp = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=path)
        body = resp["Body"].read()
        ct = resp.get("ContentType") or "application/octet-stream"
        return body, ct
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("NoSuchKey", "404"):
            raise HTTPException(status_code=404, detail="File not found in storage")
        logger.error(f"S3 get_object failed for {path}: {e}")
        raise HTTPException(status_code=502, detail="Download from storage failed")
    except BotoCoreError as e:
        logger.error(f"S3 get_object error for {path}: {e}")
        raise HTTPException(status_code=502, detail="Download from storage failed")


def generate_presigned_get_url(path: str, original_filename: Optional[str] = None,
                                content_type: Optional[str] = None,
                                expires_in: int = 3600) -> str:
    """Generate a presigned S3 GET URL so the browser downloads directly from S3.
    expires_in is in seconds (default 1 hour)."""
    if path.startswith("local://"):
        raise HTTPException(status_code=400, detail="Local files are served through the API")
    if not init_storage():
        raise HTTPException(status_code=503, detail="Storage not available")
    params = {"Bucket": AWS_S3_BUCKET_NAME, "Key": path}
    if original_filename:
        # Force browser to download with the original filename
        params["ResponseContentDisposition"] = f'attachment; filename="{original_filename}"'
    if content_type:
        params["ResponseContentType"] = content_type
    try:
        return s3_client.generate_presigned_url(
            "get_object", Params=params, ExpiresIn=expires_in,
        )
    except (BotoCoreError, ClientError) as e:
        logger.error(f"S3 presigned URL generation failed for {path}: {e}")
        raise HTTPException(status_code=502, detail="Could not generate download URL")


def send_password_reset_email(email: str, token: str) -> bool:
    """Send reset instructions when SMTP is configured; otherwise log safely."""
    reset_url = f"{FRONTEND_URL.rstrip('/')}/login?reset_token={token}"
    if not SMTP_HOST:
        logger.info("Password reset requested for %s; SMTP is not configured", email)
        return False

    message = EmailMessage()
    message["Subject"] = "Reset your EEC portal password"
    message["From"] = SMTP_FROM
    message["To"] = email
    message.set_content(
        "A password reset was requested for your EEC portal account.\n\n"
        f"Use this link to reset your password: {reset_url}\n\n"
        "This link expires in 30 minutes. If you did not request this, you can ignore this email."
    )

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
            smtp.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
        return True
    except Exception as e:
        logger.error("Password reset email failed for %s: %s", email, e)
        return False


# ============ Models ============
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    role: str = Field(default="buyer")  # buyer | supplier
    company: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in ("buyer", "supplier"):
            raise ValueError("Role must be buyer or supplier")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=8)


class UserPublic(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    company: Optional[str] = None
    picture: Optional[str] = None
    auth_provider: str = "local"


class BuyerIntakeCreate(BaseModel):
    company_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    country: str
    product_category: str
    product_specs: str
    annual_volume: str
    target_price: Optional[str] = None
    timeline: str
    pain_points: Optional[str] = None
    additional_notes: Optional[str] = None

    @field_validator("product_category")
    @classmethod
    def validate_product_category(cls, value: str) -> str:
        if value not in SOURCING_CATEGORIES and value != "Other":
            raise ValueError("Invalid product category")
        return value


class SupplierApplicationCreate(BaseModel):
    company_name: str
    headquarters_address: Optional[str] = None
    year_established: Optional[str] = None
    contact_name: str
    contact_position: Optional[str] = None
    contact_email: EmailStr
    contact_phone: str
    additional_contact_name: Optional[str] = None
    additional_contact_position: Optional[str] = None
    additional_contact_email: Optional[str] = None
    additional_contact_phone: Optional[str] = None
    country: str
    state: Optional[str] = None
    iec_number: Optional[str] = None
    gst_number: Optional[str] = None
    company_overview: Optional[str] = None
    annual_revenue: Optional[str] = None
    key_markets: Optional[str] = None
    notable_clients: Optional[str] = None
    case_studies: Optional[str] = None
    languages_spoken: Optional[str] = None
    preferred_communication: Optional[str] = None
    special_capabilities: Optional[str] = None
    product_categories: List[str] = Field(default_factory=list, min_length=1)
    product_description: Optional[str] = None
    annual_capacity: str
    export_experience: str
    certifications: List[str] = Field(default_factory=list)
    factory_size: Optional[str] = None
    factory_locations: Optional[str] = None
    employee_count: Optional[str] = None
    website: Optional[str] = None
    documents: List[dict] = Field(default_factory=list)  # [{path, original_filename, doc_type}]
    notes: Optional[str] = None

    @field_validator("product_categories")
    @classmethod
    def validate_product_categories(cls, values: List[str]) -> List[str]:
        invalid = [value for value in values if value not in SOURCING_CATEGORIES]
        if invalid:
            raise ValueError(f"Invalid product categories: {', '.join(invalid)}")
        return values


class ContactLeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    message: str
    source: str = "contact"  # contact | book_call | apply_network


# ============ Routes - Health ============
@api_router.get("/")
async def root():
    return {"status": "ok", "service": "Elan Exports Consultancy API"}


# ============ Routes - Auth (JWT) ============
@api_router.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.role not in ("buyer", "supplier"):
        raise HTTPException(status_code=400, detail="Invalid role")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": payload.role,
        "company": payload.company,
        "picture": None,
        "auth_provider": "local",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)

    access = create_access_token(user_id, email, payload.role)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return doc


@api_router.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(user["user_id"], email, user.get("role", "buyer"))
    refresh = create_refresh_token(user["user_id"])
    set_auth_cookies(response, access, refresh)

    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@api_router.post("/auth/password/reset-request")
async def password_reset_request(payload: PasswordResetRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})

    if user and user.get("auth_provider", "local") == "local":
        token = uuid.uuid4().hex + uuid.uuid4().hex
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user["user_id"],
            "email": email,
            "used": False,
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        send_password_reset_email(email, token)

    return {"ok": True, "message": "If an account exists, password reset instructions will be sent."}


@api_router.post("/auth/password/reset")
async def password_reset_confirm(payload: PasswordResetConfirm):
    token_doc = await db.password_reset_tokens.find_one({"token": payload.token, "used": False}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires_at = token_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    await db.users.update_one(
        {"user_id": token_doc["user_id"]},
        {"$set": {"password_hash": hash_password(payload.password)}},
    )
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"ok": True}


@api_router.post("/auth/logout")
async def logout(response: Response, request: Request):
    # Best-effort: delete session if present
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ============ Routes - Google OAuth ============
class SessionExchangeRequest(BaseModel):
    session_id: str
    role: Optional[str] = "buyer"


@api_router.post("/auth/google/session")
async def google_session(payload: SessionExchangeRequest, response: Response):
    """Exchange Emergent session_id for a session_token cookie."""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        resp = requests.get(
            EMERGENT_AUTH_SESSION_URL,
            headers={"X-Session-ID": payload.session_id},
            timeout=15,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Emergent session-data error: {e}")
        raise HTTPException(status_code=401, detail="Invalid session_id")

    data = resp.json()
    email = data.get("email", "").lower()
    name = data.get("name") or email
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Incomplete session data")

    # Upsert user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = payload.role if payload.role in ("buyer", "supplier") else "buyer"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "company": None,
            "picture": picture,
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        # update picture/name if missing
        updates = {}
        if not user.get("picture") and picture:
            updates["picture"] = picture
        if updates:
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
            user.update(updates)

    # Create session record
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    set_session_cookie(response, session_token)

    user.pop("_id", None)
    return user


# ============ Routes - File Upload ============
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), doc_type: str = "general",
                      user: dict = Depends(get_current_user)):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    allowed = {"pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed")

    user_id = user["user_id"]
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user_id}/{file_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")

    record = {
        "file_id": file_id,
        "user_id": user_id,
        "storage_path": result["path"],
        "storage_provider": result.get("provider", "s3"),
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "doc_type": doc_type,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.files.insert_one(record)
    record.pop("_id", None)
    return record


@api_router.get("/files/{file_id}/download")
async def download_file(file_id: str, request: Request, redirect: bool = True,
                        user: dict = Depends(get_current_user)):
    """Returns a presigned S3 GET URL (1 hour expiry).
    By default (redirect=True) issues a 302 redirect so the browser downloads
    directly from S3. Pass ?redirect=false to receive a JSON {url, expires_in}."""
    record = await db.files.find_one({"file_id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    if record["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    if record["storage_path"].startswith("local://"):
        raw_url = str(request.url_for("raw_file", file_id=file_id))
        if redirect:
            return RedirectResponse(url=raw_url, status_code=302)
        return {"url": raw_url, "expires_in": 3600, "file_id": file_id}

    presigned_url = generate_presigned_get_url(
        path=record["storage_path"],
        original_filename=record.get("original_filename"),
        content_type=record.get("content_type"),
        expires_in=3600,
    )
    if redirect:
        return RedirectResponse(url=presigned_url, status_code=302)
    return {"url": presigned_url, "expires_in": 3600, "file_id": file_id}


@api_router.get("/files/{file_id}/raw")
async def raw_file(file_id: str, user: dict = Depends(get_current_user)):
    record = await db.files.find_one({"file_id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    if record["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if not record["storage_path"].startswith("local://"):
        return RedirectResponse(
            url=generate_presigned_get_url(
                path=record["storage_path"],
                original_filename=record.get("original_filename"),
                content_type=record.get("content_type"),
                expires_in=3600,
            ),
            status_code=302,
        )

    local_path = LOCAL_UPLOAD_DIR / record["storage_path"].removeprefix("local://")
    if not local_path.exists():
        raise HTTPException(status_code=404, detail="File not found in storage")
    return FileResponse(
        local_path,
        media_type=record.get("content_type") or "application/octet-stream",
        filename=record.get("original_filename") or local_path.name,
    )


# ============ Routes - Buyer Intake ============
@api_router.post("/buyer/intake")
async def create_buyer_intake(payload: BuyerIntakeCreate, request: Request):
    intake_id = f"intake_{uuid.uuid4().hex[:12]}"
    user = None
    try:
        user = await get_current_user(request)
    except HTTPException:
        pass

    doc = payload.model_dump()
    doc.update({
        "intake_id": intake_id,
        "user_id": user["user_id"] if user else None,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.buyer_intakes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/buyer/intakes")
async def list_buyer_intakes(user: dict = Depends(get_current_user)):
    query = {} if user.get("role") == "admin" else {"user_id": user["user_id"]}
    items = await db.buyer_intakes.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


# ============ Routes - Admin ============
@api_router.get("/admin/users")
async def admin_list_users(current: dict = Depends(get_current_user)):
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    user_ids = [u["user_id"] for u in users]
    apps = await db.supplier_applications.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1}).to_list(2000)
    intakes = await db.buyer_intakes.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1}).to_list(2000)
    files = await db.files.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1}).to_list(5000)
    from collections import Counter
    app_counts = Counter(a["user_id"] for a in apps)
    intake_counts = Counter(i["user_id"] for i in intakes)
    file_counts = Counter(f["user_id"] for f in files)
    for u in users:
        uid = u["user_id"]
        u["supplier_applications"] = app_counts.get(uid, 0)
        u["buyer_intakes"] = intake_counts.get(uid, 0)
        u["files"] = file_counts.get(uid, 0)
    return users


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current: dict = Depends(get_current_user)):
    """Admin-only: permanently delete a user and all associated records (applications,
    intakes, files + S3 objects, sessions)."""
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if user_id == current.get("user_id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete another admin account")

    # Best-effort storage cleanup
    s3_deleted = 0
    local_deleted = 0
    files = await db.files.find({"user_id": user_id}, {"_id": 0, "storage_path": 1}).to_list(1000)
    for f in files:
        storage_path = f.get("storage_path", "")
        if storage_path.startswith("local://"):
            local_path = LOCAL_UPLOAD_DIR / storage_path.removeprefix("local://")
            try:
                if local_path.exists():
                    local_path.unlink()
                    local_deleted += 1
            except Exception as e:
                logger.warning(f"Local file delete failed for {storage_path}: {e}")
        elif init_storage():
            try:
                s3_client.delete_object(Bucket=AWS_S3_BUCKET_NAME, Key=storage_path)
                s3_deleted += 1
            except Exception as e:
                logger.warning(f"S3 delete failed for {storage_path}: {e}")

    res = {
        "user": (await db.users.delete_one({"user_id": user_id})).deleted_count,
        "supplier_applications": (await db.supplier_applications.delete_many({"user_id": user_id})).deleted_count,
        "buyer_intakes": (await db.buyer_intakes.delete_many({"user_id": user_id})).deleted_count,
        "files": (await db.files.delete_many({"user_id": user_id})).deleted_count,
        "sessions": (await db.user_sessions.delete_many({"user_id": user_id})).deleted_count,
        "s3_objects_deleted": s3_deleted,
        "local_files_deleted": local_deleted,
    }
    logger.info(f"Admin {current.get('email')} deleted user {user_id} ({target.get('email')}): {res}")
    return {"ok": True, "user_id": user_id, "deleted": res}


# ============ Routes - Supplier Application ============
@api_router.post("/supplier/application")
async def create_supplier_app(payload: SupplierApplicationCreate, user: dict = Depends(get_current_user)):
    app_id = f"sapp_{uuid.uuid4().hex[:12]}"
    doc = payload.model_dump()
    doc.update({
        "application_id": app_id,
        "user_id": user["user_id"],
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.supplier_applications.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/supplier/applications")
async def list_supplier_apps(user: dict = Depends(get_current_user)):
    query = {} if user.get("role") == "admin" else {"user_id": user["user_id"]}
    items = await db.supplier_applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


# ============ Routes - Contact Lead ============
@api_router.post("/leads")
async def create_lead(payload: ContactLeadCreate):
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    doc = payload.model_dump()
    doc.update({
        "lead_id": lead_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ============ Routes - Public Data ============
@api_router.get("/categories")
async def get_categories():
    return CATEGORY_RECORDS


@api_router.get("/pricing")
async def get_pricing():
    return ENGAGEMENT_TIERS


# ============ Startup ============
@app.on_event("startup")
async def on_startup():
    global db, use_in_memory_db

    if use_in_memory_db:
        logger.info("Using in-memory database for local development")
        db = _InMemoryDatabase()
    else:
        try:
            await client.admin.command("ping")
        except Exception as e:
            logger.warning(f"MongoDB unavailable, using in-memory fallback: {e}")
            db = _InMemoryDatabase()
            use_in_memory_db = True

    # Indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
        await db.files.create_index("file_id", unique=True)
        await db.buyer_intakes.create_index("intake_id", unique=True)
        await db.supplier_applications.create_index("application_id", unique=True)
        await db.password_reset_tokens.create_index("token", unique=True)
    except Exception as e:
        logger.error(f"Index creation error: {e}")

    # Seed admin
    try:
        if not ADMIN_PASSWORD:
            logger.warning("ADMIN_PASSWORD is not configured; skipping admin seed")
        else:
            existing = await db.users.find_one({"email": ADMIN_EMAIL})
            if not existing:
                await db.users.insert_one({
                    "user_id": f"user_{uuid.uuid4().hex[:12]}",
                    "email": ADMIN_EMAIL,
                    "password_hash": hash_password(ADMIN_PASSWORD),
                    "name": "EEC Admin",
                    "role": "admin",
                    "company": "Elan Exports Consultancy",
                    "picture": None,
                    "auth_provider": "local",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(f"Admin seeded: {ADMIN_EMAIL}")
            else:
                # Ensure the env-configured admin always has admin role + fresh password
                updates = {"role": "admin"}
                if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
                    updates["password_hash"] = hash_password(ADMIN_PASSWORD)
                await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": updates})
                logger.info(f"Admin record ensured: {ADMIN_EMAIL}")

            # Demote any legacy placeholder admin accounts so only the env-configured admin remains.
            legacy_admins = ["admin@elanexports.com"]
            for legacy in legacy_admins:
                if legacy == ADMIN_EMAIL:
                    continue
                result = await db.users.update_one(
                    {"email": legacy, "role": "admin"},
                    {"$set": {"role": "buyer"}},  # demote, don't delete (preserves audit trail)
                )
                if result.modified_count:
                    logger.info(f"Demoted legacy admin: {legacy} → buyer")
    except Exception as e:
        logger.error(f"Admin seed error: {e}")

    # Storage init
    init_storage()


@app.on_event("shutdown")
async def on_shutdown():
    if not use_in_memory_db:
        client.close()


# ============ Include Router & CORS ============
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"] if os.environ.get("CORS_ORIGINS", "*") == "*" else os.environ.get("CORS_ORIGINS").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
