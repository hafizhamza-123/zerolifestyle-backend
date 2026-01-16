import { error } from "console";
import prisma from "../prisma.js";

// creating cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    res.json({ success: true, cart: cart || { items: [] } });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stockCount < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.discountedPrice ?? product.price
        }
      });
    }

    res.json({ success: true, message: "Item added to cart" });
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const item = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.json({ success: true, item });
  } catch (err) {
    console.error("updateCartItem error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//remove cart items
export const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    console.error("removeCartItem error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//Clear Cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });
    if (!cart)
      return res.json({
        success: true,
        message: "Cart Already empty",
      });

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({ success: true, message: "Cart Cleared Successfully" });
  } catch (err) {
    console.error("clearCart Error", err);
    res.status(500).json({ error: "Server Error" });
  }
};

