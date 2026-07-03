const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../config/env");

function signState({ role, nonce }) {
  return jwt.sign({ role, nonce }, config.jwtSecret, {
    algorithm: config.jwtAlgorithm,
    expiresIn: "10m",
  });
}

function verifyState(state) {
  return jwt.verify(state, config.jwtSecret, { algorithms: [config.jwtAlgorithm] });
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    code,
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    redirect_uri: config.googleOauthRedirectUri,
    grant_type: "authorization_code",
  });
  const { data } = await axios.post(config.googleTokenUrl, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15000,
  });
  return data;
}

async function fetchUserinfo(accessToken) {
  const { data } = await axios.get(config.googleUserinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  return data;
}

module.exports = { signState, verifyState, exchangeCodeForToken, fetchUserinfo };
