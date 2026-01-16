import prisma from "../prisma.js"

// create category
export const createCategory = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") 
      return res.status(403).json({message: "Access Denied"});
    const { name } = req.body;

    if(!name) 
      return res.status(400).json({message: "Category name is required"});

    const category = await prisma.category.create({
      data: { name }
    })
    res.status(201).json({success: true, category});
  }
  catch(err){
    console.error("createCategory Error", err)
    res.status(500).json({message: "Server Error"})
  }
};

// get all Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, categories });
  } catch (err) {
    console.error("getAllCategories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get Single category
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ success: true, category });
  } catch (err) {
    console.error("getCategoryById error:", err);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Access Denied" });

    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name }
    });
    res.json({ success: true, category });
  } catch (err) {
    console.error("Updating Category Error", err);
    res.status(500).json({ error: "Server Error" });
  }
};

// delete category
export const deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ error: "Access denied" });

    const { id } = req.params;
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        error: "Cannot delete category with existing products"
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

// Get Products of category
export const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        product: {}
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      success: true,
      category: category.name,
      products: category.product
    });
  } catch (err) {
    console.error("getCategoryProducts error:", err);
    res.status(500).json({ error: "Failed to fetch category products" });
  }
};

