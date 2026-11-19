import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import s from "../staff.module.css";

type Tone = "ok" | "warn" | "bad" | "info";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <div className={s.pageHeader}>
      <p className={s.eyebrow}>{eyebrow}</p>
      <h1 className={s.title}>{title}</h1>
      {subtitle && <div className={s.subtitle}>{subtitle}</div>}
    </div>
  );
}

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={[s.card, className].filter(Boolean).join(" ")}>
      {title && <h2 className={s.cardTitle}>{title}</h2>}
      {children}
    </section>
  );
}

export function Tag({
  tone = "brand",
  children,
}: {
  tone?: "brand" | "ok" | "warn" | "bad" | "muted";
  children: ReactNode;
}) {
  return <span className={`${s.tag} ${s[`tag_${tone}`]}`}>{children}</span>;
}

export function Notice({
  tone,
  icon,
  title,
  children,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`${s.notice} ${s[`notice_${tone}`]}`} role={tone === "bad" ? "alert" : undefined}>
      <span className={s.noticeIcon}>{icon}</span>
      <div>
        <p className={s.noticeTitle}>{title}</p>
        {children && <div className={s.noticeBody}>{children}</div>}
      </div>
    </div>
  );
}

export function Hero({
  tone,
  icon,
  title,
  caption,
}: {
  tone: "ok" | "warn" | "bad";
  icon: ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <div className={`${s.hero} ${s[`hero_${tone}`]}`} role="status">
      <div className={s.heroCircle}>{icon}</div>
      <h2 className={s.heroTitle}>{title}</h2>
      <p className={s.heroCaption}>{caption}</p>
    </div>
  );
}

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={[s.btn, s[`btn_${variant}`], className].filter(Boolean).join(" ")}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${s.btn} ${s[`btn_${variant}`]}`}>
      {children}
    </Link>
  );
}
