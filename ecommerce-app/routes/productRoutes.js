const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct
} = require("../controllers/productController");

const {
  protect,
  adminOnly
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Admin create product
router.post("/", protect, adminOnly, createProduct);

// Public
router.get("/", getProducts);
router.get("/:id", getProduct);

module.exports = router;
