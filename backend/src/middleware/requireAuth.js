const authService = require("../services/authService");
const HttpError = require("../utils/httpError");
const asyncHandler = require("./asyncHandler");

const requireAuth = asyncHandler(async (req, res, next) => {
  const user = await authService.resolveUserFromRequest(req);
  if (!user) throw new HttpError(401, "Not authenticated");
  req.user = user;
  next();
});

async function tryResolveUser(req) {
  return authService.resolveUserFromRequest(req);
}

module.exports = { requireAuth, tryResolveUser };
