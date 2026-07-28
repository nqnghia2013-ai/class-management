import React from 'react';
import { motion } from 'motion/react';
import { Shield, Crown, BookOpen, ClipboardCheck, Users, Award, CheckCircle2, UserCheck, Star, Sparkles, Music } from 'lucide-react';
import { Student, TeamConfig, ClassOfficersConfig } from '../types';
import { SyncInput } from './SyncInputs';
import { cn } from '../lib/utils';

import { GlassSelect } from './GlassSelect';

interface ClassOfficersTabProps {
  students: Student[];
  officersConfig: ClassOfficersConfig;
  teamConfigs: TeamConfig[];
  className?: string;
  schoolYear?: string;
  onUpdateOfficersConfig: (updates: Partial<ClassOfficersConfig>) => void;
  onUpdateTeamConfig: (teamId: string, field: 'leader' | 'deputy', value: string) => void;
}

export function ClassOfficersTab({
  students,
  officersConfig,
  teamConfigs,
  className = '8A2',
  schoolYear = '2026 - 2027',
  onUpdateOfficersConfig,
  onUpdateTeamConfig,
}: ClassOfficersTabProps) {
  // Helper to render student dropdown or auto-sync
  const renderStudentSelect = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    teamFilter?: number
  ) => {
    const availableStudents = teamFilter
      ? students.filter(s => s.team === teamFilter)
      : students;

    const options = availableStudents.map(s => ({
      value: s.name,
      label: s.name,
      badge: s.team > 0 ? `Tổ ${s.team}` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300',
    }));

    return (
      <GlassSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        searchable
        allowCustomInput
      />
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 pb-16">
      {/* 1. HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-blue-950/40 shadow-2xl"
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Ban Cán Sự Lớp • {className} • NH {schoolYear}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl display-font font-extrabold text-white tracking-tight">
              Sơ Đồ Chức Vụ & Nhiệm Vụ Cán Sự Lớp
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Bảng phân công danh vị Ban Cán Sự Lớp và 4 Tổ trưởng, 4 Tổ phó kèm mô tả nhiệm vụ chi tiết.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 16 Vị trí Cán sự
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. MAIN CLASS OFFICERS (BAN CÁN SỰ TRỌNG YẾU) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white display-font flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Ban Cán Sự Lớp Trọng Yếu
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* LỚP TRƯỞNG & ỦY VIÊN */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent space-y-4 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bộ Phận Lớp Trưởng</h3>
                  <p className="text-[11px] text-amber-300/80 font-medium">Điều hành chung nề nếp lớp</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Lãnh đạo
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Lớp Trưởng
                </label>
                {renderStudentSelect(
                  officersConfig.classLeader || '',
                  (val) => onUpdateOfficersConfig({ classLeader: val }),
                  'Chọn hoặc nhập tên Lớp trưởng...'
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-amber-300" /> Ủy Viên Lớp Trưởng
                </label>
                {renderStudentSelect(
                  officersConfig.classLeaderMember || '',
                  (val) => onUpdateOfficersConfig({ classLeaderMember: val }),
                  'Chọn hoặc nhập tên Ủy viên...'
                )}
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-amber-500/10 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">Mô tả nhiệm vụ:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Quản lý chung nề nếp & kỷ luật của lớp.</li>
                  <li>Điều hành các buổi họp lớp, giờ sinh hoạt cuối tuần.</li>
                  <li>Đại diện trao đổi với GVCN và BGH nhà trường.</li>
                  <li>Ủy viên hỗ trợ tổng hợp báo cáo thi đua tuần.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* LỚP PHÓ HỌC TẬP & ỦY VIÊN */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-5 border border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent space-y-4 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bộ Phận Học Tập</h3>
                  <p className="text-[11px] text-blue-300/80 font-medium">Theo dõi tình hình học tập</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Học tập
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-blue-400" /> Lớp Phó Học Tập
                </label>
                {renderStudentSelect(
                  officersConfig.academicDeputy || '',
                  (val) => onUpdateOfficersConfig({ academicDeputy: val }),
                  'Chọn hoặc nhập Lớp phó Học tập...'
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200/80 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-blue-300" /> Ủy Viên Lớp Phó Học Tập
                </label>
                {renderStudentSelect(
                  officersConfig.academicDeputyMember || '',
                  (val) => onUpdateOfficersConfig({ academicDeputyMember: val }),
                  'Chọn hoặc nhập tên Ủy viên...'
                )}
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-blue-500/10 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-blue-300 text-[11px] uppercase tracking-wider">Mô tả nhiệm vụ:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Đôn đốc giờ truy bài 15 phút đầu giờ.</li>
                  <li>Theo dõi và ghi chép Sổ đầu bài các tiết học.</li>
                  <li>Hỗ trợ các bạn học sinh yếu kém vươn lên.</li>
                  <li>Ủy viên hỗ trợ thu bài tập & kiểm tra sách vở.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* LỚP PHÓ LAO ĐỘNG & ỦY VIÊN */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent space-y-4 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bộ Phận Lao Động</h3>
                  <p className="text-[11px] text-emerald-300/80 font-medium">Trực nhật & Vệ sinh lớp</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Lao động
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3 text-emerald-400" /> Lớp Phó Lao Động
                </label>
                {renderStudentSelect(
                  officersConfig.laborDeputy || '',
                  (val) => onUpdateOfficersConfig({ laborDeputy: val }),
                  'Chọn hoặc nhập Lớp phó Lao động...'
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/80 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-300" /> Ủy Viên Lớp Phó Lao Động
                </label>
                {renderStudentSelect(
                  officersConfig.laborDeputyMember || '',
                  (val) => onUpdateOfficersConfig({ laborDeputyMember: val }),
                  'Chọn hoặc nhập tên Ủy viên...'
                )}
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-emerald-500/10 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-emerald-300 text-[11px] uppercase tracking-wider">Mô tả nhiệm vụ:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Phân công & đôn đốc ca trực nhật Sáng/Chiều.</li>
                  <li>Kiểm tra vệ sinh lớp, bảng, khu vực bồn cây.</li>
                  <li>Quản lý dụng cụ vệ sinh (chổi, hót rác, khăn lau).</li>
                  <li>Ủy viên kiểm tra tình hình đổ rác & lau bảng.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* LỚP PHÓ VĂN THỂ MỸ & ỦY VIÊN */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-5 border border-pink-500/30 bg-gradient-to-b from-pink-500/10 via-transparent to-transparent space-y-4 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bộ Phận Văn Thể Mỹ</h3>
                  <p className="text-[11px] text-pink-300/80 font-medium">Văn nghệ, Thể thao & Phong trào</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Văn Thể
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-pink-300 mb-1 flex items-center gap-1">
                  <Music className="w-3 h-3 text-pink-400" /> Lớp Phó Văn Thể Mỹ
                </label>
                {renderStudentSelect(
                  officersConfig.artsSportsDeputy || '',
                  (val) => onUpdateOfficersConfig({ artsSportsDeputy: val }),
                  'Chọn Lớp phó Văn thể mỹ...'
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-pink-200/80 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-pink-300" /> Ủy Viên Lớp Phó Văn Thể Mỹ
                </label>
                {renderStudentSelect(
                  officersConfig.artsSportsDeputyMember || '',
                  (val) => onUpdateOfficersConfig({ artsSportsDeputyMember: val }),
                  'Chọn hoặc nhập tên Ủy viên...'
                )}
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-pink-500/10 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-pink-300 text-[11px] uppercase tracking-wider">Mô tả nhiệm vụ:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Phụ trách văn nghệ, thể thao & làm báo tường.</li>
                  <li>Tổ chức các hoạt động sinh hoạt ngoại khóa.</li>
                  <li>Ủy viên hỗ trợ chuẩn bị đạo cụ & tập luyện.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. BAN CÁN SỰ CÁC TỔ (4 TỔ TRƯỞNG & 4 TỔ PHÓ) */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white display-font flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Ban Cán Sự Các Tổ (4 Tổ Trưởng & 4 Tổ Phó)
          </h2>
          <span className="text-xs text-slate-400 font-medium">8 Cán sự Tổ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(teamIdNum => {
            const teamId = String(teamIdNum);
            const config = teamConfigs.find(t => t.id === teamId) || { id: teamId, leader: '', deputy: '' };
            const teamStudentCount = students.filter(s => s.team === teamIdNum).length;

            const cardColors = [
              { border: 'border-blue-500/30', bg: 'from-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-500/20' },
              { border: 'border-purple-500/30', bg: 'from-purple-500/10', text: 'text-purple-300', badge: 'bg-purple-500/20' },
              { border: 'border-emerald-500/30', bg: 'from-emerald-500/10', text: 'text-emerald-300', badge: 'bg-emerald-500/20' },
              { border: 'border-amber-500/30', bg: 'from-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-500/20' },
            ][teamIdNum - 1];

            return (
              <motion.div
                key={teamId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * teamIdNum }}
                className={cn(
                  "glass-card rounded-3xl p-5 border space-y-4 shadow-lg bg-gradient-to-b via-transparent to-transparent",
                  cardColors.border,
                  cardColors.bg
                )}
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", cardColors.badge)} />
                    <h3 className="font-bold text-white text-base display-font">TỔ {teamId}</h3>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10", cardColors.text, cardColors.badge)}>
                    {teamStudentCount} Thành viên
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" /> Tổ Trưởng Tổ {teamId}
                    </label>
                    {renderStudentSelect(
                      config.leader || '',
                      (val) => onUpdateTeamConfig(teamId, 'leader', val),
                      `Chọn Tổ trưởng Tổ ${teamId}...`,
                      teamIdNum
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" /> Tổ Phó Tổ {teamId}
                    </label>
                    {renderStudentSelect(
                      config.deputy || '',
                      (val) => onUpdateTeamConfig(teamId, 'deputy', val),
                      `Chọn Tổ phó Tổ ${teamId}...`,
                      teamIdNum
                    )}
                  </div>

                  <div className="p-2.5 rounded-2xl bg-black/20 border border-white/5 text-[11px] text-slate-400 space-y-0.5">
                    <p className="font-semibold text-slate-300">Nhiệm vụ Tổ {teamId}:</p>
                    <p>• Chấm điểm nề nếp & theo dõi việc thực hiện ca trực nhật của các thành viên Tổ {teamId}.</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. TOTAL SUMMARY BOARD VIEW */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white display-font flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Bảng Danh Vị Ban Cán Sự Lớp 8A2 (Tóm Tắt 14 Vị Trí)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-200">
            <thead className="bg-black/30 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Bộ Phận / Chức Vụ</th>
                <th className="px-4 py-3">Cán Sự Chính</th>
                <th className="px-4 py-3">Ủy Viên / Phó</th>
                <th className="px-4 py-3">Nhiệm Vụ Trọng Tâm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5">
                <td className="px-4 py-3 font-bold text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Bộ Phận Lớp Trưởng
                </td>
                <td className="px-4 py-3 font-semibold text-white">{officersConfig.classLeader || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-300">{officersConfig.classLeaderMember || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-400">Điều hành nề nếp chung, tổng hợp báo cáo thi đua</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-4 py-3 font-bold text-blue-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Bộ Phận Học Tập
                </td>
                <td className="px-4 py-3 font-semibold text-white">{officersConfig.academicDeputy || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-300">{officersConfig.academicDeputyMember || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-400">Quản lý truy bài đầu giờ, sổ đầu bài & bài tập về nhà</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-4 py-3 font-bold text-emerald-300 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> Bộ Phận Lao Động
                </td>
                <td className="px-4 py-3 font-semibold text-white">{officersConfig.laborDeputy || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-300">{officersConfig.laborDeputyMember || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-400">Phân công ca trực nhật Sáng/Chiều, dụng cụ vệ sinh</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="px-4 py-3 font-bold text-pink-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-pink-400" /> Bộ Phận Văn Thể Mỹ
                </td>
                <td className="px-4 py-3 font-semibold text-white">{officersConfig.artsSportsDeputy || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-300">{officersConfig.artsSportsDeputyMember || '(Chưa phân)'}</td>
                <td className="px-4 py-3 text-slate-400">Tổ chức hoạt động văn nghệ, thể thao, báo tường & ngoại khóa</td>
              </tr>
              {[1, 2, 3, 4].map(t => {
                const cfg = teamConfigs.find(tc => tc.id === String(t));
                return (
                  <tr key={t} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-purple-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Ban Cán Sự Tổ {t}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{cfg?.leader || '(Chưa phân)'}</td>
                    <td className="px-4 py-3 text-slate-300">{cfg?.deputy || '(Chưa phân)'}</td>
                    <td className="px-4 py-3 text-slate-400">Theo dõi nề nếp & ca trực nhật các thành viên Tổ {t}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
