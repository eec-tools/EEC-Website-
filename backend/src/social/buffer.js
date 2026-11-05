// Buffer GraphQL API client (https://developers.buffer.com).
// Single endpoint, Bearer personal API key. GraphQL returns HTTP 200 even for errors:
// typed mutation errors come back as MutationError, system errors in errors[].

const axios = require("axios");

const ENDPOINT = "https://api.buffer.com";

class Enum {
  constructor(v) {
    this.v = v;
  }
}
const E = (v) => new Enum(v);

// Serialises a JS value as a GraphQL input literal (enums unquoted).
function lit(v) {
  if (v instanceof Enum) return v.v;
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return `[${v.map(lit).join(", ")}]`;
  if (typeof v === "object") {
    return `{ ${Object.entries(v)
      .filter(([, x]) => x !== undefined)
      .map(([k, x]) => `${k}: ${lit(x)}`)
      .join(", ")} }`;
  }
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  return JSON.stringify(String(v));
}

class BufferError extends Error {
  constructor(message, { kind = "api", ambiguous = false } = {}) {
    super(message);
    this.kind = kind; // "api" = Buffer refused; "network" = no clear answer
    this.ambiguous = ambiguous; // true when the post may or may not have been created
  }
}

function createBufferClient({ apiKey, http = axios, timeoutMs = 20000 } = {}) {
  async function request(query, { mutation = false } = {}) {
    if (!apiKey) throw new BufferError("BUFFER_API_KEY is not set");
    let res;
    try {
      res = await http.post(
        ENDPOINT,
        { query },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: timeoutMs }
      );
    } catch (e) {
      const status = e.response && e.response.status;
      if (status && status < 500 && status !== 408 && status !== 429) {
        throw new BufferError(`Buffer HTTP ${status}: ${JSON.stringify(e.response.data).slice(0, 300)}`);
      }
      throw new BufferError(`Buffer unreachable (${status || e.code || e.message})`, { kind: "network", ambiguous: mutation });
    }
    const body = res.data || {};
    if (body.errors && body.errors.length) {
      const msg = body.errors.map((x) => `${x.message}${x.extensions && x.extensions.code ? ` [${x.extensions.code}]` : ""}`).join("; ");
      const rate = body.errors.some((x) => x.extensions && x.extensions.code === "RATE_LIMIT_EXCEEDED");
      throw new BufferError(`Buffer: ${msg}`, { kind: rate ? "network" : "api", ambiguous: false });
    }
    return body.data;
  }

  async function organizations() {
    const d = await request(`query { account { organizations { id name } } }`);
    return (d.account && d.account.organizations) || [];
  }

  async function channels(organizationId) {
    const d = await request(
      `query { channels(input: { organizationId: ${lit(organizationId)} }) { id name displayName service type timezone isDisconnected isLocked isQueuePaused avatar } }`
    );
    return d.channels || [];
  }

  // post: { channelId, channel (EEC channel key), text, kind, media:[url], document:{url,title,thumbnailUrl}, firstComment, dueAt (Date|null => share now) }
  function buildCreateInput(p) {
    const input = {
      text: p.text,
      channelId: p.channelId,
      schedulingType: E("automatic"),
      mode: E(p.dueAt ? "customScheduled" : "shareNow"),
    };
    if (p.dueAt) input.dueAt = new Date(p.dueAt).toISOString();
    const media = p.media || [];
    if (media.length) {
      input.assets = media.map((url) => (/\.(mp4|mov)(\?|$)/i.test(url) ? { video: { url } } : { image: { url } }));
    }
    // LinkedIn document post (PDF carousel): one document asset with a title and a cover thumbnail.
    if (p.document) input.assets = [{ document: { url: p.document.url, title: p.document.title, thumbnailUrl: p.document.thumbnailUrl } }];
    if (p.channel === "instagram") {
      // Buffer has no "carousel" type for Instagram: a post with 2 to 10 images becomes a carousel.
      const type = p.kind === "reel" ? "reel" : "post";
      input.metadata = { instagram: { type: E(type), shouldShareToFeed: true, firstComment: p.firstComment || undefined } };
    } else if (p.channel === "facebook") {
      input.metadata = { facebook: { type: E(p.kind === "reel" ? "reel" : "post"), firstComment: p.firstComment || undefined } };
    }
    return input;
  }

  async function createPost(p) {
    const d = await request(
      `mutation { createPost(input: ${lit(buildCreateInput(p))}) { __typename ... on PostActionSuccess { post { id dueAt status } } ... on MutationError { message } } }`,
      { mutation: true }
    );
    const r = d.createPost || {};
    if (r.post) return r.post;
    throw new BufferError(`Buffer refused the post: ${r.message || r.__typename || "unknown reason"}`);
  }

  async function deletePost(id) {
    const d = await request(`mutation { deletePost(input: { id: ${lit(id)} }) { __typename ... on MutationError { message } } }`, {
      mutation: true,
    });
    const r = d.deletePost || {};
    if (r.message) {
      // Already gone counts as deleted.
      if (/not\s*found/i.test(r.message)) return true;
      throw new BufferError(`Buffer could not delete post ${id}: ${r.message}`);
    }
    return true;
  }

  async function getPost(id) {
    const d = await request(
      `query { post(input: { id: ${lit(id)} }) { id status dueAt sentAt externalLink channelId error { __typename } } }`
    );
    return d.post || null;
  }

  async function getPostMetrics(id) {
    const d = await request(`query { post(input: { id: ${lit(id)} }) { id metrics { type name value unit } metricsUpdatedAt } }`);
    const p = d.post || {};
    const out = {};
    for (const m of p.metrics || []) out[m.type || m.name] = m.value;
    return { metrics: out, updatedAt: p.metricsUpdatedAt || null };
  }

  return { request, organizations, channels, createPost, deletePost, getPost, getPostMetrics, buildCreateInput };
}

let shared = null;
function getBuffer() {
  if (!shared) shared = createBufferClient({ apiKey: process.env.BUFFER_API_KEY });
  return shared;
}
function setBuffer(client) {
  shared = client;
}

module.exports = { createBufferClient, getBuffer, setBuffer, BufferError, lit, E };
