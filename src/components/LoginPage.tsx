import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Zap, Award, BookOpen, Layers, 
  ArrowRight, Globe, CheckCircle2, ChevronRight, UserCheck, Lock, Play, Cpu, Server, Activity
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onGuestAccess?: () => void;
}

const TYPEWRITER_SLOGANS = [
  "Quản lý Học sinh & Phân chia Tổ tự động 4.0...",
  "Tự động Xếp loại & Thống kê Kỷ luật Real-time...",
  "Trình chiếu Báo cáo Tuần tích hợp Giọng đọc AI...",
  "Đồng bộ Dữ liệu Đa thiết bị Cloud Firestore 0ms...",
  "Xuất Báo cáo Excel / Word & Phiếu phạt chuẩn Sư phạm..."
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGuestAccess }) => {
  // Typewriter effect states
  const [sloganIndex, setSloganIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter logic: đánh chữ -> tạm dừng -> xóa chữ -> câu tiếp theo
  useEffect(() => {
    const fullText = TYPEWRITER_SLOGANS[sloganIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (currentText.length < fullText.length) {
        timer = setTimeout(() => {
          setCurrentText(fullText.slice(0, currentText.length + 1));
        }, 55);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(fullText.slice(0, currentText.length - 1));
        }, 30);
      } else {
        setIsDeleting(false);
        setSloganIndex((prev) => (prev + 1) % TYPEWRITER_SLOGANS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, sloganIndex]);

  return (
    <div className="min-h-screen w-full bg-[#040817] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Atmosphere Glows & Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Futuristic Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container Card (Dual Column Chinese Tech SaaS Design) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-[2.5rem] bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden relative z-10"
      >
        {/* ============================================================ */}
        {/* LEFT COLUMN: HERO SHOWCASE & DYNAMIC TYPEWRITER TEXT BANNER */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative bg-gradient-to-br from-blue-950/40 via-purple-950/20 to-transparent border-r border-white/10 overflow-hidden">
          {/* Subtle Ambient Background Light inside Left Panel */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            {/* Top Brand Tag */}
            <div className="flex items-center space-x-3">
              <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>LỚP HỌC SỐ AI MATRIX • PRO V1.2</span>
              </div>
            </div>

            {/* Main Title */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black display-font text-white tracking-tight leading-tight">
                Hệ Thống Quản Lý <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-sm">
                  Lớp Học Số Thông Minh
                </span>
              </h1>
            </div>

            {/* Dynamic Typewriter Box (Chữ chạy đánh máy & gõ xóa tự động) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-inner relative overflow-hidden min-h-[5.5rem] flex items-center">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    Tính năng nổi bật
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                    AI Auto-Type
                  </span>
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-slate-100 min-h-[2rem] flex items-center">
                  <span>{currentText}</span>
                  <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Chinese Tech SaaS Style Feature Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Đồng Bộ Real-time 0ms</h4>
                    <p className="text-[10px] text-slate-400">Cloud Firestore đa thiết bị</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <Cpu className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Trình Chiếu Giọng Đọc AI</h4>
                    <p className="text-[10px] text-slate-400">Báo cáo tuần chuyên nghiệp</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Xuất File Excel / Word</h4>
                    <p className="text-[10px] text-slate-400">Chuẩn định dạng Sư phạm</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Bảo Mật SSL 256-bit</h4>
                    <p className="text-[10px] text-slate-400">An toàn dữ liệu lớp học</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live Metrics Footer */}
          <div className="pt-8 mt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-400 relative z-10">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Hệ thống sẵn sàng
              </span>
              <span>•</span>
              <span className="text-slate-300">Phiên bản v1.2.0</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Smart Classroom Matrix © 2026
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: HIGH-TECH LOGIN FORM PANEL */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-black/40 backdrop-blur-2xl relative">
          <div className="space-y-8 my-auto">
            {/* Header Form */}
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold mb-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>ĐĂNG NHẬP GIÁO VIÊN</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black display-font text-white tracking-tight">
                Xin Chào Giáo Viên! 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Đăng nhập tài khoản Google để khởi tạo và đồng bộ dữ liệu lớp học toàn diện.
              </p>
            </div>

            {/* Login Action Area */}
            <div className="space-y-4 pt-2">
              {/* Primary Google Login Button (High-Tech Styling) */}
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogin}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(59,130,246,0.35)] border border-blue-400/40 flex items-center justify-center space-x-3 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center p-1 shadow-md shrink-0">
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="tracking-wide">Đăng nhập bằng Google SSO</span>
                <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform ml-auto" />
              </motion.button>

              {/* Guest / Offline Access Option */}
              {onGuestAccess && (
                <button
                  onClick={onGuestAccess}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center space-x-2"
                >
                  <Play className="w-3.5 h-3.5 text-slate-400" />
                  <span>Trải nghiệm chế độ dùng thử (Offline Mode)</span>
                </button>
              )}
            </div>

            {/* Security Guarantee Badge */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-blue-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Bảo Mật & Riêng Tư Nâng Cao</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Dữ liệu lớp học được phân quyền độc lập theo tài khoản Google của từng giáo viên trên Firestore.
              </p>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="pt-6 border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mã hóa dữ liệu 256-bit • Đảm bảo an toàn sư phạm</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
