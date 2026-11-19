import Link from "next/link";

export function CloudFeaturePending({ title }: { title: string }) {
  return <section><h1>{title}</h1><p>ส่วนนี้กำลังเชื่อมข้อมูลกับ Supabase ในขั้นถัดไป ข้อมูลตัวอย่างในเครื่องยังถูกเก็บไว้และจะไม่ถูกนำมาใช้เป็นข้อมูลจริง</p><Link href="/manager">กลับไปจัดการอีเวนต์</Link></section>;
}
