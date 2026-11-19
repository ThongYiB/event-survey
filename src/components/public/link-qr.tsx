"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import styles from "./link-qr.module.css";

export function LinkQr({ path, label, downloadName, showTools = true }: { path: string; label: string; downloadName: string; showTools?: boolean }) {
  const [qr, setQr] = useState<{ image: string; url: string } | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    let active = true;
    const url = new URL(path, window.location.origin).href;
    void QRCode.toDataURL(url, { width: 600, margin: 2 }).then((image: string) => {
      if (active) { setQr({ image, url }); setError(false); }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [path]);
  return (
    <div className={styles.card}>
      <div className={styles.image}>
        {qr ? <img src={qr.image} alt={label} width={220} height={220} /> : <p role="status">{error ? "สร้าง QR ไม่สำเร็จ ใช้ลิงก์ด้านล่างได้" : "กำลังสร้าง QR…"}</p> /* eslint-disable-line @next/next/no-img-element */}
      </div>
      {showTools && qr && <>
        <label className={styles.url}>ลิงก์{label}<input readOnly value={qr.url} onFocus={(event) => event.currentTarget.select()} /></label>
        <div className={styles.actions}>
          <a href={qr.image} download={downloadName}>ดาวน์โหลด QR</a>
          <button type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(qr.url); setCopied("คัดลอกลิงก์แล้ว"); }
            catch { setCopied("เลือกและคัดลอกลิงก์จากช่องด้านบนได้"); }
          }}>คัดลอกลิงก์</button>
        </div>
      </>}
      <Link className={styles.link} href={path}>เปิด{label}</Link>
      {copied && <p role="status">{copied}</p>}
    </div>
  );
}
