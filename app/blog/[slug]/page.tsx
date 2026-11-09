import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const post = await prisma.blogPost.findFirst({ where: { slug, published: true } }); return post ? { title: post.title, description: post.excerpt } : { title: "Bài viết" }; }
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const post = await prisma.blogPost.findFirst({ where: { slug, published: true } }); if (!post) notFound(); return <article className="blog-article"><div className="container"><Link href="/blog" className="text-link"><ArrowLeft size={14} />Quay lại góc cà phê</Link><header><span className="eyebrow">Beanora Journal</span><h1>{post.title}</h1><p>{post.excerpt}</p><small>{post.publishedAt && formatDate(post.publishedAt)}</small></header><div className="article-cover"><Image src={post.coverUrl || "/images/hero-coffee.jpg"} alt={post.title} fill priority sizes="100vw" /></div><div className="article-content">{post.content.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}<h2>Một gợi ý từ Beanora</h2><p>Hãy ghi lại tỷ lệ cà phê, nước, độ xay và thời gian chiết xuất mỗi lần pha. Chỉ thay đổi một yếu tố tại một thời điểm, bạn sẽ sớm tìm được công thức phù hợp khẩu vị.</p></div><div className="article-cta"><h3>Sẵn sàng cho một tách cà phê mới?</h3><Link href="/shop" className="button button-copper">Chọn cà phê của bạn →</Link></div></div></article>; }
