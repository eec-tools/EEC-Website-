const authService = require("../services/authService");
const HttpError = require("../utils/httpError");
const asyncHandler = require("./asyncHandler");

// Hard-gate middleware: attaches req.user or fails with a single unified 401.
const requireAuth = asyncHandler(async (req, res, next) => {
  const user = await authService.resolveUserFromRequest(req);
  if (!user) throw new HttpError(401, "Not authenticated");
  req.user = user;
  next();
});

// Never throws — used where auth is optional (e.g. anonymous buyer intake submissions).
async function tryResolveUser(req) {
  return authService.resolveUserFromRequest(req);
}

module.exports = { requireAuth, tryResolveUser };
