const express = require("express");
const router = express.Router();

const {   placeOrder, getMyOrders, getAllOrders, updateOrderStatus, cancelOrder, } = require("../controllers/orderController");
const { protect,verifyToken,   adminOnly } = require("../middlewares/authMiddleware");
const Order = require("../models/Order"); 



// User
router.post("/place", protect, placeOrder);
router.get("/my-orders", protect, getMyOrders);
router.put("/:id/cancel", protect, cancelOrder);
// router.put("/:id/return", protect, requestReturn);
// Admin


router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
