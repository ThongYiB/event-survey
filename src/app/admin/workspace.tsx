"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import styles from "./admin.module.css";

const navigation = [
  { id: "accounts", label: "บัญชีผู้ใช้" },
  { id: "events", label: "กำกับดูแลงาน" },
  { id: "audit", label: "Audit Log" },
  { id: "security", label: "ความปลอดภัย" },
] as const;

type Account = {
  name: string;
  email: string;
  role: "System Admin" | "Event Manager" | "Staff";
  status: "ใช้งาน" | "รอเปลี่ยนรหัสผ่าน";
  suspended?: boolean;
  event: string;
};

const demoAccounts: Account[] = [
  { name: "อรุณ", email: "arun@example.com", role: "System Admin", status: "ใช้งาน", event: "ทุกอีเวนต์" },
  { name: "มินตรา", email: "min@example.com", role: "Event Manager", status: "ใช้งาน", event: "Creative Campus 2026" },
  { name: "ภาคิน", email: "pakin@example.com", role: "Event Manager", status: "ใช้งาน", event: "Design Meetup" },
  { name: "ธนกฤต", email: "tan@example.com", role: "Staff", status: "ใช้งาน", event: "Creative Campus 2026" },
  { name: "ณิชา", email: "nicha@example.com", role: "Staff", status: "ใช้งาน", event: "Creative Campus 2026" },
];

const demoEvents = [
  { id: "campus", name: "Creative Campus 2026", owner: "มินตรา", suspended: false },
  { id: "meetup", name: "Design Meetup", owner: "ภาคิน", suspended: false },
];

type AuditEntry = { action: string; target: string; time: string };

