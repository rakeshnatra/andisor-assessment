import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Build path to prisma/data/products.json
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "products.json"
  );

  // 2. Read the JSON file
  const fileContents = fs.readFileSync(filePath, "utf-8");

  // 3. Parse JSON
  const products = JSON.parse(fileContents);

  console.log(`Found ${products.length} products`);

  // 4. Loop through products
for (const product of products) {
  await prisma.product.create({
    data: {
      id: product.id,
      title: product.title,
      price: product.price,
      discountPercentage: product.discountPercentage,
      inventory: Number(product.inventory),
      active: product.active,
      leadTime: product.leadTime,
      description: product.description,
      category: product.category,
      image: product.image,
      primaryVariantName: product.primary_variant_name,
      secondaryVariantName: product.secondary_variant_name,

      primaryVariants: {
        create: product.primary_variants.map((variant: any) => ({
          name: variant.name,
          price: variant.price,
          discountPercentage: variant.discountPercentage,
          inventory: Number(variant.inventory),
          active: variant.active,

          secondaryVariants: {
            create: variant.secondary_variants.map((secondary: any) => ({
              name: secondary.name,
              price: secondary.price,
              discountPercentage: secondary.discountPercentage,
              inventory: Number(secondary.inventory),
            })),
          },
        })),
      },
    },
  });

  console.log(`Inserted: ${product.title}`);
}
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeding finished");
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });