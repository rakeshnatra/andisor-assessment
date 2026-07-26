-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discountPercentage" DOUBLE PRECISION NOT NULL,
    "inventory" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "leadTime" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "primaryVariantName" TEXT NOT NULL,
    "secondaryVariantName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primary_variants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discountPercentage" DOUBLE PRECISION NOT NULL,
    "inventory" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primary_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_variants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discountPercentage" DOUBLE PRECISION NOT NULL,
    "inventory" INTEGER NOT NULL,
    "primaryVariantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_variants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "primary_variants" ADD CONSTRAINT "primary_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_variants" ADD CONSTRAINT "secondary_variants_primaryVariantId_fkey" FOREIGN KEY ("primaryVariantId") REFERENCES "primary_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
