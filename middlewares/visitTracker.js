const crypto = require("crypto");
const SiteVisit = require("../models/SiteVisit");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "";
};

const shouldTrackRequest = (req) => {
  if (req.method !== "GET") return false;
  if (req.path.startsWith("/api")) return false;

  const path = req.path.toLowerCase();
  if (path.includes(".") && !path.endsWith(".html")) return false;

  return true;
};

module.exports = (req, res, next) => {
  if (!shouldTrackRequest(req)) {
    return next();
  }

  let visitorId = req.cookies?.visitor_id;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie("visitor_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
  }

  SiteVisit.create({
    visitorId,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || "",
    path: req.path || "/",
  }).catch(() => {});

  next();
};
