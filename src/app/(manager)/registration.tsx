'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import { Search, Filter, CheckCircle, Clock, Eye, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkedIn: boolean;
  checkInTime?: string;
}

export default function AttendeesPage() {
  const [attendees] = useState<Attendee[]>([
    { id: 'CC26-0187', name: 'ปภาวี ใจดี', email: 'pa***@example.com', phone: '089-XXX-1234', checkedIn: true, checkInTime: '25 พ.ย. 09:12' },
    { id: 'CC26-0188', name: 'กวิน สร้างสรรค์', email: 'ka***@example.com', phone: '081-XXX-4421', checkedIn: false },
    { id: 'CC26-0189', name: 'ณัฐชา มีสุข', email: 'na***@example.com', phone: '086-XXX-8901', checkedIn: true, checkInTime: '25 พ.ย. 09:16' },
    { id: 'CC26-0190', name: 'วรินทร์ แสงดี', email: 'wa***@example.com', phone: 'ไม่ระบุโทรศัพท์', checkedIn: false },
    { id: 'CC26-0191', name: 'ภูวดล คิดดี', email: 'ph***@example.com', phone: '092-XXX-5577', checkedIn: true, checkInTime: '25 พ.ย. 09:25' },
  ]);

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 h-full">
      <Header 
        title="ผู้ลงทะเบียน" 
        breadcrumb="Creative Campus 2026 / ตรวจสอบรายชื่อและสถานะเช็กอิน" 
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header KPI Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-gray-500 font-medium">ลงทะเบียนทั้งหมด</span>
              <p className="text-xl font-bold text-gray-900">240 <span className="text-xs font-normal">คน</span></p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
              <span className="text-xs text-teal-600 font-medium">เช็กอินแล้ว</span>
              <p className="text-xl font-bold text-teal-600">186 <span className="text-xs font-normal">คน</span></p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
              <span className="text-xs text-orange-500 font-medium">ยังไม่เช็กอิน</span>
              <p className="text-xl font-bold text-orange-500">54 <span className="text-xs font-normal">คน</span></p>
            </div>
          </div>
          
          <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> ดูรายงาน
          </button>
        </div>

        {/* Controls & Search */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ รหัส หรือโทรศัพท์..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 outline-none focus:ring-2 focus:ring-teal-500">
              <option>ทุกสถานะ</option>
              <option>เช็กอินแล้ว</option>
              <option>ยังไม่เช็กอิน</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex justify-between">
            <span>รายชื่อสมมติ — แสดงข้อมูลติดต่อแบบปิดบัง</span>
            <span>ต้นแบบหน้าจอ - ไม่เชื่อมระบบจริง</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">รหัส / ชื่อ</th>
                  <th className="px-6 py-3.5">ข้อมูลติดต่อ</th>
                  <th className="px-6 py-3.5">สถานะ</th>
                  <th className="px-6 py-3.5">เวลาเช็กอิน</th>
                  <th className="px-6 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendees.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-gray-400 block">{row.id}</span>
                      <span className="font-semibold text-gray-900">{row.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 space-y-0.5">
                      <p>{row.email}</p>
                      <p className="text-gray-400">{row.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {row.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> เช็กอินแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> ยังไม่เช็กอิน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {row.checkInTime || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-teal-600 hover:text-teal-800 font-medium text-xs inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> ดูข้อมูล
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>แสดง 1-5 จาก 240 คน</span>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> ก่อนหน้า
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1">
                ถัดไป <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
