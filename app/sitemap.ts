import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const [products, posts] = await Promise.all([prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }), prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })]);
  return [
    ...["", "/shop", "/about", "/blog", "/contact", "/track"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/shop" ? "daily" as const : "weekly" as const, priority: path === "" ? 1 : .8 })),
    ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: .8 })),
    ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: .6 })),
  ];
}
