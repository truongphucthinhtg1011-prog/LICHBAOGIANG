import React, { useState } from "react";
import { TeacherProfile } from "../types";
import { X, Save, School, User, Calendar } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
  onSave: (updated: TeacherProfile) => void;
}

export const TeacherProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<TeacherProfile>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Thông tin Giáo viên & Năm học
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Họ và tên giáo viên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nguyễn Văn An"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Tổ chuyên môn
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                placeholder="Tổ Toán - Tin học"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Tên trường học
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData({ ...formData, schoolName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                placeholder="Trường THCS Lê Quý Đôn"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Năm học
              </label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                placeholder="2025 - 2026"
              />
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50/60 p-4 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>Cấu hình tự động tính ngày theo tuần</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ngày Thứ 2 của Tuần 1
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDateSemester1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDateSemester1: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Hệ thống sẽ dựa vào ngày này để tự động tính ngày Thứ 2 - Thứ 6 cho tất cả các tuần.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tổng số tuần dạy trong năm
                </label>
                <select
                  value={formData.totalWeeks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalWeeks: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value={35}>35 tuần (Chuẩn năm học GDPT)</option>
                  <option value={37}>37 tuần (Bao gồm tuần dự phòng)</option>
                  <option value={18}>18 tuần (Chỉ tính Học kì 1)</option>
                  <option value={17}>17 tuần (Chỉ tính Học kì 2)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <Save className="h-4 w-4" />
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
