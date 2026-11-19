# report.tsx — Incoming prototype

Source commit: e29fb1e93d685c11cd7aa2608e3592ae3380f213

Original incoming source, retained without edits for review and later UI integration.

```tsx
'use client';

import React from 'react';
import Header from '@/components/Header';
import { Download, FileText, FileSpreadsheet, Star, MessageSquareQuote, CheckSquare, PieChart } from 'lucide-react';

export default function ReportsPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 h-full">
      <Header 
        title="Dashboard แบบประเมิน" 
        breadcrumb="Creative Campus 2026 - ผู้เข้าร่วม 186 คน - 124 คำตอบ" 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Export Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">ส่งออกข้อมูล:</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">ตัวอย่างการส่งออกเท่านั้น ไม่มีการดาวน์โหลดไฟล์จริง</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <FileText className="w-4 h-4" /> PDF (ตัวอย่าง)
            </button>
            <button className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> CSV (ตัวอย่าง)
            </button>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-sm font-medium text-gray-500">อัตราการตอบ</span>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-teal-600">66.7%</p>
              <span className="text-xs text-gray-400">124 จาก 186 คน</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">จากผู้เข้าร่วม 186 คน</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-sm font-medium text-gray-500">คะแนนเฉลี่ย</span>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">3.52 <span className="text-base text-gray-400">/4</span></p>
              <div className="flex text-amber-400"><Star className="w-5 h-5 fill-current" /></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">สเกลความพึงพอใจ 4 ระดับ</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-sm font-medium text-gray-500">ความพึงพอใจ</span>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-emerald-600">90.3%</p>
              <span className="text-xs text-emerald-600 font-medium">ดี-ดีมาก</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">112 จาก 124 คน</p>
          </div>
        </div>

        {/* Survey Breakdown Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single Choice Result */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-3">ความพึงพอใจโดยรวม <span className="text-xs font-normal text-gray-500">(คำถามเลือกข้อเดียว - ผู้ตอบ 124 คน)</span></h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">ดีมาก</span>
                  <span className="text-gray-600">78 คน / 62.9%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-teal-600 h-3 rounded-full" style={{ width: '62.9%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">ดี</span>
                  <span className="text-gray-600">34 คน / 27.4%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-teal-400 h-3 rounded-full" style={{ width: '27.4%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">พอใช้</span>
                  <span className="text-gray-600">10 คน / 8.1%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-amber-400 h-3 rounded-full" style={{ width: '8.1%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">ควรปรับปรุง</span>
                  <span className="text-gray-600">2 คน / 1.6%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-red-400 h-3 rounded-full" style={{ width: '1.6%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-right text-gray-400 mt-2">รวม 124 คำตอบ 100%</p>
          </div>

          {/* Multiple Choice Result */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-3">กิจกรรมที่ผู้ตอบชอบ <span className="text-xs font-normal text-gray-500">(เลือกได้หลายข้อ - ผู้ตอบ 124 คน)</span></h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">เวิร์กช็อปสร้างสรรค์</span>
                  <span className="text-gray-600">92 คน / 74.2%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '74.2%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">เสวนาสร้างแรงบันดาลใจ</span>
                  <span className="text-gray-600">76 คน / 61.3%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-blue-400 h-3 rounded-full" style={{ width: '61.3%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">นิทรรศการนักศึกษา</span>
                  <span className="text-gray-600">61 คน / 49.2%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-indigo-400 h-3 rounded-full" style={{ width: '49.2%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-right text-gray-400 mt-2">ร้อยละคำนวณจาก 124 คน จึงรวมเกิน 100% ได้</p>
          </div>
        </div>

        {/* Qualitative Feedback */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <MessageSquareQuote className="w-5 h-5 text-teal-600" />
            <h4 className="font-bold text-gray-900">เสียงจากผู้เข้าร่วม <span className="text-xs font-normal text-gray-500">(ตัวอย่างคำตอบปลายเปิด จากฐานผู้ตอบ 124 คน)</span></h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 italic">
              "เวิร์กช็อปสนุก ได้ลองทำจริงและรู้จักเพื่อนใหม่"
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 italic">
              "อยากให้เพิ่มเวลาถาม-ตอบในช่วงเสวนา"
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 italic">
              "สถานที่เดินทางสะดวก ทีมงานให้คำแนะนำดีมาก"
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```
