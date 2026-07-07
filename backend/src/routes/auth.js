const express = require("express");
const repos = require("../repositories");
const authService = require("../services/authService");
const emailService = require("../services/emailService");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");
const ids = require("../utils/ids");
const {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} = require("../validation/schemas");

const router = express.Router();

router.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const email = payload.email.toLowerCase();

    const existing = await repos.users.findByEmail(email);
    if (existing) throw new HttpError(400, "Email already registered");

    const userId = ids.genUserId();
    const doc = {
      user_id: userId,
      email,
      password_hash: await authService.hashPassword(payload.password),
      name: payload.name,
      role: payload.role,
      company: payload.company || null,
      picture: null,
      auth_provider: "local",
      created_at: new Date().toISOString(),
    };
    await repos.users.create(doc);

    const access = authService.createAccessToken(userId, email, payload.role);
    const refresh = authService.createRefreshToken(userId);
    authService.setAuthCookies(res, access, refresh);

    const { password_hash, ...publicUser } = doc;
    res.json(publicUser);
  })
);

router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const email = payload.email.toLowerCase();

    const user = await repos.users.findByEmail(email);
    if (!user || !user.password_hash) throw new HttpError(401, "Invalid credentials");
    if (!(await authService.verifyPassword(payload.password, user.password_hash))) {
      throw new HttpError(401, "Invalid credentials");
    }

    const access = authService.createAccessToken(user.user_id, email, user.role || "buyer");
    const refresh = authService.createRefreshToken(user.user_id);
    authService.setAuthCookies(res, access, refresh);

    const { password_hash, ...publicUser } = user;
    res.json(publicUser);
  })
);

router.post(
  "/auth/password/reset-request",
  asyncHandler(async (req, res) => {
    const payload = passwordResetRequestSchema.parse(req.body);
    const email = payload.email.toLowerCase();

    const user = await repos.users.findByEmail(email);
    if (user && (user.auth_provider || "local") === "local") {
      const token = ids.genToken();
      await repos.passwordResetTokens.create({
        token,
        user_id: user.user_id,
        email,
        used: false,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
      await emailService.sendPasswordResetEmail(email, token);
    }

    res.json({ ok: true, message: "If an account exists, password reset instructions will be sent." });
  })
);

router.post(
  "/auth/password/reset",
  asyncHandler(async (req, res) => {
    const payload = passwordResetConfirmSchema.parse(req.body);

    const tokenDoc = await repos.passwordResetTokens.findValidByToken(payload.token);
    if (!tokenDoc) throw new HttpError(400, "Invalid or expired reset token");

    const expiresAt = new Date(tokenDoc.expires_at);
    if (expiresAt.getTime() < Date.now()) throw new HttpError(400, "Invalid or expired reset token");

    await repos.users.updateById(tokenDoc.user_id, {
      password_hash: await authService.hashPassword(payload.password),
    });
    await repos.passwordResetTokens.markUsed(payload.token);

    res.json({ ok: true });
  })
);

router.post("/auth/logout", (req, res) => {
  authService.clearAuthCookies(res);
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
