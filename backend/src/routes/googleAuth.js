const express = require("express");
const repos = require("../repositories");
const authService = require("../services/authService");
const oauthService = require("../services/oauthService");
const asyncHandler = require("../middleware/asyncHandler");
const HttpError = require("../utils/httpError");
const ids = require("../utils/ids");
const config = require("../config/env");
const logger = require("../utils/logger");

const router = express.Router();

function normalizeRole(role) {
  return role === "buyer" || role === "supplier" ? role : "buyer";
}

router.get(
  "/auth/google/login",
  asyncHandler(async (req, res) => {
    if (!config.googleClientId || !config.googleOauthRedirectUri) {
      throw new HttpError(503, "Google sign-in is not configured");
    }

    const role = normalizeRole(req.query.role);
    const nonce = ids.genNonce();
    const state = oauthService.signState({ role, nonce });

    const params = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: config.googleOauthRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });

    res.cookie("oauth_nonce", nonce, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });
    res.redirect(`${config.googleAuthorizeUrl}?${params.toString()}`);
  })
);

router.get(
  "/auth/google/callback",
  asyncHandler(async (req, res) => {
    const failRedirect = (reason) => {
      logger.error(`Google OAuth callback aborted: ${reason}`);
      return res.redirect(`${config.frontendUrl}/login?error=oauth`);
    };

    const { code, state, error } = req.query;
    if (error) return failRedirect(`Google returned error=${error}`);
    if (!code || !state) return failRedirect(`missing code/state (code=${!!code}, state=${!!state})`);

    let statePayload;
    try {
      statePayload = oauthService.verifyState(state);
    } catch (e) {
      return failRedirect(`state JWT invalid: ${e.message}`);
    }

    if (statePayload.nonce !== req.cookies.oauth_nonce) {
      return failRedirect(
        `nonce mismatch (state.nonce=${statePayload.nonce}, cookie.oauth_nonce=${req.cookies.oauth_nonce}, all cookies=${JSON.stringify(req.cookies)})`
      );
    }
    const role = normalizeRole(statePayload.role);

    let info;
    try {
      const tokens = await oauthService.exchangeCodeForToken(code);
      info = await oauthService.fetchUserinfo(tokens.access_token);
    } catch (e) {
      const details = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      return failRedirect(`token/userinfo exchange failed: ${details}`);
    }

    const email = (info.email || "").toLowerCase();
    if (!email) return failRedirect(`no email in userinfo response: ${JSON.stringify(info)}`);
    const name = info.name || email;
    const picture = info.picture;

    let user = await repos.users.findByEmail(email);
    if (!user) {
      user = await repos.users.create({
        user_id: ids.genUserId(),
        email,
        name,
        role,
        company: null,
        picture: picture || null,
        auth_provider: "google",
        created_at: new Date().toISOString(),
      });
    } else if (!user.picture && picture) {
      user = await repos.users.updateById(user.user_id, { picture });
    }

    const access = authService.createAccessToken(user.user_id, user.email, user.role || "buyer");
    const refresh = authService.createRefreshToken(user.user_id);
    const dest = user.role === "supplier" ? "/supplier" : "/buyer";

    authService.setAuthCookies(res, access, refresh);
    res.clearCookie("oauth_nonce", { path: "/" });
    res.redirect(`${config.frontendUrl}${dest}`);
  })
);

module.exports = router;
