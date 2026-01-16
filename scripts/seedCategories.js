import prisma from "../src/prisma.js";

const categories = [
  "Smart Watches",
  "Zero Earbuds",
  "Headphones",
  "11 11 Sale",
  "Vision 2025"
];

async function seedCategories() {
  try {
    console.log("Starting category seed...");
    
    for (const categoryName of categories) {
      const existing = await prisma.category.findFirst({
        where: {
          name: {
            equals: categoryName,
            mode: "insensitive"
          }
        }
      });
      
      if (!existing) {
        const created = await prisma.category.create({
          data: { name: categoryName }
        });
        console.log(`✓ Created category: ${created.name}`);
      } else {
        console.log(`• Category already exists: ${existing.name}`);
      }
    }
    
    // Show all categories
    const allCategories = await prisma.category.findMany();
    console.log("\nAll categories:");
    allCategories.forEach(cat => console.log(`  - ${cat.name} (${cat.id})`));
    
    console.log("\n✓ Seed completed!");
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
