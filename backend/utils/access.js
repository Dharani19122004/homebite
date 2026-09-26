// Shared access-control helpers. `req.user` is always the account from the
// verified JWT (set by authMiddleware / adminMiddleware) - never trust an ID
// sent in the URL or body to say who the caller is.

const requesterId = (req) => String(req.user?._id || req.user?.id || "");

const isAdmin = (req) => req.user?.role === "admin";

// True when `id` (ObjectId or string) is the logged-in account.
const isSameUser = (req, id) =>
  Boolean(id) && String(id?._id || id) === requesterId(req);

// The account itself, or an admin.
const isSelfOrAdmin = (req, id) => isAdmin(req) || isSameUser(req, id);

const forbidden = (res, message = "You do not have permission to do this") =>
  res.status(403).json({ success: false, message });

module.exports = { requesterId, isAdmin, isSameUser, isSelfOrAdmin, forbidden };
