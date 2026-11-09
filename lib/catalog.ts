import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  variants: { where: { active: true }, include: { inventory: true }, orderBy: { price: "asc" as const } },
  categories: { include: { category: true } },
  reviews: { where: { approved: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" as const }, take: 10 },
} satisfies Prisma.ProductInclude;

export type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function serializeProduct(product: ProductRecord) {
  const defaultVariant = product.variants.find((v) => v.weight === "500g" && v.grind === "Xay phin") || product.variants[0];
  const activePrice = (v: ProductRecord["variants"][number]) => v.salePrice ?? v.price;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription,
    description: product.description,
    story: product.story,
    origin: product.origin,
    region: product.region,
    altitude: product.altitude,
    flavor: product.flavor,
    roastLevel: product.roastLevel,
    process: product.process,
    brewMethods: product.brewMethods,
    storage: product.storage,
    badge: product.badge,
    rating: product.rating,
    reviewCount: product.reviewCount,
    featured: product.featured,
    bestseller: product.bestseller,
    isNew: product.isNew,
    image: product.images[0]?.url || "/images/hero-coffee.jpg",
    price: defaultVariant ? activePrice(defaultVariant) : 0,
    originalPrice: defaultVariant?.salePrice ? defaultVariant.price : null,
    inStock: product.variants.some((v) => (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0) > 0),
    categories: product.categories.map(({ category }) => ({ name: category.name, slug: category.slug })),
    variants: product.variants.map((v) => ({
      id: v.id, name: v.name, sku: v.sku, weight: v.weight, roast: v.roast, grind: v.grind,
      price: v.price, salePrice: v.salePrice, stock: Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0)),
    })),
    reviews: product.reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, verifiedPurchase: r.verifiedPurchase,
      createdAt: r.createdAt.toISOString(), author: r.user.name,
    })),
  };
}

export type StoreProduct = ReturnType<typeof serializeProduct>;

export type CatalogQuery = {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
};

export async function getCatalog(query: CatalogQuery = {}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(query.featured ? { featured: true } : {}),
    ...(query.search ? { OR: [
      { name: { contains: query.search, mode: "insensitive" } },
      { shortDescription: { contains: query.search, mode: "insensitive" } },
      { flavor: { contains: query.search, mode: "insensitive" } },
    ] } : {}),
    ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
  };
  const records = await prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: "desc" } });
  const products = records.map(serializeProduct);
  switch (query.sort) {
    case "price-asc": products.sort((a, b) => a.price - b.price); break;
    case "price-desc": products.sort((a, b) => b.price - a.price); break;
    case "popular": products.sort((a, b) => Number(b.bestseller) - Number(a.bestseller) || b.rating - a.rating); break;
    case "newest": products.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
    default: products.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  const total = products.length;
  return { products: products.slice((page - 1) * limit, page * limit), total, pages: Math.max(1, Math.ceil(total / limit)), page };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, active: true }, include: productInclude });
  return product ? serializeProduct(product) : null;
}

export async function getCategories() {
  return prisma.category.findMany({ where: { active: true }, orderBy: { position: "asc" } });
}

export async function getPublicProductsForAI() {
  const records = await prisma.product.findMany({ where: { active: true }, include: productInclude, take: 30 });
  return records.map(serializeProduct).map((p) => ({
    id: p.id, name: p.name, slug: p.slug, price: p.price, inStock: p.inStock,
    description: p.shortDescription, flavor: p.flavor, roast: p.roastLevel, brewMethods: p.brewMethods,
  }));
}
