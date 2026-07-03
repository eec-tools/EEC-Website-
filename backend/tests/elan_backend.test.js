// Comprehensive backend tests for Elan Exports Consultancy API.
// Ported 1:1 from the original Python/pytest suite (test_elan_backend.py), hitting a
// running server over real HTTP (not an in-process app), same as the original.
const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BASE_URL = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
const API = `${BASE_URL}/api`;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@eectrade.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const TS = String(Math.floor(Date.now() / 1000));
const BUYER_EMAIL = `test.buyer.${TS}@example.com`;
const BUYER_PASSWORD = `Buyer-${TS}-Aa1-secret`;
const SUPPLIER_EMAIL = `test.supplier.${TS}@example.com`;
const SUPPLIER_PASSWORD = `Supplier-${TS}-Aa1-secret`;

// Minimal cookie-jar wrapper — axios has no built-in cookie jar (unlike Python's
// requests.Session()), so each "session" tracks Set-Cookie values itself and
// replays them as a Cookie header on every subsequent request.
function createSession() {
  const jar = new Map();
  const client = axios.create({ baseURL: API, validateStatus: () => true });

  client.interceptors.request.use((cfg) => {
    if (jar.size) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    }
    return cfg;
  });
  client.interceptors.response.use((res) => {
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      for (const raw of setCookie) {
        const [pair] = raw.split(";");
        const idx = pair.indexOf("=");
        const name = pair.slice(0, idx);
        const value = pair.slice(idx + 1);
        jar.set(name, value);
      }
    }
    return res;
  });

  return { client, cookies: () => Object.fromEntries(jar) };
}

const state = {};

// ----- Health & Public Data -----
test("health", async () => {
  const r = await axios.get(`${API}/`, { validateStatus: () => true });
  assert.equal(r.status, 200);
  assert.equal(r.data.status, "ok");
});

test("categories", async () => {
  const r = await axios.get(`${API}/categories`, { validateStatus: () => true });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
  assert.equal(r.data.length, 6);
  const ids = r.data.map((c) => c.id);
  for (const k of ["food", "processed", "fresh", "healthcare", "home-textile", "eco"]) {
    assert.ok(ids.includes(k));
  }
  for (const c of r.data) {
    assert.ok("name" in c && "tagline" in c && "image" in c);
  }
});

test("pricing", async () => {
  const r = await axios.get(`${API}/pricing`, { validateStatus: () => true });
  assert.equal(r.status, 200);
  assert.equal(r.data.length, 3);
  const ids = new Set(r.data.map((p) => p.id));
  assert.deepEqual(ids, new Set(["scout", "engage", "embed"]));
});

