import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Check, GraduationCap, Calendar, Building2, Layers } from 'lucide-react';
import { ClassConfig } from '../types';
import { GlassSelect, SelectOption } from './GlassSelect';

interface ClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  onSave: (newConfig: ClassConfig) => void;
}

export const ClassSettingsModal: React.FC<ClassSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [grade, setGrade] = useState(config.grade || '8');
  const [section, setSection] = useState(config.section || 'A2');
  const [className, setClassName] = useState(config.className || '8A2');
  const [schoolYear, setSchoolYear] = useState(config.schoolYear || '2026 - 2027');
  const [schoolName, setSchoolName] = useState(config.schoolName || 'TRƯỜNG THCS ...');

  // Update form when prop config changes
  useEffect(() => {
    setGrade(config.grade || '8');
    setSection(config.section || 'A2');
    setClassName(config.className || `${config.grade || '8'}${config.section || 'A2'}`);
    setSchoolYear(config.schoolYear || '2026 - 2027');
    setSchoolName(config.schoolName || 'TRƯỜNG THCS ...');
  }, [config, isOpen]);

  // When grade or section changes, auto update combined className
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setClassName(`${newGrade}${section}`);
  };

  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    setClassName(`${grade}${newSection}`);
  };

  const handleSave = () => {
    onSave({
      grade,
      section,
      className: className.trim() || `${grade}${section}`,
      schoolYear,
      schoolName: schoolName.trim() || 'TRƯỜNG THCS ...',
    });
    onClose();
  };

  // Grade Options (6 -> 9)
  const gradeOptions: SelectOption[] = [
    { value: '6', label: 'Khối 6', badge: 'Lớp 6', badgeColor: 'bg-blue-500/20 text-blue-300' },
    { value: '7', label: 'Khối 7', badge: 'Lớp 7', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
    { value: '8', label: 'Khối 8', badge: 'Lớp 8', badgeColor: 'bg-purple-500/20 text-purple-300' },
    { value: '9', label: 'Khối 9', badge: 'Lớp 9 (Cuối cấp)', badgeColor: 'bg-amber-500/20 text-amber-300' },
  ];

  // Section Options (A1 -> A5)
  const sectionOptions: SelectOption[] = [
    { value: 'A1', label: 'Lớp A1', badge: 'A1' },
    { value: 'A2', label: 'Lớp A2', badge: 'A2' },
    { value: 'A3', label: 'Lớp A3', badge: 'A3' },
    { value: 'A4', label: 'Lớp A4', badge: 'A4' },
    { value: 'A5', label: 'Lớp A5', badge: 'A5' },
  ];

  // Calculate School Years dynamically from 2026 - 2027 to 9th grade completion year
  const startYear = 2026;
  const currentGradeNum = parseInt(grade, 10) || 8;
  const yearsTo9th = 9 - currentGradeNum; // remaining years until grade 9

  const schoolYearOptions: SelectOption[] = [];
  for (let i = 0; i <= Math.max(yearsTo9th, 4); i++) {
    const y1 = startYear + i;
    const y2 = y1 + 1;
    const yearStr = `${y1} - ${y2}`;
    
    let sublabel = '';
    const correspondingGrade = currentGradeNum + i;
    if (correspondingGrade <= 9) {
      sublabel = correspondingGrade === 9 ? 'Năm học Lớp 9 (Tốt nghiệp THCS)' : `Năm học Lớp ${correspondingGrade}`;
    } else {
      sublabel = `Năm học tiếp theo`;
    }

    schoolYearOptions.push({
      value: yearStr,
      label: yearStr,
      sublabel,
      badge: correspondingGrade <= 9 ? `Lớp ${correspondingGrade}` : undefined,
      badgeColor: correspondingGrade === 9 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300',
    });
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 text-white relative overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-bold display-font text-white">Cài Đặt Lớp & Năm Học</h2>
                <p className="text-xs text-slate-300">Cấu hình đồng bộ thông tin lớp học toàn hệ thống</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="py-6 space-y-5 relative z-10 max-h-[70vh] overflow-y-auto pr-1">
            {/* Grade Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Chọn Khối Lớp (Từ 6 - 9):
              </label>
              <GlassSelect
                value={grade}
                onChange={(val) => handleGradeChange(String(val))}
                options={gradeOptions}
                size="lg"
                className="w-full"
              />
            </div>

            {/* Section Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                Chọn Lớp (Từ A1 - A5):
              </label>
              <GlassSelect
                value={section}
                onChange={(val) => handleSectionChange(String(val))}
                options={sectionOptions}
                size="lg"
                className="w-full"
              />
            </div>

            {/* Combined Class Name Display / Edit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Tên Lớp Đầy Đủ:</span>
                <span className="text-[10px] text-blue-400 font-normal">Tự động kết hợp ({grade} + {section})</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ví dụ: 8A2"
                className="w-full px-4 py-3 rounded-2xl glass-input text-white font-bold text-base focus:ring-2 focus:ring-blue-500 outline-none border border-white/10"
              />
            </div>

            {/* School Year Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Chọn Năm Học (Từ 2026 - 2027 đến Lớp 9):
              </label>
              <GlassSelect
                value={schoolYear}
                onChange={(val) => setSchoolYear(String(val))}
                options={schoolYearOptions}
                size="lg"
                className="w-full"
              />
              <p className="text-[11px] text-slate-400 italic">
                Lộ trình học tập kéo dài từ 2026 - 2027 đến khi hoàn thành chương trình Lớp 9.
              </p>
            </div>

            {/* School Name Input */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Tên Trường THCS (Hiển thị trong Biên bản & Excel/Word):
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ví dụ: TRƯỜNG THCS LÊ QUÝ ĐÔN"
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none border border-white/10"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3 relative z-10">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Hủy
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Lưu & Đồng Bộ</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
