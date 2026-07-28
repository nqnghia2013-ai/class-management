import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, Check, GraduationCap, Calendar, Building2, Layers, 
  Monitor, Smartphone, Cpu, Database, Wifi, HardDrive, Info, Sparkles, 
  ShieldCheck, BarChart3, Users, ClipboardList, ShieldAlert, FileText, RefreshCw 
} from 'lucide-react';
import { ClassConfig, Student, ShiftAssignment, PenaltyRecord, ClassDocument } from '../types';
import { GlassSelect, SelectOption } from './GlassSelect';
import { User } from 'firebase/auth';

interface ClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  onSave: (newConfig: ClassConfig) => void;
  students?: Student[];
  shiftAssignments?: ShiftAssignment[];
  penalties?: PenaltyRecord[];
  classDocuments?: ClassDocument[];
  user?: User | null;
  onCheckForUpdates?: () => void;
}

export const ClassSettingsModal: React.FC<ClassSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  students = [],
  shiftAssignments = [],
  penalties = [],
  classDocuments = [],
  user = null,
  onCheckForUpdates,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'system'>('config');
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

  // Device & System Info detection
  const getDeviceInfo = () => {
    if (typeof window === 'undefined') return { deviceType: 'Máy tính', osName: 'Windows', browserName: 'Browser', screenRes: '1920x1080', isMobile: false };

    const ua = navigator.userAgent;
    let deviceType = 'Máy Tính / Laptop';
    let osName = 'Windows OS';
    let browserName = 'Google Chrome';
    let isMobile = false;

    // Mobile / Tablet check
    if (/android/i.test(ua)) {
      deviceType = 'Điện Thoại Di Động (Android)';
      osName = 'Android OS';
      isMobile = true;
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      deviceType = /ipad/i.test(ua) ? 'Máy Tính Bảng (iPad)' : 'Điện Thoại Di Động (iPhone)';
      osName = 'iOS';
      isMobile = true;
    } else if (/macintosh|mac os x/i.test(ua)) {
      deviceType = 'Máy Tính Mac (MacBook/iMac)';
      osName = 'macOS';
    } else if (/linux/i.test(ua)) {
      deviceType = 'Máy Tính Linux';
      osName = 'Linux OS';
    } else if (/windows/i.test(ua)) {
      deviceType = 'Máy Tính Cá Nhân (PC / Windows Laptop)';
      osName = 'Windows 11/10 OS';
    }

    // Browser check
    if (/edg/i.test(ua)) browserName = 'Microsoft Edge';
    else if (/chrome|crios/i.test(ua)) browserName = 'Google Chrome';
    else if (/firefox|fxios/i.test(ua)) browserName = 'Mozilla Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browserName = 'Apple Safari';
    else if (/opera|opr/i.test(ua)) browserName = 'Opera Browser';

    const screenRes = `${window.screen.width} x ${window.screen.height} px`;

    return {
      deviceType,
      osName,
      browserName,
      screenRes,
      isMobile,
    };
  };

  const deviceInfo = getDeviceInfo();

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
  const yearsTo9th = 9 - currentGradeNum;

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-card w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 text-white relative overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-bold display-font text-white">Cài Đặt Lớp & Thông Tin Hệ Thống</h2>
                <p className="text-xs text-slate-300">Cấu hình đồng bộ & chẩn đoán hệ thống Lớp Học Số</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection Bar */}
          <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10 mt-4 relative z-10">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'config'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cấu Hình Lớp & Năm Học</span>
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'system'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Thông Tin Hệ Thống & Số Liệu</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="py-5 space-y-5 relative z-10 max-h-[65vh] overflow-y-auto pr-1">
            {activeTab === 'config' ? (
              /* TAB 1: CLASS CONFIG */
              <div className="space-y-4">
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
            ) : (
              /* TAB 2: SYSTEM & DEVICE DIAGNOSTICS */
              <div className="space-y-4">
                {/* App Version Badge & Check for Updates Button */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-blue-900/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-300">Phiên bản Hệ thống</div>
                      <div className="text-xl font-black display-font text-white">Phiên bản 28.07.26</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onCheckForUpdates && (
                      <button
                        onClick={onCheckForUpdates}
                        className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md border border-white/20 flex items-center space-x-1.5 transition-all"
                        title="Kiểm tra và cập nhật phiên bản mới nhất"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>Kiểm Tra Bản Cập Nhật</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Device & Web Platform Info */}
                <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/10 pb-2">
                    {deviceInfo.isMobile ? <Smartphone className="w-4 h-4 text-blue-400" /> : <Monitor className="w-4 h-4 text-blue-400" />}
                    Thiết Bị & Môi Trường Đang Trình Duyệt Web:
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-slate-400 block font-semibold">Tên loại thiết bị:</span>
                      <span className="font-bold text-white block">{deviceInfo.deviceType}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-slate-400 block font-semibold">Hệ điều hành:</span>
                      <span className="font-bold text-blue-300 block">{deviceInfo.osName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-slate-400 block font-semibold">Trình duyệt Web:</span>
                      <span className="font-bold text-purple-300 block">{deviceInfo.browserName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-slate-400 block font-semibold">Độ phân giải màn hình:</span>
                      <span className="font-bold text-emerald-300 block">{deviceInfo.screenRes}</span>
                    </div>
                  </div>
                </div>

                {/* Cloud & Data Statistics */}
                <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/10 pb-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    Số Liệu Thống Kê Dữ Liệu Lớp Học:
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Sĩ số học sinh</span>
                      <span className="text-lg font-black text-white">{students.length} HS</span>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                      <ClipboardList className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Phân công ca trực</span>
                      <span className="text-lg font-black text-white">{shiftAssignments.filter(s => s.team > 0).length} ca</span>
                    </div>

                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <ShieldAlert className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Phiếu xử phạt</span>
                      <span className="text-lg font-black text-white">{penalties.length} phiếu</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <FileText className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Hồ sơ tài liệu</span>
                      <span className="text-lg font-black text-white">{classDocuments.length} hồ sơ</span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <Wifi className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Trạng thái Cloud</span>
                      <span className="text-xs font-bold text-amber-300">{user ? 'Realtime Firestore' : 'Lưu Offline'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <HardDrive className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Bộ nhớ lưu trữ</span>
                      <span className="text-xs font-bold text-purple-300">IndexedDB + Cloud</span>
                    </div>
                  </div>
                </div>

                {/* Account & Security status */}
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tài khoản Google đang kết nối:</span>
                  </div>
                  <span className="font-bold text-white truncate max-w-[200px]">
                    {user?.email || 'Chế độ Khách (Offline)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <div className="text-[11px] text-slate-400 italic">
              Lớp Học Số v28.07.26 • Lớp {className}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Hủy
              </button>
              {activeTab === 'config' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu & Đồng Bộ</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
