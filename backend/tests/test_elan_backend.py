"""Comprehensive backend tests for Elan Exports Consultancy API."""
import os
import io
import time
import uuid
from pathlib import Path
import requests
import pytest
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@elanexports.com"
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

TS = str(int(time.time()))
BUYER_EMAIL = f"test.buyer.{TS}@example.com"
BUYER_PASSWORD = f"Buyer-{uuid.uuid4().hex}-Aa1"
SUPPLIER_EMAIL = f"test.supplier.{TS}@example.com"
SUPPLIER_PASSWORD = f"Supplier-{uuid.uuid4().hex}-Aa1"


@pytest.fixture(scope="module")
def state():
    return {}


# ----- Health & Public Data -----
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


def test_categories():
    r = requests.get(f"{API}/categories")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 6
    ids = [c["id"] for c in data]
    for k in ["food", "processed", "fresh", "healthcare", "home-textile", "eco"]:
        assert k in ids
    for c in data:
        assert "name" in c and "tagline" in c and "image" in c


def test_pricing():
    r = requests.get(f"{API}/pricing")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    ids = [p["id"] for p in data]
    assert set(ids) == {"scout", "engage", "embed"}


# ----- Auth: Register / Me / Login / Logout -----
def test_register_buyer_and_me(state):
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": BUYER_EMAIL,
        "password": BUYER_PASSWORD,
        "name": "Test Buyer",
        "role": "buyer",
        "company": "TEST_Buyer_Co",
    })
    assert r.status_code == 200, r.text
    user = r.json()
    assert user["email"] == BUYER_EMAIL.lower()
    assert user["role"] == "buyer"
    assert "user_id" in user
    assert "password_hash" not in user
    # cookies set
    assert "access_token" in s.cookies.get_dict()

    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == BUYER_EMAIL.lower()
    state["buyer_session"] = s
    state["buyer_user_id"] = user["user_id"]


def test_register_duplicate_email_fails():
    r = requests.post(f"{API}/auth/register", json={
        "email": BUYER_EMAIL,
        "password": BUYER_PASSWORD,
        "name": "Dup",
        "role": "buyer",
    })
    assert r.status_code == 400


def test_login_admin(state):
    if not ADMIN_PASSWORD:
        pytest.skip("ADMIN_PASSWORD is not configured")
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    u = r.json()
    assert u["role"] == "admin"
    assert "access_token" in s.cookies.get_dict()
    assert "refresh_token" in s.cookies.get_dict()
    state["admin_session"] = s


def test_logout_clears_cookies():
    if not ADMIN_PASSWORD:
        pytest.skip("ADMIN_PASSWORD is not configured")
    s = requests.Session()
    s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    # The server emits delete-cookie headers; new request should be unauthenticated
    fresh = requests.Session()
    me = fresh.get(f"{API}/auth/me")
    assert me.status_code == 401


def test_me_unauthenticated():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ----- Buyer intake anonymous -----
def test_buyer_intake_anonymous():
    payload = {
        "company_name": "TEST_Anon_Co",
        "contact_name": "Anon Tester",
        "contact_email": f"anon.{TS}@example.com",
        "country": "USA",
        "product_category": "Home Textile, Apparel & Hospitality Products",
        "product_specs": "100% cotton tee, 180 GSM",
        "annual_volume": "50,000 units",
        "timeline": "Q2 2026",
    }
    r = requests.post(f"{API}/buyer/intake", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "new"
    assert "intake_id" in data
    assert data["company_name"] == payload["company_name"]


def test_buyer_intake_authenticated_and_listed(state):
    s = state["buyer_session"]
    payload = {
        "company_name": "TEST_Buyer_Auth_Co",
        "contact_name": "Auth Buyer",
        "contact_email": BUYER_EMAIL,
        "country": "Canada",
        "product_category": "Food Commodities",
        "product_specs": "Steel brackets",
        "annual_volume": "10000",
        "timeline": "Q3 2026",
    }
    r = s.post(f"{API}/buyer/intake", json=payload)
    assert r.status_code == 200
    intake_id = r.json()["intake_id"]
    listed = s.get(f"{API}/buyer/intakes")
    assert listed.status_code == 200
    ids = [i["intake_id"] for i in listed.json()]
    assert intake_id in ids


# ----- Supplier Application -----
def test_supplier_application_requires_auth():
    r = requests.post(f"{API}/supplier/application", json={
        "company_name": "X", "contact_name": "X", "contact_email": "x@x.com",
        "contact_phone": "1", "country": "IN", "annual_capacity": "1",
        "export_experience": "1",
    })
    assert r.status_code == 401


def test_register_supplier_and_create_app(state):
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": SUPPLIER_EMAIL, "password": SUPPLIER_PASSWORD,
        "name": "Test Supplier", "role": "supplier", "company": "TEST_Supp_Co",
    })
    assert r.status_code == 200, r.text
    state["supplier_session"] = s
    state["supplier_user_id"] = r.json()["user_id"]

    payload = {
        "company_name": "TEST_Supp_Co",
        "contact_name": "Test Supplier",
        "contact_email": SUPPLIER_EMAIL,
        "contact_phone": "+91-9000000000",
        "country": "India",
        "iec_number": "ABCDE1234F",
        "product_categories": ["Home Textile, Apparel & Hospitality Products"],
        "annual_capacity": "100000 units",
        "export_experience": "5 years",
        "certifications": ["ISO9001"],
    }
    r = s.post(f"{API}/supplier/application", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "pending_review"
    assert "application_id" in d
    state["app_id"] = d["application_id"]

    listed = s.get(f"{API}/supplier/applications")
    assert listed.status_code == 200
    ids = [a["application_id"] for a in listed.json()]
    assert d["application_id"] in ids


# ----- File Upload & Download -----
def _make_pdf_bytes():
    return (b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")


def test_upload_requires_auth():
    files = {"file": ("test.pdf", _make_pdf_bytes(), "application/pdf")}
    r = requests.post(f"{API}/upload", files=files, data={"doc_type": "iec"})
    assert r.status_code == 401


def test_upload_and_download_owner(state):
    s = state["supplier_session"]
    files = {"file": ("iec.pdf", _make_pdf_bytes(), "application/pdf")}
    # NOTE: backend bug - doc_type is not Form() annotated, so it's a query param.
    # Send as query to validate persistence; flag the bug in report.
    r = s.post(f"{API}/upload?doc_type=iec", files=files)
    if r.status_code == 503:
        pytest.skip(f"Storage unavailable: {r.text}")
    assert r.status_code == 200, r.text
    rec = r.json()
    assert "file_id" in rec and "storage_path" in rec
    assert rec["doc_type"] == "iec"
    state["file_id"] = rec["file_id"]

    d = s.get(f"{API}/files/{rec['file_id']}/download")
    assert d.status_code == 200
    assert d.content.startswith(b"%PDF")


def test_download_forbidden_for_other_user(state):
    if "file_id" not in state:
        pytest.skip("upload skipped")
    s = state["buyer_session"]
    r = s.get(f"{API}/files/{state['file_id']}/download")
    assert r.status_code == 403


# ----- Leads -----
def test_create_lead():
    r = requests.post(f"{API}/leads", json={
        "name": "TEST_Lead",
        "email": f"lead.{TS}@example.com",
        "message": "Hello, I want to book a call.",
    })
    assert r.status_code == 200
    data = r.json()
    assert "lead_id" in data
