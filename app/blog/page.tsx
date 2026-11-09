import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
export const metadata: Metadata = { title: "Góc kiến thức cà phê" };
export default async function BlogPage() { const posts = await prisma.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } }); return <><section className="page-hero"><div className="container"><span className="eyebrow">Beanora Journal</span><h1>Hiểu cà phê.<br />Thêm yêu từng tách.</h1><p>Kiến thức đơn giản, thực dụng cho hành trình pha và thưởng thức cà phê tại nhà.</p></div></section><section className="section"><div className="container journal-grid">{posts.map((post) => <Link href={`/blog/${post.slug}`} className="journal-card" key={post.id}><div className="journal-image"><Image src={post.coverUrl || "/images/hero-coffee.jpg"} alt={post.title} fill sizes="33vw" /></div><div><span>Kiến thức cà phê</span><h3>{post.title}</h3><p>{post.excerpt}</p><b>Đọc bài viết <ArrowRight size={15} /></b></div></Link>)}</div>{!posts.length && <div className="empty-state"><h2>Chưa có bài viết được xuất bản</h2></div>}</section></>; }
