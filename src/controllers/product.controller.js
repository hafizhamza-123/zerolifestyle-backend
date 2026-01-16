import prisma from "../prisma.js"

// create product (Admin only)
export const createProduct = async (req, res) => {
  if (req.user.role !== "ADMIN"){
    return res.status(403).json({ message: "Access Denied" });
  }
  try {
    const featuredImage = req.files?.featuredImage?.[0]?.path || null;
    const gallery = req.files?.gallery?.map((file) => file.path) || [];

    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        slug: req.body.slug,
        categoryId: req.body.categoryId,
        description: req.body.description,
        price: parseInt(req.body.price),
        discountedPrice: req.body.discountedPrice
          ? parseInt(req.body.discountedPrice, 10)
          : null,
        stockCount: parseInt(req.body.stockCount, 10) || 0,
        bestseller: req.body.bestseller === "true",
        featuredImage,
        gallery,
      },
    });
console.log("Created product:", product);
    res.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const featuredImage = req.files?.featuredImage?.[0]?.path || undefined;
    const gallery = req.files?.gallery?.map((file) => file.path) || undefined;

    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.slug) data.slug = req.body.slug;
    if (req.body.description) data.description = req.body.description;
    if (req.body.price)
      data.price = Number(req.body.price);
    if ("discountedPrice" in req.body)
      data.discountedPrice = req.body.discountedPrice
        ? Number(req.body.discountedPrice)
        : null;
    if (req.body.stockCount) data.stockCount = Number(req.body.stockCount);
    if ("bestseller" in req.body)
      data.bestseller = req.body.bestseller === "true";
    if (featuredImage)
      data.featuredImage = featuredImage;
    if (gallery)
      data.gallery = gallery; 
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No data provided to update" });
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("updateProduct error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    console.error("deleteProduct error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try{
    const products = await prisma.product.findMany();
    res.json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get single product by ID
export const getSingleProduct = async (req, res) => {
  try {

    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Best-Seller Products
export const getBestSellers = async (req,res) => {
  try {
    const topseller = await prisma.product.findMany({
      where: { bestseller: true },
      take: 5,
    });

    res.json({ success: true, topseller });
  } catch (error) {
    console.error("Error fetching best selling products", error);
    res.status(500).json({ success: false, message: "Failed to fetch best selling products" });
  }
};

// Search Products (Admin panel and User)
export const SearchProduct = async (req, res) => {
    try {
        const query = req.query.q;
    if (!query || query.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query not provided" });
    }

    const products = await prisma.product.findMany({
            where: {
                name: { contains: query, mode: "insensitive" },
            },
            take: 2,
        });

        res.json({success: true, products});
    } catch(error) {
        console.error("Error searching products", error);
        res.status(500).json({success: false, message: "Failed to search products"});
    }
};

// Top Selling products
export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const topSelling = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: [
        {
          _sum: {
            quantity: 'desc',
          },
        },
        {
          productId: 'asc',
        },
      ],
      take: limit * 2,
    });

    const productIds = topSelling.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const productsWithRevenue = topSelling
      .map(item => {
        const product = productMap.get(item.productId);
        if (!product) return null;

        // Calculate revenue: quantity * product price
        const priceToUse = product.discountedPrice || product.price;
        const totalRevenue = item._sum.quantity * priceToUse;

        return {
          ...product,
          totalSold: item._sum.quantity,
          totalRevenue: totalRevenue,
        };
      })
      .filter(product => product !== null)
      .slice(0, limit);

    res.json({ success: true, topSelling: productsWithRevenue });
  } catch (error) {
    console.error("Error fetching top selling products", error);
    res.status(500).json({ success: false, message: "Failed to fetch top selling products" });
  }
};
