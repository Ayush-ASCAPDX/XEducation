const mongoose = require("mongoose");

const siteVisitSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    path: {
      type: String,
      default: "/",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteVisit", siteVisitSchema);
