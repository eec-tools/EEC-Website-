const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const repos = require("../repositories");

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function createAccessToken(userId, email, role) {
  return jwt.sign(
    { sub: userId, email, role, type: "access" },
    config.jwtSecret,
    { algorithm: config.jwtAlgorithm, expiresIn: "24h" }
  );
}

function createRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    config.jwtSecret,
    { algorithm: config.jwtAlgorithm, expiresIn: "7d" }
  );
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

// Core resolver — never throws. Returns the public user object (no password_hash) or null.
async function resolveUserFromRequest(req) {
  let token = req.cookies && req.cookies.access_token;
  if (!token) {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: [config.jwtAlgorithm] });
    if (payload.type !== "access") return null;
    const user = await repos.users.findPublicById(payload.sub);
    return user || null;
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  resolveUserFromRequest,
};
