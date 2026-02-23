const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const appendTimelineEvent = (order, status, note) => {
  const lastEvent = order.statusTimeline?.[order.statusTimeline.length - 1];
  if (lastEvent && lastEvent.status === status) {
    return;
  }

  if (!order.statusTimeline) {
    order.statusTimeline = [];
  }

  order.statusTimeline.push({
    status,
    note,
    timestamp: new Date(),
  });
};

const applyStatusDates = (order, status) => {
  const now = new Date();

  if (status === "shipped" && !order.shippedAt) {
    order.shippedAt = now;
  }

  if (status === "delivered" && !order.deliveredAt) {
    order.deliveredAt = now;
  }

  if (status === "cancelled") {
    order.cancelledAt = now;
  }

  if (status === "returned" && !order.returnedAt) {
    order.returnedAt = now;
  }

  if (status === "refunded" && !order.refundedAt) {
    order.refundedAt = now;
    order.refundStatus = "refunded";
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // only owner can cancel
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Order cannot be cancelled now",
      });
    }

    // restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      product.countInStock += item.quantity;
      await product.save();
    }

    order.status = "cancelled";
    order.refundStatus = "refunded";
    order.cancelledAt = Date.now();
    order.refundedAt = Date.now();
    appendTimelineEvent(order, "cancelled", "Order cancelled by customer");
    appendTimelineEvent(order, "refunded", "Refund initiated");

    await order.save();

    res.json({
      message: "Order cancelled & refund initiated",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const placeOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    cart.items.forEach((item) => {
      total += item.product.price * item.quantity;
    });

    const order = await Order.create({
      user: req.user.id,
      items: cart.items.map((i) => ({
        product: i.product._id,
        quantity: i.quantity,
      })),
      totalAmount: total,
      statusTimeline: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order placed",
        },
      ],
    });

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      product.countInStock -= item.quantity;
      await product.save();
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "pending",
      "shipped",
      "delivered",
      "cancelled",
      "return-requested",
      "returned",
      "refunded",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    applyStatusDates(order, status);
    appendTimelineEvent(order, status, `Status changed to ${status}`);
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
