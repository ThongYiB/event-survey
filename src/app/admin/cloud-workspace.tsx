"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./admin.module.css";

type Account = { id: string; name: string; email: string; role: string; suspended: boolean; must_change_password: boolean };
type Data = { accounts: Account[]; events: { id: string; name: string; owner_id: string; suspended: boolean }[]; audit: { id: number; action: string; target: string; created_at: string }[] };
const labels: Record<string, string> = { system_admin: "System Admin", event_manager: "Event Manager", staff: "Staff" };
const nav = [["accounts", "บัญชีผู้ใช้"], ["events", "กำกับดูแลงาน"], ["audit", "Audit Log"], ["security", "ความปลอดภัย"]];

export function CloudAdminWorkspace({ children }: { children: ReactNode }) {
  const [menuOpen,setMenuOpen]=useState(false);
  const pathname = usePathname();
  const section = pathname.split("/")[2] || "accounts";
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/workspace", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json(); if (!response.ok) throw new Error(result.message); return result as Data;
    }).then((result) => { if (!controller.signal.aborted) { setData(result); setError(""); } }).catch((reason) => { if (!controller.signal.aborted) setError(reason.message || "โหลดข้อมูลไม่ได้"); });
    return () => controller.abort();
  }, [version]);

  async function mutate(method: string, body: unknown, reportError: (message: string) => void = setError) {
    setBusy(true); setError(""); setCreateError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/workspace", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setVersion((value) => value + 1); setNotice("บันทึกข้อมูลแล้ว"); return true;
    } catch (reason) { reportError(reason instanceof Error ? reason.message : "บันทึกไม่ได้"); return false; }
    finally { setBusy(false); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    const email = String(form.get("email") || "").trim().toLowerCase();
    if (checkExistingEmail(email)) return;
    if (await mutate("POST", { name: form.get("name"), email, password: form.get("password") }, setCreateError)) { formElement.reset(); setCreating(false); }
  }

  function checkExistingEmail(value: string) {
    const exists = data?.accounts.some((account) => account.email.toLowerCase() === value.trim().toLowerCase());
    if (exists) setCreateError("อีเมลนี้มีบัญชีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่นสำหรับ Event Manager คนใหม่");
    return exists;
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar} data-menu-open={menuOpen} onKeyDown={event=>{if(event.key==="Escape")setMenuOpen(false);}}><div className={styles.brand}><span>ES</span><strong>Event Survey</strong><button className={styles.menuToggle} aria-label={menuOpen?"ปิดเมนู":"เปิดเมนู System Admin"} aria-expanded={menuOpen} aria-controls="admin-menu" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"ปิด ✕":"เมนู ☰"}</button></div><div className={styles.role}>System Admin</div>
      <nav id="admin-menu" aria-label="เมนู System Admin">{nav.map(([id, label]) => <Link key={id} href={`/admin/${id}`} prefetch={false} aria-current={section === id ? "page" : undefined} onNavigate={(event) => {
        // All four panels use the data already loaded in this shared layout.
        // Preserve normal links/new tabs while switching these panels locally.
        event.preventDefault();
        setMenuOpen(false);
        if (section !== id) window.history.pushState(null, "", `/admin/${id}`);
      }}>{label}</Link>)}</nav>
      <button className={styles.exit} onClick={async () => { const response = await fetch("/api/auth/sign-out", { method: "POST" }); if (response.ok) { router.replace("/login"); router.refresh(); } else setError("ออกจากระบบไม่ได้ กรุณาลองอีกครั้ง"); }}>ออกจากระบบ</button>
    </aside>
    <main className={styles.workspace}><div className={styles.topbar}>พื้นที่จัดการ / System Admin</div><div className={styles.content}>
      {children}
      {error && <p className={styles.error} role="alert">{error} <button onClick={() => setVersion((value) => value + 1)}>ลองอีกครั้ง</button></p>}
      {notice && <p className={styles.note} role="status">{notice}</p>}
      {!data && !error && <p role="status">กำลังโหลดข้อมูลจาก Supabase…</p>}
      {section === "accounts" && <>
        <header className={styles.heading}><div><h1>บัญชีผู้ใช้และบทบาท</h1><p>สร้างบัญชี Event Manager สำหรับเข้าสู่ระบบและจัดการงาน</p></div><button disabled={!data || busy} onClick={() => { setCreateError(""); setNotice(""); setCreating(true); }}>＋ สร้างบัญชี Event Manager</button></header>
        {creating && <section className={styles.panel}><h2>สร้างบัญชี Event Manager</h2><form onSubmit={create} onChange={() => { if (createError) setCreateError(""); }} className={`${styles.form} ${styles.accountForm}`} aria-describedby={createError ? "manager-create-error" : undefined}>
          <label>ชื่อและนามสกุล *<input name="name" autoComplete="section-new-manager name" required maxLength={120} /></label>
          <label>อีเมล *<input name="email" type="email" autoComplete="section-new-manager email" required maxLength={254} onBlur={(event) => checkExistingEmail(event.currentTarget.value)} /></label>
          <label>รหัสผ่านชั่วคราว *<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} aria-describedby="manager-password-hint" /></label>
          {createError && <div id="manager-create-error" className={styles.formError} role="alert"><span className={styles.errorIcon} aria-hidden="true">!</span><div><strong>ตรวจสอบข้อมูลอีกครั้ง</strong><p>{createError}</p></div></div>}
          <p id="manager-password-hint" className={styles.passwordHint}>รหัสผ่านอย่างน้อย 8 ตัวอักษร · ผู้ใช้ต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งแรก</p>
          <div className={styles.actions}><button disabled={busy}>{busy ? "กำลังสร้าง…" : "สร้างบัญชี"}</button><button type="button" className={styles.secondary} disabled={busy} onClick={() => { setCreating(false); setCreateError(""); }}>ยกเลิก</button></div>
        </form></section>}
        <section className={styles.panel}><h2>บัญชีในระบบ</h2><div className={styles.filters}><label>ค้นหาบัญชี<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label>บทบาท<select value={role} onChange={(event) => setRole(event.target.value)}><option value="">ทั้งหมด</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
          <div className={styles.scroll}><table><thead><tr><th>บัญชี</th><th>บทบาท</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{data?.accounts.filter((account) => (!role || account.role === role) && `${account.name} ${account.email}`.toLowerCase().includes(query.trim().toLowerCase())).map((account) => <tr key={account.id}><td><strong>{account.name}</strong><small>{account.email}</small></td><td>{labels[account.role]}</td><td>{account.suspended ? "ระงับ" : account.must_change_password ? "รอเปลี่ยนรหัสผ่าน" : "ใช้งาน"}</td><td>{account.role === "system_admin" ? "บัญชีผู้ดูแล" : <div className={styles.accountActions}><button disabled={busy} className={styles.secondary} onClick={() => mutate("PATCH", { id: account.id, action: "toggle_account" })}>{account.suspended ? "คืนสิทธิ์" : "ระงับ"}</button><button disabled={busy} className={styles.deleteAccount} onClick={() => { if (window.confirm(`ปิดใช้งานบัญชี ${account.email} หรือไม่? ประวัติของงานยังถูกเก็บไว้`)) void mutate("PATCH", { id: account.id, action: "delete_account" }); }}>ลบบัญชี</button></div>}</td></tr>)}</tbody></table></div>
        </section>
      </>}
      {section === "events" && <><h1>กำกับดูแลงาน</h1><section className={styles.panel}><div className={styles.scroll}><table><thead><tr><th>อีเวนต์</th><th>Event Manager</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{data?.events.map((event) => <tr key={event.id}><td>{event.name}</td><td>{data.accounts.find((account) => account.id === event.owner_id)?.name || "บัญชีที่ปิดใช้งาน"}</td><td>{event.suspended ? "ระงับ" : "เปิดใช้งาน"}</td><td><button disabled={busy} onClick={() => mutate("PATCH", { id: event.id, action: "toggle_event" })}>{event.suspended ? "เปิดใช้งาน" : "ระงับอีเวนต์"}</button></td></tr>)}</tbody></table>{data && !data.events.length && <p>ยังไม่มีอีเวนต์</p>}</div></section></>}
      {section === "audit" && <><h1>Audit Log</h1><section className={styles.panel}><p>ประวัติล่าสุด 200 รายการ</p><div className={styles.scroll}><table><thead><tr><th>เวลา</th><th>การดำเนินการ</th><th>รายการ</th></tr></thead><tbody>{data?.audit.map((entry) => <tr key={entry.id}><td>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(entry.created_at))}</td><td>{entry.action}</td><td>{entry.target}</td></tr>)}</tbody></table>{data && !data.audit.length && <p>ยังไม่มีการเปลี่ยนแปลง</p>}</div></section></>}
      {section === "security" && <><h1>ความปลอดภัย</h1><section className={styles.panel}><h2>บัญชีผู้ดูแลระบบ</h2><p>{data?.accounts.filter((account) => account.role === "system_admin" && !account.suspended).length ?? "…"} บัญชี · ป้องกันการระงับและลบบัญชีผู้ดูแล</p><h2>รอเปลี่ยนรหัสผ่านครั้งแรก</h2><p>{data?.accounts.filter((account) => account.must_change_password && !account.suspended).length ?? "…"} บัญชี</p></section></>}
    </div></main>
  </div>;
}
