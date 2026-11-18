'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import { Monitor, Plus, ArrowUp, ArrowDown, Clock, Save, Play, Image as ImageIcon } from 'lucide-react';

export default function KioskPage() {
  const [selectedScreens, setSelectedScreens] = useState(['ทางเข้าหลัก', 'หน้าฮอลล์ A']);

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 h-full">
      <Header 
        title="จอประชาสัมพันธ์ (Kiosk)" 
        breadcrumb="Creative Campus 2026 / จัดการโฆษณาบนจอภายในงาน" 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Action Header */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">ต้นแบบหน้าจอ - ไม่เชื่อมระบบจริง</span>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              บันทึกร่าง
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm flex items-center gap-1.5">
              <Play className="w-4 h-4 fill-current" /> เผยแพร่ขึ้นจอ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ad Queue Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Queue List */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-bold text-gray-900">คิวโฆษณา</h4>
                <button className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> เพิ่มรูปหรือวิดีโอ
                </button>
              </div>

              <div className="space-y-3">
                {/* Queue Item 1 */}
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-400 text-sm">1</span>
                    <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      CC26
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">โปสเตอร์งาน</p>
                      <p className="text-xs text-gray-500">แสดงผล 10 วินาที</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <button className="p-1 hover:text-gray-700"><ArrowUp className="w-4 h-4" /></button>
                    <button className="p-1 hover:text-gray-700"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Queue Item 2 */}
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-400 text-sm">2</span>
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      SPON
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">โฆษณาสปอนเซอร์</p>
                      <p className="text-xs text-gray-500">แสดงผล 15 วินาที</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <button className="p-1 hover:text-gray-700"><ArrowUp className="w-4 h-4" /></button>
                    <button className="p-1 hover:text-gray-700"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 italic">เล่นตามลำดับแล้ววนซ้ำ</p>
            </div>

            {/* Display Target & Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Screens */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 border-b pb-2 text-sm">จอที่จะแสดง</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" /> ทางเข้าหลัก
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" /> หน้าฮอลล์ A
                  </label>
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-teal-600" /> หน้าฮอลล์ B
                  </label>
                </div>
                <p className="text-xs text-teal-600 font-medium pt-2">เลือกแล้ว {selectedScreens.length} จอ</p>
              </div>

              {/* Schedule */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 border-b pb-2 text-sm">กำหนดวันและเวลา</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1">เริ่มแสดง</span>
                    <input type="text" defaultValue="25 พ.ย. 2569 - 09:00" className="w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">สิ้นสุด</span>
                    <input type="text" defaultValue="25 พ.ย. 2569 - 18:00" className="w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">เวลาไทย (ICT)</p>
              </div>
            </div>
          </div>

          {/* Screen Live Preview */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2">ตัวอย่างบนจอ (Preview)</h4>
            
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative text-white flex flex-col justify-between p-6 shadow-inner">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-teal-600/80 px-2 py-0.5 rounded">Event Survey</span>
                <span className="text-[10px] text-gray-400">คิว 1/2</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-teal-400">Creative Campus 2026</h3>
                <p className="text-xs text-gray-300">25 พ.ย. หอประชุมมหาวิทยาลัย</p>
              </div>

              <div className="flex justify-between items-center border-t border-gray-800 pt-3 text-[10px] text-gray-400">
                <span>เล่นคิวอัตโนมัติ</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
