const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");
const { protect, adminOnly } = require("./middlewares/authMiddleware");
const visitTracker = require("./middlewares/visitTracker");
connectDB();

const app = express();

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:5000"],
    credentials: true
  })
);
app.use(visitTracker);

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Test Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

const cartRoutes = require("./routes/cartRoutes");
app.use("/api/cart", cartRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Protected admin page route (must be before static serving)
app.get("/admin-orders.html", protect, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-orders.html"));
});

app.get("/admin-products.html", protect, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-products.html"));
});

app.get("/admin-dashboard.html", protect, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



