const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getDashboardStats } = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboardStats);

module.exports = router;
