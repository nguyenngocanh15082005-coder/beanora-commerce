import Link from "next/link";

export function SectionHeading({ eyebrow, title, description, link, align = "left" }: { eyebrow: string; title: string; description?: string; link?: { href: string; label: string }; align?: "left" | "center" }) {
  return <div className={`section-heading ${align === "center" ? "center" : ""}`}><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{link && <Link href={link.href} className="text-link">{link.label} <span>→</span></Link>}</div>;
}
