'use client';

import React from 'react';
import Header from '@/components/Header';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Edit, 
  FileText, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp 
} from 'lucide-react';

export default function OverviewPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 h-full">
      <Header 
        title="ภาพรวมอีเวนต์" 
        breadcrumb="ยินดีต้อนรับ คุณมินตรา / จัดการทุกขั้นตอนของงานในพื้นที่เดียว" 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Section: อีเวนต์ที่กำลังดู */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                  เปิดรับลงทะเบียน
                </span>
                <h3 className="text-2xl font-bold text-gray-900">Creative Campus 2026</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>25 พฤศจิกายน 2026 • 09:00 - 16:00</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>หอประชุมมหาวิทยาลัย</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                <Edit className="w-4 h-4" /> แก้ไขงาน
              </button>
              <button className="flex-1 md:flex-none px-4 py-2.5 bg-teal-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors shadow-sm">
                จัดการอีเวนต์ →
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-gray-100 bg-gray-50/50">
            <div className="p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">ลงทะเบียน</p>
              <p className="text-3xl font-bold text-gray-900">240 <span className="text-sm font-normal text-gray-500">คน</span></p>
            </div>
            <div className="p-6 border-b sm:border-b-0 lg:border-r border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">เช็กอินแล้ว</p>
              <p className="text-3xl font-bold text-teal-600">186 <span className="text-sm font-normal text-gray-500">คน</span></p>
            </div>
            <div className="p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">ตอบแบบสอบถาม</p>
              <p className="text-3xl font-bold text-blue-600">124 <span className="text-sm font-normal text-gray-500">คน</span></p>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">อัตราเข้าร่วม</p>
              <p className="text-3xl font-bold text-gray-900">77.5%</p>
              <p className="text-xs text-gray-400 mt-1">186 จาก 240 คน</p>
            </div>
          </div>
        </section>

        {/* Section: อีเวนต์ของคุณ */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">อีเวนต์ของคุณ</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2.5 py-1 bg-teal-100 text-teal-800 font-semibold rounded-full">ทั้งหมด 3</span>
                <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full">กำลังเปิดรับ 1</span>
                <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full">ฉบับร่าง 1</span>
                <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full">สิ้นสุดแล้ว 1</span>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่องาน..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" /> สร้างอีเวนต์
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">ชื่องาน / ข้อมูลจำลอง</th>
                    <th className="px-6 py-4">วันจัดงาน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4">ลงทะเบียน</th>
                    <th className="px-6 py-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">Creative Campus 2026</td>
                    <td className="px-6 py-4 text-gray-600">25 พ.ย. 2026</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        เปิดรับ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">240 คน</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 text-sm">
                        <button className="text-teal-600 hover:text-teal-800 font-medium">แก้ไข</button>
                        <span className="text-gray-300">•</span>
                        <button className="text-gray-600 hover:text-gray-900 font-medium">รายงาน</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">Design Meetup (สมมติ)</td>
                    <td className="px-6 py-4 text-gray-600">12 ธ.ค. 2026</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        ฉบับร่าง
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">0 คน</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-teal-600 hover:text-teal-800 font-medium">แก้ไข</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