// ----- Auth: Register / Me / Login / Logout -----
test("register buyer and me", async () => {
  const { client, cookies } = createSession();
  const r = await client.post("/auth/register", {
    email: BUYER_EMAIL,
    password: BUYER_PASSWORD,
    name: "Test Buyer",
    role: "buyer",
    company: "TEST_Buyer_Co",
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const user = r.data;
  assert.equal(user.email, BUYER_EMAIL.toLowerCase());
  assert.equal(user.role, "buyer");
  assert.ok("user_id" in user);
  assert.ok(!("password_hash" in user));
  assert.ok("access_token" in cookies());

  const me = await client.get("/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.data.email, BUYER_EMAIL.toLowerCase());

  state.buyerSession = client;
  state.buyerUserId = user.user_id;
});

test("register duplicate email fails", async () => {
  const r = await axios.post(
    `${API}/auth/register`,
    { email: BUYER_EMAIL, password: BUYER_PASSWORD, name: "Dup", role: "buyer" },
    { validateStatus: () => true }
  );
  assert.equal(r.status, 400);
});

test("login admin", { skip: !ADMIN_PASSWORD }, async () => {
  const { client, cookies } = createSession();
  const r = await client.post("/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.role, "admin");
  assert.ok("access_token" in cookies());
  assert.ok("refresh_token" in cookies());
  state.adminSession = client;
});

test("logout clears cookies", { skip: !ADMIN_PASSWORD }, async () => {
  const { client } = createSession();
  await client.post("/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const r = await client.post("/auth/logout");
  assert.equal(r.status, 200);

  const me = await axios.get(`${API}/auth/me`, { validateStatus: () => true });
  assert.equal(me.status, 401);
});

test("me unauthenticated", async () => {
  const r = await axios.get(`${API}/auth/me`, { validateStatus: () => true });
  assert.equal(r.status, 401);
});

// ----- Buyer intake anonymous -----
test("buyer intake anonymous", async () => {
  const payload = {
    company_name: "TEST_Anon_Co",
    contact_name: "Anon Tester",
    contact_email: `anon.${TS}@example.com`,
    country: "USA",
    product_category: "Home Textile, Apparel & Hospitality Products",
    product_specs: "100% cotton tee, 180 GSM",
    annual_volume: "50,000 units",
    timeline: "Q2 2026",
  };
  const r = await axios.post(`${API}/buyer/intake`, payload, { validateStatus: () => true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.status, "new");
  assert.ok("intake_id" in r.data);
  assert.equal(r.data.company_name, payload.company_name);
});

test("buyer intake authenticated and listed", async () => {
  const s = state.buyerSession;
  const payload = {
    company_name: "TEST_Buyer_Auth_Co",
    contact_name: "Auth Buyer",
    contact_email: BUYER_EMAIL,
    country: "Canada",
    product_category: "Food Commodities",
    product_specs: "Steel brackets",
    annual_volume: "10000",
    timeline: "Q3 2026",
  };
  const r = await s.post("/buyer/intake", payload);
  assert.equal(r.status, 200);
  const intakeId = r.data.intake_id;

  const listed = await s.get("/buyer/intakes");
  assert.equal(listed.status, 200);
  const ids = listed.data.map((i) => i.intake_id);
  assert.ok(ids.includes(intakeId));
});

// ----- Supplier Application -----
test("supplier application requires auth", async () => {
  const r = await axios.post(
    `${API}/supplier/application`,
    {
      company_name: "X",
      contact_name: "X",
      contact_email: "x@x.com",
      contact_phone: "1",
      country: "IN",
      annual_capacity: "1",
      export_experience: "1",
      product_categories: ["Food Commodities"],
    },
    { validateStatus: () => true }
  );
  assert.equal(r.status, 401);
});

test("register supplier and create app", async () => {
  const { client } = createSession();
  const r = await client.post("/auth/register", {
    email: SUPPLIER_EMAIL,
    password: SUPPLIER_PASSWORD,
    name: "Test Supplier",
    role: "supplier",
    company: "TEST_Supp_Co",
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  state.supplierSession = client;
  state.supplierUserId = r.data.user_id;

  const payload = {
    company_name: "TEST_Supp_Co",
    contact_name: "Test Supplier",
    contact_email: SUPPLIER_EMAIL,
    contact_phone: "+91-9000000000",
    country: "India",
    iec_number: "ABCDE1234F",
    product_categories: ["Home Textile, Apparel & Hospitality Products"],
    annual_capacity: "100000 units",
    export_experience: "5 years",
    certifications: ["ISO9001"],
  };
  const created = await client.post("/supplier/application", payload);
  assert.equal(created.status, 200, JSON.stringify(created.data));
  assert.equal(created.data.status, "pending_review");
  assert.ok("application_id" in created.data);
  state.appId = created.data.application_id;

  const listed = await client.get("/supplier/applications");
  assert.equal(listed.status, 200);
  const ids = listed.data.map((a) => a.application_id);
  assert.ok(ids.includes(created.data.application_id));
});

// ----- File Upload & Download -----
function makePdfBuffer() {
  return Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
}

function buildMultipartBody(fieldName, filename, contentType, buffer) {
  const boundary = `----elanTestBoundary${Date.now()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { body: Buffer.concat([head, buffer, tail]), boundary };
}

test("upload requires auth", async () => {
  const { body, boundary } = buildMultipartBody("file", "test.pdf", "application/pdf", makePdfBuffer());
  const r = await axios.post(`${API}/upload`, body, {
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    validateStatus: () => true,
  });
  assert.equal(r.status, 401);
});

test("upload and download owner", async () => {
  const s = state.supplierSession;
  const { body, boundary } = buildMultipartBody("file", "iec.pdf", "application/pdf", makePdfBuffer());

  // doc_type is a query param, not a multipart field — matches the (unchanged) frontend's usage.
  const r = await s.post("/upload?doc_type=iec", body, {
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
  });
  if (r.status === 503) return; // storage unavailable in this environment — skip like the original suite
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const rec = r.data;
  assert.ok("file_id" in rec && "storage_path" in rec);
  assert.equal(rec.doc_type, "iec");
  state.fileId = rec.file_id;

  const d = await s.get(`/files/${rec.file_id}/download`, { responseType: "arraybuffer" });
  assert.equal(d.status, 200);
  assert.ok(Buffer.from(d.data).toString("utf8", 0, 4) === "%PDF");
});

test("download forbidden for other user", async () => {
  if (!state.fileId) return; // upload skipped
  const s = state.buyerSession;
  const r = await s.get(`/files/${state.fileId}/download`);
  assert.equal(r.status, 403);
});

// ----- Leads -----
test("create lead", async () => {
  const r = await axios.post(
    `${API}/leads`,
    { name: "TEST_Lead", email: `lead.${TS}@example.com`, message: "Hello, I want to book a call." },
    { validateStatus: () => true }
  );
  assert.equal(r.status, 200);
  assert.ok("lead_id" in r.data);
});
