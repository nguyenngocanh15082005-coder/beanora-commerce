export function AdminHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="admin-page-header"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
