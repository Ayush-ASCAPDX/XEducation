const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem
} = require("../controllers/cartController");

router.post("/add", protect, addToCart);
router.get("/", protect, getCart);
router.delete("/remove/:productId", protect, removeFromCart);
router.put("/update-item", protect, updateCartItem);

module.exports = router;
