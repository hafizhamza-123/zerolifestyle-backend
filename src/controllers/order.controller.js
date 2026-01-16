import prisma from "../prisma.js";

// creating an order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId; 

    const { items, firstName, lastName, address, city, postalCode, phone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in the order" });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } }
    });

    let total = 0;
    const orderItemsData = items.map(i => {
      const product = products.find(p => p.id === i.productId);
      if (!product) throw new Error(`Product not found: ${i.productId}`);
      if (product.stockCount < i.quantity) throw new Error(`Insufficient stock for ${product.name}`);
      total += product.discountedPrice * i.quantity;
      return {
        productId: i.productId,
        quantity: i.quantity,
        price: product.price
      };
    });

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: "PENDING",
        firstName,
        lastName,
        address,
        city,
        postalCode,
        phone,
        items: { create: orderItemsData }
      },
      include: { items: true }
    });

    for (const i of items) {
      await prisma.product.update({
        where: { id: i.productId },
        data: { stockCount: { decrement: i.quantity } }
      });
    }

    res.json({ success: true, order });

  } catch (err) {
    console.error("createOrder error:", err);
    res.status(400).json({ error: err.message });
  }
};

// Getting All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items : true},
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Single Order
export const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
};

// Updating Order Status (Admin only)
export const UpdateStatus = async (req, res) => {
  try {
    if ( req.user.role !== "ADMIN"){
      return res.status(403).json({ message: "Access Denied" });
    }
    const { id } = req.params;
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json({ success: true, message: "Status Updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Rollback stock for each item
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockCount: { increment: item.quantity } },
      });
    }

    // Update status to CANCELLED
    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.json({ success: true, message: "Order cancelled and stock updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Revenue Stats for last 6 months
export const getRevenueStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get paid orders from last 6 months
    const orders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    // Group by month
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const revenueByMonth = {};
    
    orders.forEach(order => {
      const month = order.createdAt.getMonth();
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = 0;
      }
      revenueByMonth[month] += order.total;
    });

    // Get last 6 months
    const currentMonth = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push({
        name: months[monthIndex],
        revenue: revenueByMonth[monthIndex] || 0
      });
    }

    res.json({ success: true, data: last6Months });
  } catch (err) {
    console.error("getRevenueStats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch revenue stats" });
  }
};
