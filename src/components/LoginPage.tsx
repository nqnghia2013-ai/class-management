import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Zap, Award, BookOpen, Layers, 
  ArrowRight, Globe, CheckCircle2, ChevronRight, UserCheck, Lock, Play, 
  Cpu, Server, Activity, QrCode, Smartphone, RefreshCw, BarChart3, Volume2, Radio
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onGuestAccess?: () => void;
}

// Cấu trúc câu khẩu hiệu gõ chữ phong cách SaaS 10.0 với từ khóa Highlight phát sáng
const TYPEWRITER_SLOGANS = [
  { text: "Quản lý Lớp học & Phân chia Tổ tự động 4.0...", tag: "AI Matrix v1.2" },
  { text: "Tự động Xếp loại & Thống kê Kỷ luật Real-time...", tag: "0ms Latency" },
  { text: "Trình chiếu Báo cáo Tuần tích hợp Giọng đọc AI...", tag: "TTS Voice Max Vol" },
  { text: "Đồng bộ Dữ liệu Đa thiết bị Cloud Firestore...", tag: "Multi-device Sync" },
  { text: "Xuất Báo cáo Excel / Word & Phiếu phạt chuẩn Sư phạm...", tag: "Pedagogy Format" }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGuestAccess }) => {
  // Tabs đăng nhập phong cách SaaS Trung Quốc (SSO Google vs Quét Mã QR)
  const [authTab, setAuthTab] = useState<'sso' | 'qr'>('sso');
  
  // Interactive showcase card tab ở cột bên trái
  const [activeShowcase, setActiveShowcase] = useState<number>(0);

  // Typewriter effect states
  const [sloganIndex, setSloganIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingState, setTypingState] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  // Auto-cycle showcase cards mỗi 4 giây
  useEffect(() => {
    const showcaseTimer = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(showcaseTimer);
  }, []);

  // Thuật toán gõ chữ máy in chuẩn 10.0: Đánh chữ -> Tạm dừng -> Gõ xóa -> Chuyển câu
  useEffect(() => {
    const currentSlogan = TYPEWRITER_SLOGANS[sloganIndex].text;
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (currentText.length < currentSlogan.length) {
        setTypingState('typing');
        // Tự động điều chỉnh tốc độ gõ: nếu gặp dấu câu thì tạm hoãn lâu hơn chút cho tự nhiên
        const nextChar = currentSlogan[currentText.length];
        const delay = (nextChar === '.' || nextChar === ',' || nextChar === '&') ? 180 : 45;
        
        timer = setTimeout(() => {
          setCurrentText(currentSlogan.slice(0, currentText.length + 1));
        }, delay);
      } else {
        setTypingState('pausing');
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2400);
      }
    } else {
      setTypingState('deleting');
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(currentSlogan.slice(0, currentText.length - 1));
        }, 22);
      } else {
        setIsDeleting(false);
        setSloganIndex((prev) => (prev + 1) % TYPEWRITER_SLOGANS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, sloganIndex]);

  return (
    <div className="min-h-screen w-full bg-[#030614] text-white flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      {/* ============================================================ */}
      {/* HIGH-TECH AMBIENT LIGHTING & DYNAMIC FLOATING PARTICLES */}
      {/* ============================================================ */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />
      
      {/* Floating Glowing Orbs */}
      <motion.div 
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-blue-600/25 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-purple-600/25 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" 
      />

      {/* Futuristic Cyber Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Chinese SaaS Floating Brand Bar */}
      <div className="absolute top-6 left-6 lg:left-12 flex items-center space-x-3 z-20">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_20px_rgba(79,70,229,0.5)]">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
        </div>
        <div>
          <span className="text-sm font-black display-font tracking-tight text-white block">
            LỚP HỌC SỐ <span className="text-blue-400 font-mono text-xs">AI MATRIX</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">Hệ thống Quản lý Lớp học 4.0</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTAINER CARD (Dual Column Chinese Tech SaaS 10.0 Design) */}
      {/* ============================================================ */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-[2.5rem] bg-slate-900/50 backdrop-blur-3xl border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden relative z-10 my-16 lg:my-0"
      >
        {/* ============================================================ */}
        {/* LEFT COLUMN: HERO SHOWCASE & DYNAMIC TYPEWRITER BANNER */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative bg-gradient-to-br from-blue-950/40 via-purple-950/20 to-transparent border-r border-white/10 overflow-hidden">
          {/* Ambient Inner Gradient */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_55%)] pointer-events-none" />

          <div className="space-y-8 relative z-10">
            {/* Tag Badge */}
            <div className="flex items-center space-x-3">
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>CHINA TECH SAAS 10.0 • FEISHU MATRIX</span>
              </div>
            </div>

            {/* Main Header Title */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black display-font text-white tracking-tight leading-tight">
                Nền Tảng Quản Lý <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-md">
                  Lớp Học Số Thông Minh
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                Tự động hóa hoàn toàn quy trình phân trực nhật, xếp loại thi đua tổ và báo cáo tổng kết hàng tuần cho giáo viên chủ nhiệm.
              </p>
            </div>

            {/* Dynamic Typewriter Box (Hiệu ứng Đánh chữ Gõ xóa tự động Chuẩn 10.0) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-black/50 border border-white/15 backdrop-blur-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[6rem] flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
              
              {/* Typewriter Top Bar */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2 text-cyan-400">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
                  AI Live Typewriter Engine
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px] font-bold">
                  {TYPEWRITER_SLOGANS[sloganIndex].tag}
                </span>
              </div>

              {/* Typewriter Text Display Line */}
              <div className="text-base sm:text-lg font-mono font-bold text-slate-100 min-h-[2.2rem] flex items-center leading-snug">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200">
                  {currentText}
                </span>
                {/* Blinking Laser Cursor */}
                <span className={`inline-block w-2.5 h-5 bg-cyan-400 ml-1.5 shadow-[0_0_8px_#22d3ee] ${typingState === 'pausing' ? 'animate-ping' : 'animate-pulse'}`} />
              </div>
            </div>

            {/* Interactive Showcase Preview Cards (Chinese Tech Feature Tabs) */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Trải nghiệm tính năng cốt lõi:</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setActiveShowcase(0)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeShowcase === 0 
                      ? 'bg-blue-600/20 border-blue-400/50 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-blue-400 mb-1.5" />
                  <div className="text-xs font-bold block">Xếp Loại Tuần</div>
                  <div className="text-[10px] text-slate-400 block truncate">Thống kê Real-time</div>
                </button>

                <button
                  onClick={() => setActiveShowcase(1)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeShowcase === 1 
                      ? 'bg-purple-600/20 border-purple-400/50 text-white shadow-lg shadow-purple-500/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-purple-400 mb-1.5" />
                  <div className="text-xs font-bold block">Giọng Đọc AI</div>
                  <div className="text-[10px] text-slate-400 block truncate">Trình chiếu Max Vol</div>
                </button>

                <button
                  onClick={() => setActiveShowcase(2)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeShowcase === 2 
                      ? 'bg-emerald-600/20 border-emerald-400/50 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <div className="text-xs font-bold block">Cloud 0ms</div>
                  <div className="text-[10px] text-slate-400 block truncate">Firestore Sync</div>
                </button>
              </div>

              {/* Dynamic Card Content Display */}
              <AnimatePresence mode="wait">
                {activeShowcase === 0 && (
                  <motion.div
                    key="showcase-0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 rounded-2xl bg-black/40 border border-blue-500/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 font-black">Tổ 1</div>
                      <div>
                        <span className="font-bold text-white block">Xếp loại Hạng 1 (98 điểm)</span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">🏆 Đạt Tổ Xuất Sắc Nhất Tuần</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">100% Sĩ số</span>
                  </motion.div>
                )}

                {activeShowcase === 1 && (
                  <motion.div
                    key="showcase-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 animate-pulse">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">TTS Voice Engine Nữ Việt Nam</span>
                        <span className="text-[10px] text-purple-300 font-semibold block">🎙️ Phát thanh tự động khi trình chiếu</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">Max Vol 100%</span>
                  </motion.div>
                )}

                {activeShowcase === 2 && (
                  <motion.div
                    key="showcase-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">Real-time Multi-device Sync</span>
                        <span className="text-[10px] text-emerald-300 font-semibold block">⚡ Điện thoại, Máy tính & Tablet đồng bộ 0ms</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">Verified</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="pt-8 mt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-400 relative z-10">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Hệ thống Online 99.99%
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
        {/* RIGHT COLUMN: CHINESE TECH HIGH-SAAS LOGIN FORM PANEL */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between bg-black/60 backdrop-blur-3xl relative">
          <div className="space-y-8 my-auto">
            
            {/* Chinese SaaS Authentication Mode Tabs (SSO vs QR Code Scan) */}
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                onClick={() => setAuthTab('sso')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  authTab === 'sso'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Đăng Nhập SSO</span>
              </button>

              <button
                onClick={() => setAuthTab('qr')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  authTab === 'qr'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Quét Mã QR</span>
              </button>
            </div>

            {/* TAB CONTENT 1: GOOGLE SINGLE SIGN-ON */}
            {authTab === 'sso' ? (
              <div className="space-y-6">
                <div className="space-y-2 text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-black display-font text-white tracking-tight">
                    Xin Chào Giáo Viên! 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Đăng nhập tài khoản Google Giáo Viên để mở khóa toàn bộ quyền điều hành và đồng bộ dữ liệu.
                  </p>
                </div>

                {/* Primary Google Login Button (High-Tech Shimmering Styling) */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onLogin}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-[0_12px_35px_rgba(59,130,246,0.4)] border border-blue-400/40 flex items-center justify-center space-x-3 transition-all group relative overflow-hidden"
                  >
                    {/* Shimmering Light Sweep Effect */}
                    <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                    
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

                  {/* Guest Access Button */}
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
              </div>
            ) : (
              /* TAB CONTENT 2: QR CODE SCAN LOGIN (Chinese SaaS Signature Feature) */
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Quét Mã QR Đăng Nhập</h3>
                  <p className="text-xs text-slate-400">Dùng ứng dụng Lớp Học Số trên điện thoại để quét mã</p>
                </div>

                {/* High-Tech QR Code Mockup with Laser Scan Animation */}
                <div className="w-48 h-48 mx-auto rounded-3xl bg-white p-4 shadow-2xl relative overflow-hidden flex items-center justify-center group border-4 border-blue-500/40">
                  {/* Laser Scanning Line */}
                  <motion.div 
                    animate={{ y: [-80, 80, -80] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-10"
                  />
                  
                  {/* QR Code Graphic Icon */}
                  <QrCode className="w-full h-full text-slate-900" />
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-blue-400" />
                  <span>Mã QR tự động làm mới sau 60 giây</span>
                </div>
              </div>
            )}

            {/* Security Guarantee Box */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-blue-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Bảo Mật Nâng Cao SSL 256-bit</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Dữ liệu lớp học và tài khoản giáo viên được mã hóa an toàn trên hệ thống Firestore.
              </p>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="pt-6 border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mã hóa dữ liệu chuẩn Doanh nghiệp • Đảm bảo an toàn sư phạm</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