export function AdminWorkspace({ children }: { children: ReactNode }) {
  const section = useSelectedLayoutSegment();
  const current = navigation.find((item) => section === item.id);
  const [accounts, setAccounts] = useState(demoAccounts);
  const [events, setEvents] = useState(demoEvents);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");

  function record(action: string, target: string) {
    setAudit((entries) => [{ action, target, time: new Date().toISOString() }, ...entries]);
  }

  function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim().toLowerCase();
    if (!name) return setError("กรุณากรอกชื่อและนามสกุล");
    if (accounts.some((account) => account.email === email)) return setError("อีเมลนี้มีบัญชีอยู่แล้ว");
    event.currentTarget.reset();
    setAccounts((list) => [...list, { name, email, role: "Event Manager", status: "รอเปลี่ยนรหัสผ่าน", event: "ยังไม่มีอีเวนต์" }]);
    record("สร้างบัญชี Event Manager", email);
    setError("");
    setCreated(email);
    setCreating(false);
    setQuery("");
    setFilter("ทั้งหมด");
  }

  function toggleAccount(account: Account) {
    if (account.role === "System Admin") return;
    setAccounts((list) => list.map((item) => item.email === account.email
      ? { ...item, suspended: !item.suspended }
      : item));
    record(account.suspended ? "คืนสิทธิ์บัญชี" : "ระงับบัญชี", account.email);
  }

  const visibleAccounts = accounts.filter((account) =>
    (filter === "ทั้งหมด" || account.role === filter) &&
    (account.name + " " + account.email).toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span aria-hidden="true">ES</span><strong>Event Survey</strong></div>
        <div className={styles.role}>System Admin</div>
        <nav aria-label="เมนู System Admin">
          {navigation.map((item) => (
            <Link key={item.id} href={"/admin/" + item.id} aria-current={current?.id === item.id ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className={styles.exit} href="/login">กลับหน้าเข้าสู่ระบบ</Link>
      </aside>
      <main className={styles.workspace}>
        <div className={styles.topbar}>พื้นที่ทดลอง / System Admin</div>
        <div className={styles.content}>
          {children}
          {current?.id === "accounts" && <>
            <header className={styles.heading}>
              <div><h1>บัญชีผู้ใช้และบทบาท</h1><p>สร้างบัญชี Event Manager และจัดการสถานะบัญชี</p></div>
              <button type="button" onClick={() => { setCreating(true); setCreated(""); setError(""); }}>＋ สร้างบัญชี Event Manager</button>
            </header>
            {creating && <section className={styles.panel} aria-labelledby="create-account">
              <h2 id="create-account">สร้างบัญชี Event Manager</h2>
              <form method="post" onSubmit={createAccount} className={styles.form}>
                <label>ชื่อและนามสกุล *<input name="name" maxLength={100} required /></label>
                <label>อีเมล *<input type="email" name="email" maxLength={254} placeholder="manager@example.com" required /></label>
                <label>รหัสผ่านชั่วคราว *<input type="password" name="password" autoComplete="new-password" minLength={8} required /></label>
                <p className={styles.note}>บัญชีได้รับสิทธิ์ Event Manager สำหรับสร้างและจัดการอีเวนต์ของตนเอง โดยต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก ใช้รหัสผ่านสมมติสำหรับทดลอง</p>
                {error && <p role="alert" className={styles.error}>{error}</p>}
                <div className={styles.actions}>
                  <button type="button" className={styles.secondary} onClick={() => setCreating(false)}>ยกเลิก</button>
                  <button type="submit">สร้างบัญชี</button>
                </div>
              </form>
            </section>}
            {created && <p role="status" className={styles.note}>สร้างบัญชีตัวอย่าง {created} แล้ว · รอเปลี่ยนรหัสผ่านครั้งแรก</p>}
            <section className={styles.panel}>
              <h2>บัญชีในระบบ</h2>
              <div className={styles.filters}>
                <label>ค้นหาบัญชี<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" /></label>
                <label>บทบาท<select value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option>ทั้งหมด</option><option>System Admin</option><option>Event Manager</option><option>Staff</option>
                </select></label>
              </div>
              <div className={styles.scroll}>
                <table>
                  <thead><tr><th scope="col">บัญชี</th><th scope="col">บทบาท</th><th scope="col">อีเวนต์</th><th scope="col">สถานะ</th><th scope="col">จัดการ</th></tr></thead>
                  <tbody>
                    {visibleAccounts.map((account) => <tr key={account.email}>
                      <td><strong>{account.name}</strong><small>{account.email}</small></td><td>{account.role}</td><td>{account.event}</td><td>{account.suspended ? "ระงับ" : account.status}</td>
                      <td>{account.role === "System Admin" ? "บัญชีผู้ดูแล" : <button type="button" className={styles.secondary} onClick={() => toggleAccount(account)}>{account.suspended ? "คืนสิทธิ์" : "ระงับ"}</button>}</td>
                    </tr>)}
                    {!visibleAccounts.length && <tr><td colSpan={5}>ไม่พบบัญชีที่ตรงกับการค้นหา</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>}
          {current?.id === "events" && <>
            <header className={styles.heading}><div><h1>กำกับดูแลงาน</h1><p>ตรวจสอบเจ้าของงานและสถานะการเปิดใช้งาน</p></div></header>
            <section className={styles.panel}><div className={styles.scroll}><table>
              <thead><tr><th scope="col">อีเวนต์</th><th scope="col">Event Manager</th><th scope="col">สถานะ</th><th scope="col">จัดการ</th></tr></thead>
              <tbody>{events.map((event) => <tr key={event.id}>
                <td>{event.name}</td><td>{event.owner}</td><td>{event.suspended ? "ระงับ" : "เปิดใช้งาน"}</td>
                <td><button type="button" className={styles.secondary} onClick={() => {
                  setEvents((list) => list.map((item) => item.id === event.id ? { ...item, suspended: !item.suspended } : item));
                  record(event.suspended ? "เปิดใช้งานอีเวนต์" : "ระงับอีเวนต์", event.name);
                }}>{event.suspended ? "เปิดใช้งาน" : "ระงับอีเวนต์"}</button></td>
              </tr>)}</tbody>
            </table></div></section>
          </>}
          {current?.id === "audit" && <>
            <header className={styles.heading}><div><h1>Audit Log</h1><p>ประวัติการเปลี่ยนแปลงบัญชีและอีเวนต์ในการทดลองครั้งนี้</p></div></header>
            <section className={styles.panel}><div className={styles.scroll}><table>
              <thead><tr><th scope="col">เวลา (ไทย)</th><th scope="col">การดำเนินการ</th><th scope="col">รายการ</th></tr></thead>
              <tbody>{audit.map((entry, index) => <tr key={index}>
                <td>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(entry.time))}</td><td>{entry.action}</td><td>{entry.target}</td>
              </tr>)}{!audit.length && <tr><td colSpan={3}>ยังไม่มีการเปลี่ยนแปลง</td></tr>}</tbody>
            </table></div></section>
          </>}
          {current?.id === "security" && <>
            <header className={styles.heading}><div><h1>ความปลอดภัย</h1><p>สถานะผู้ดูแลและบัญชีที่ต้องเปลี่ยนรหัสผ่าน</p></div></header>
            <section className={styles.panel}>
              <h2>บัญชีผู้ดูแลระบบ</h2>
              <p className={styles.note}>System Admin ที่ใช้งานอยู่ {accounts.filter((item) => item.role === "System Admin" && item.status === "ใช้งาน").length} บัญชี · ป้องกันการระงับบัญชีผู้ดูแลในตัวอย่าง</p>
              <h2>รอเปลี่ยนรหัสผ่านครั้งแรก</h2>
              <p>{accounts.filter((item) => !item.suspended && item.status === "รอเปลี่ยนรหัสผ่าน").length} บัญชี Event Manager</p>
            </section>
          </>}
        </div>
      </main>
    </div>
  );
}

