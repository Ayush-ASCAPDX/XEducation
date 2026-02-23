const Cart = require("../models/Cart");

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // ✅ FIRST create/find cart
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    // ✅ THEN use cart
    cart.items.push({
      product: productId,
      quantity: quantity || 1,
    });

    await cart.save();

    res.json({ message: "Added to cart", cart });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};


// GET /api/cart/my-cart
exports.getCart = async (req, res) => {
  try {
    // Find cart for logged-in user
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",  // populate product reference
      "name price image"      // include image for cart/checkout thumbnails
    );
    

    if (!cart) {
      return res.json({ items: [] }); // empty cart if none
    }

    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const targetItem = cart.items[itemIndex];
    if (targetItem.quantity > 1) {
      targetItem.quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    res.json({ message: "Item quantity reduced", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/cart/update-item
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, change } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity += change;
    if (item.quantity < 1) item.quantity = 1; // Minimum 1

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
