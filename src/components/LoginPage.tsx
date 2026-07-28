import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, ShieldCheck, GraduationCap, ArrowRight, 
  CheckCircle2, Globe, Laptop, Lock
} from 'lucide-react';

interface LoginPageProps {
  onLoginGoogle: () => void;
  onContinueGuest?: () => void;
  isLoading?: boolean;
}

const TYPEWRITER_PHRASES = [
  "✨ Khởi tạo thông tin lớp học, năm học & phân chia 4 tổ tự động...",
  "📊 Sơ kết thi đua tuần, chấm điểm trực tuần & xếp loại lớp...",
  "🎙️ Trình chiếu thi đua toàn màn hình tích hợp giọng đọc AI...",
  "📄 Nhập xuất dữ liệu học sinh Excel, Word chuẩn định dạng sư phạm...",
  "☁️ Đồng bộ dữ liệu real-time 0ms bảo mật trên Cloud...",
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginGoogle,
  onContinueGuest,
  isLoading = false,
}) => {
  // Typewriter effect states
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing phase
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 55);
      } else {
        // Pause at full phrase before erasing
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Erasing phase
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 25);
      } else {
        // Switch to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <div className="min-h-screen w-full bg-[#040711] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Dynamic Cyberspace Background Gradients & Glow Blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[180px]" />
        
        {/* High-tech grid overlay */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Container Card: Split-Screen Layout (Chinese Tech SaaS Style) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl rounded-[2.5rem] bg-slate-900/80 border border-white/15 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        {/* LEFT COLUMN: BRAND SHOWCASE & TYPEWRITER HERO (7/12 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-slate-950/60 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
          {/* Subtle Cyber Grid Lines */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Brand Header & Pill Badge */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div>
                <span className="px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black uppercase tracking-widest block w-max mb-0.5">
                  DIGITAL CLASSROOM • 智慧教室
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white display-font">
                  LỚP HỌC SỐ AI PLATFORM
                </h2>
              </div>
            </div>

            {/* Perfectly balanced 2-line heading */}
            <div className="pt-4">
              <h1 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-black display-font text-white leading-tight tracking-tight">
                Nền Tảng Quản Lý Lớp Học<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
                  Thông Minh & Hiện Đại 4.0
                </span>
              </h1>
            </div>
          </div>

          {/* MIDDLE: DYNAMIC TYPEWRITER TEXT EFFECT (Chữ gõ rồi xóa) */}
          <div className="my-8 lg:my-10 relative z-10">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-purple-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-400" />
              
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-2.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                <span>Trợ Lý Trí Tuệ Nhân Tạo AI</span>
              </div>

              {/* Typewriter text line with blinking cursor */}
              <div className="min-h-[64px] flex items-center">
                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed font-mono tracking-wide">
                  {displayText}
                  <span className="inline-block w-2.5 h-4.5 bg-purple-400 ml-1 translate-y-0.5 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Đồng bộ Real-time 0ms
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Đa nền tảng Web & Mobile
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM: NEW REFINED PROFESSIONAL STATS BADGES */}
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <div className="text-purple-400 font-bold text-base sm:text-lg display-font">4 TỔ</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">THI ĐỦA TỰ ĐỘNG</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <div className="text-cyan-400 font-bold text-base sm:text-lg display-font">0ms</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">ĐỒNG BỘ REAL-TIME</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <div className="text-emerald-400 font-bold text-base sm:text-lg display-font">EXCEL / WORD</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">XUẤT BÁO CÁO CHUẨN</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERN LOGIN FORM & ACTIONS (5/12 cols) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-slate-950/80 relative">
          <div className="space-y-8 relative z-10 my-auto">
            {/* Form Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>XÁC THỰC AN TOÀN • 登录</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black display-font text-white tracking-tight">
                Xin Chào Giáo Viên 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Vui lòng đăng nhập tài khoản để truy cập bảng điều khiển và đồng bộ dữ liệu lớp học của bạn.
              </p>
            </div>

            {/* Google Login Action Button */}
            <div className="space-y-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoginGoogle}
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl p-0.5 font-bold text-sm shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all"
              >
                {/* Glowing Gradient Border Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 rounded-2xl group-hover:opacity-100 transition-opacity" />
                
                <div className="relative px-6 py-4 rounded-[14px] bg-slate-900 group-hover:bg-slate-900/90 text-white flex items-center justify-center space-x-3 transition-colors">
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <div className="p-1.5 rounded-xl bg-white shadow-md shrink-0">
                        <img 
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                          alt="Google Logo" 
                          className="w-5 h-5" 
                        />
                      </div>
                      <span className="text-sm font-bold tracking-wide">Đăng nhập qua Google SSO</span>
                      <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>

              {/* Guest / Demo Mode Button */}
              {onContinueGuest && (
                <button
                  onClick={onContinueGuest}
                  className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span>Dùng thử không đăng nhập (Chế độ Khách)</span>
                </button>
              )}
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Các tính năng sẵn sàng:
              </span>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Cấu hình thông tin lớp học, khối & năm học</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Quản lý danh sách học sinh & phân chia 4 tổ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Tự động kiểm tra & thông báo bản cập nhật Web</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="pt-6 text-center border-t border-white/10 relative z-10">
            <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Được bảo vệ bởi Firebase Authentication • Encrypted SSL 256-bit
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              Bản quyền thuộc Lớp Học Số Platform © 2026
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
