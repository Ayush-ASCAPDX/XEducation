const Product = require("../models/Product");



// CREATE PRODUCT (ADMIN)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, features, price, category, stock, image } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({
        message: "name, description, price, and category are required",
      });
    }

    const product = await Product.create({
      name,
      description,
      features: features || "",
      price: Number(price),
      category,
      stock: Number.isFinite(Number(stock)) ? Number(stock) : 0,
      image: image || "",
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
};


// GET ALL PRODUCTS (PUBLIC)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// GET SINGLE PRODUCT
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(404).json({ message: "Product not found" });
  }
};
