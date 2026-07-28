import React, { useState, useEffect } from 'react';
import { 
  Users, CalendarDays, ClipboardList, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, Zap, FileSpreadsheet, FileText, Award,
  ArrowRight, Activity, TrendingUp, BarChart3, BookOpen, Crown, Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  Student, ShiftAssignment, StudentDutyRecord, PenaltyRecord, 
  TabType, DayType, ShiftType, ClassConfig
} from '../types';
import { cn } from '../lib/utils';
import { DAYS, SHIFTS } from '../lib/exportUtils';

interface HomeTabProps {
  currentWeek: number;
  students: Student[];
  shiftAssignments: ShiftAssignment[];
  dutyRecords: StudentDutyRecord[];
  penalties: PenaltyRecord[];
  classConfig?: ClassConfig;
  onNavigateTab: (tab: TabType) => void;
  onAutoGeneratePenalties: () => void;
  onExportExcel: () => void;
  onExportWord: () => void;
  onOpenSettings?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  currentWeek,
  students,
  shiftAssignments,
  dutyRecords,
  penalties,
  classConfig,
  onNavigateTab,
  onAutoGeneratePenalties,
  onExportExcel,
  onExportWord,
  onOpenSettings,
}) => {
  // Clock state
  const [timeString, setTimeString] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours >= 5 && hours < 12) {
        setGreeting('Chào buổi sáng');
      } else if (hours >= 12 && hours < 18) {
        setGreeting('Chào buổi chiều');
      } else {
        setGreeting('Chào buổi tối');
      }

      setTimeString(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to get shift assignment for a given day, shift, and week
  const getShiftAssignment = (day: DayType, shift: ShiftType, week: number) => {
    const exact = shiftAssignments.find(a => a.day === day && a.shift === shift && a.week === week);
    if (exact) return exact;
    return shiftAssignments.find(a => a.day === day && a.shift === shift && (!a.week || a.week === 1));
  };

  // Compute key statistics accurately across all 10 shifts (5 days x 2 shifts) in currentWeek
  let totalAssignedDutySlots = 0;
  let completedAssignedDutySlots = 0;
  let uncompletedAssignedDutySlots = 0;

  // Daily breakdown map for currentWeek
  const dailyStatsMap: Record<DayType, { total: number; completed: number; sangTeam: number; chieuTeam: number }> = {
    'Thứ 2': { total: 0, completed: 0, sangTeam: 0, chieuTeam: 0 },
    'Thứ 3': { total: 0, completed: 0, sangTeam: 0, chieuTeam: 0 },
    'Thứ 4': { total: 0, completed: 0, sangTeam: 0, chieuTeam: 0 },
    'Thứ 5': { total: 0, completed: 0, sangTeam: 0, chieuTeam: 0 },
    'Thứ 6': { total: 0, completed: 0, sangTeam: 0, chieuTeam: 0 },
  };

  DAYS.forEach(day => {
    SHIFTS.forEach(shift => {
      const assignment = getShiftAssignment(day, shift, currentWeek);

      if (assignment && assignment.team > 0) {
        if (shift === 'Sáng') dailyStatsMap[day].sangTeam = assignment.team;
        if (shift === 'Chiều') dailyStatsMap[day].chieuTeam = assignment.team;

        const teamStudents = students.filter(s => s.team === assignment.team);
        if (teamStudents.length > 0) {
          totalAssignedDutySlots += teamStudents.length;
          dailyStatsMap[day].total += teamStudents.length;

          teamStudents.forEach(st => {
            const recordId = currentWeek === 1 ? `${day}-${shift}-${st.id}` : `w${currentWeek}-${day}-${shift}-${st.id}`;
            const record = dutyRecords.find(
              r => r.id === recordId || (r.day === day && r.shift === shift && r.studentId === st.id && (r.week || 1) === currentWeek)
            );
            if (record && record.status === 'Đã hoàn thành') {
              completedAssignedDutySlots++;
              dailyStatsMap[day].completed++;
            } else if (record && record.status === 'Chưa hoàn thành') {
              uncompletedAssignedDutySlots++;
            }
          });
        }
      }
    });
  });

  const completionPercentage = totalAssignedDutySlots > 0
    ? Math.round((completedAssignedDutySlots / totalAssignedDutySlots) * 100)
    : 0;

  const weekPenalties = penalties.filter(p => (p.week || 1) === currentWeek);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 pb-12">
      {/* 1. HERO BANNER & REALTIME STATS */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/40 to-indigo-950/40 shadow-2xl"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Trang Chủ • Lớp {classConfig?.className || '8A2'} • NH {classConfig?.schoolYear || '2026 - 2027'} • Tuần {currentWeek}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-full border border-white/5">
                <Clock className="w-3 h-3 text-slate-400" />
                {timeString}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl display-font font-extrabold text-white tracking-tight">
              {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Giáo Viên Lớp {classConfig?.className || '8A2'}!</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Tổng quan tình hình nề nếp, trực nhật lao động Lớp {classConfig?.className || '8A2'} (Năm học {classConfig?.schoolYear || '2026 - 2027'}) toàn Tuần {currentWeek}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
            {onOpenSettings && (
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenSettings}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-[0_4px_14px_rgba(147,51,234,0.3)] border border-white/10 transition-all"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span>Cài Đặt Lớp</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigateTab('tracking')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-[0_4px_14px_rgba(59,130,246,0.3)] border border-white/10 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Bảng Trực Tuần</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigateTab('penalties')}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-[0_4px_14px_rgba(239,68,68,0.3)] border border-white/10 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Phiếu Xử Phạt</span>
            </motion.button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3 bg-black/20">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Sĩ Số Lớp</p>
              <p className="text-xl sm:text-2xl font-bold text-white display-font">{students.length} <span className="text-xs font-normal text-slate-400">HS</span></p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3 bg-black/20">
            <div className={cn(
              "p-3 rounded-xl shrink-0 border",
              completionPercentage >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            )}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Trực Nhật Tuần {currentWeek}</p>
              <p className="text-xl sm:text-2xl font-bold text-white display-font">{completionPercentage}%</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3 bg-black/20">
            <div className={cn(
              "p-3 rounded-xl shrink-0 border",
              weekPenalties.length === 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
            )}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Vi Phạm Tuần {currentWeek}</p>
              <p className="text-xl sm:text-2xl font-bold text-white display-font">{weekPenalties.length} <span className="text-xs font-normal text-slate-400">lượt</span></p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3 bg-black/20">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Tổng Ca Cả Tuần</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-300 display-font">{totalAssignedDutySlots} <span className="text-xs font-normal text-slate-400">lượt HS</span></p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. QUICK ACTIONS BAR */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between glass-card p-3.5 rounded-2xl border border-white/10">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" /> Thao Tác Nhanh:
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateTab('tracking')}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5 text-blue-400" /> Bảng Trực Tuần
          </button>
          <button
            onClick={() => onNavigateTab('shifts')}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" /> Phân Công Ca
          </button>
          <button
            onClick={onAutoGeneratePenalties}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-300 border border-red-500/20 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Lập Phạt Tự Động
          </button>
          <button
            onClick={() => onNavigateTab('ratings')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-300 border border-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" /> Xếp Loại Tuần
          </button>
          <button
            onClick={() => onNavigateTab('conduct')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Hạnh Kiểm
          </button>
          <button
            onClick={() => onNavigateTab('documents')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-medium text-indigo-300 border border-indigo-500/20 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Nhật Ký & Biên Bản
          </button>
          <button
            onClick={() => onNavigateTab('officers')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-300 border border-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Sơ Đồ Cán Sự
          </button>
          <button
            onClick={onExportExcel}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
          </button>
          <button
            onClick={onExportWord}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-xs font-medium text-blue-300 border border-blue-500/20 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" /> Word
          </button>
        </div>
      </div>

      {/* 3. FULL-WEEK DUTY PROGRESS OVERVIEW (10 SHIFTS TOTAL: MON - FRI) */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white display-font flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Tiến Độ Trực Nhật Cả Tuần {currentWeek}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tổng hợp 10 ca trực toàn tuần (Thứ 2 đến Thứ 6 • Ca Sáng & Ca Chiều)</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
            {completedAssignedDutySlots}/{totalAssignedDutySlots} Lượt Đạt ({completionPercentage}%)
          </span>
        </div>

        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-2 font-medium">
              <span className="text-slate-300">Tỷ lệ hoàn thành nhiệm vụ cả tuần</span>
              <span className="text-emerald-400 font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-black/40 border border-white/5 overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              />
            </div>
          </div>

          {/* Full Week 3-box summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-300 font-medium">Đã hoàn thành</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{completedAssignedDutySlots} <span className="text-xs font-normal text-slate-400">lượt HS</span></p>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-300 font-medium">Chưa hoàn thành (Vi phạm)</p>
              <p className="text-xl font-bold text-red-400 mt-1">{uncompletedAssignedDutySlots} <span className="text-xs font-normal text-slate-400">lượt HS</span></p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 font-medium">Chờ trực / Chưa tới lượt</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{Math.max(0, totalAssignedDutySlots - completedAssignedDutySlots - uncompletedAssignedDutySlots)} <span className="text-xs font-normal text-slate-400">lượt HS</span></p>
            </div>
          </div>

          {/* 5-Day Weekly Grid Breakdown */}
          <div className="pt-3 border-t border-white/5">
            <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Tình hình từng ngày trong tuần {currentWeek}:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {DAYS.map(day => {
                const dayData = dailyStatsMap[day];
                const dayPct = dayData.total > 0 ? Math.round((dayData.completed / dayData.total) * 100) : 0;

                return (
                  <div key={day} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-1.5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <span className="font-bold text-white">{day}</span>
                      <span className="text-[10px] font-bold text-emerald-400">{dayPct}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Sáng: {dayData.sangTeam > 0 ? `Tổ ${dayData.sangTeam}` : '--'}</p>
                    <p className="text-[11px] text-slate-400">Chiều: {dayData.chieuTeam > 0 ? `Tổ ${dayData.chieuTeam}` : '--'}</p>
                    <p className="text-[10px] text-slate-300 font-semibold pt-1">Đạt: {dayData.completed}/{dayData.total}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT PENALTY ACTIVITY FEED FOR CURRENT WEEK */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white display-font flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Nhật Ký Vi Phạm Tuần {currentWeek}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Danh sách phiếu phạt đã lập trong tuần hiện tại</p>
          </div>

          <button
            onClick={() => onNavigateTab('penalties')}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl transition-colors"
          >
            Quản lý phiếu phạt <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {weekPenalties.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic glass-panel rounded-2xl">
            🎉 Không có vi phạm nào trong Tuần {currentWeek}! Kỷ luật nề nếp lớp rất tốt.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {weekPenalties.map(p => {
              const student = students.find(s => s.id === p.studentId);

              return (
                <div 
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center font-bold text-red-300 text-xs shrink-0">
                      {student?.name ? student.name.slice(0, 1) : '!'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{student?.name || 'Học sinh'}</p>
                      <p className="text-[11px] text-slate-400">{p.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-red-400 font-bold text-xs bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                      -{p.deduction}đ
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">{p.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
