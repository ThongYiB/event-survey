"use client";

import { useState, type FormEvent } from "react";
import { ScreenHeading } from "./shell";
import { saveLocal, useSaved } from "./store";
import styles from "./manager.module.css";

const permissions = ["ค้นหาผู้ลงทะเบียน", "เช็กอิน", "ลงทะเบียน Walk-in"];

type Staff = { name: string; email: string; access: string[] };
const initialTeam: Staff[] = [
  { name: "ต้น", email: "ton@example.com", access: ["เช็กอิน", "ลงทะเบียน Walk-in"] },
  { name: "ณิชา", email: "nicha@example.com", access: ["ค้นหาผู้ลงทะเบียน", "เช็กอิน"] },
  { name: "อร", email: "orn@example.com", access: [] },
];

export function TeamManagement() {
  const team = useSaved("team", initialTeam);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();
  const visible = team.filter((item) => (item.name + " " + item.email).toLowerCase().includes(query.trim().toLowerCase()));

  function save(next: Staff[], text: string) {
    if (!saveLocal("team", next)) {
      setFeedback({ text: "บันทึกในเบราว์เซอร์ไม่ได้", error: true });
      return;
    }
    setEditing(null);
    setFeedback({ text });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim().toLowerCase();
    if (!name || (editing === "new" && team.some((item) => item.email === email))) {
      setFeedback({ text: name ? "มีอีเมลนี้ในทีมแล้ว" : "กรุณากรอกชื่อทีมงาน", error: true });
      return;
    }
    const staff = { name, email, access: form.getAll("access").map(String) };
    save(editing === "new" ? [...team, staff] : team.map((item) => item.email === email ? staff : item), "บันทึกทีมงานแล้ว");
    setQuery("");
  }

  return (
    <>
      <ScreenHeading title="ทีมงานประจำอีเวนต์" description="สิทธิ์มีผลเฉพาะอีเวนต์นี้">
        <button onClick={() => { setEditing("new"); setFeedback(undefined); }}>＋ เพิ่มทีมงาน</button>
      </ScreenHeading>
      {feedback && <p className={feedback.error ? styles.error : styles.notice} role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}
      {editing && <form key={editing === "new" ? editing : editing.email} className={styles.panel} onSubmit={submit}>
        <h2>{editing === "new" ? "เพิ่มทีมงาน" : "แก้ไขสิทธิ์ทีมงาน"}</h2>
        <div className={styles.fields}>
          <label>ชื่อทีมงาน<input name="name" required defaultValue={editing === "new" ? "" : editing.name} /></label>
          <label>อีเมล<input name="email" type="email" required readOnly={editing !== "new"} defaultValue={editing === "new" ? "" : editing.email} /></label>
        </div>
        <fieldset>
          <legend>สิทธิ์ในงานนี้</legend>
          {permissions.map((permission) => (
            <label className={styles.check} key={permission}><input type="checkbox" name="access" value={permission} defaultChecked={editing !== "new" && editing.access.includes(permission)} />{permission}</label>
          ))}
        </fieldset>
        <div className={styles.item}><button>บันทึกทีมงาน</button><button type="button" className={styles.secondary} onClick={() => setEditing(null)}>ยกเลิก</button></div>
      </form>}
      <section className={styles.panel}>
        <h2>รายชื่อทีมงาน</h2>
        <label>ค้นหาทีมงาน<input type="search" placeholder="ชื่อหรืออีเมล Staff" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div className={styles.scroll}>
          <table>
            <thead><tr><th>ทีมงาน</th><th>สิทธิ์ในงานนี้</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
            <tbody>{visible.map((staff) => (
              <tr key={staff.email}>
                <td><strong>{staff.name}</strong><small>{staff.email}</small></td>
                <td>{staff.access.join(" · ") || "ยังไม่ได้กำหนด"}</td>
                <td>{staff.access.length ? "มอบหมายแล้ว" : "ยังไม่มอบหมาย"}</td>
                <td><div className={styles.item}>
                  <button className={styles.secondary} onClick={() => { setEditing(staff); setFeedback(undefined); }}>{staff.access.length ? "แก้ไข" : "มอบหมาย"}</button>
                  {!!staff.access.length && <button className={styles.secondary} onClick={() => {
                    if (window.confirm(`ถอนสิทธิ์ของ ${staff.name} ในงานนี้หรือไม่?`)) save(team.map((item) => item.email === staff.email ? { ...item, access: [] } : item), "ถอนสิทธิ์แล้ว");
                  }}>ถอนสิทธิ์</button>}
                </div></td>
              </tr>
            ))}{!visible.length && <tr><td colSpan={4}>ไม่พบทีมงาน</td></tr>}</tbody>
          </table>
        </div>
      </section>
      <p className={styles.notice}>Staff ใช้สิทธิ์ค้นหา เช็กอิน และลงทะเบียน Walk-in เฉพาะงานที่ได้รับมอบหมาย</p>
    </>
  );
}

