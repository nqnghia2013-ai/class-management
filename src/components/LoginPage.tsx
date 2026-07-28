import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, Zap, Award, BookOpen, Layers, 
  ArrowRight, Globe, CheckCircle2, ChevronRight, UserCheck, Lock, Play, 
  Cpu, Server, Activity, QrCode, Smartphone, RefreshCw, BarChart3, Volume2, Radio,
  Monitor, Loader2, User as UserIcon, AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  createQRSession, listenQRSession, deleteQRSession, 
  buildQRCodeUrl, isSessionValid, QRLoginSession
} from '../lib/qrLoginService';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

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

// ============================================================
// Hook: useIsMobile - Detect mobile viewport
// ============================================================
function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

// ============================================================
// Hook: useQRSession - Desktop QR code session management
// ============================================================
function useQRSession(isActive: boolean) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'scanned' | 'confirmed' | 'expired' | 'loading'>('loading');
  const [timeLeft, setTimeLeft] = useState(60);
  const [sessionData, setSessionData] = useState<QRLoginSession | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const expiryRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Create new QR session
  const createSession = useCallback(async () => {
    cleanup();
    setSessionStatus('loading');
    setQrDataUrl(null);
    setSessionData(null);

    try {
      const newSessionId = await createQRSession();
      setSessionId(newSessionId);

      // Generate QR code image
      const qrUrl = buildQRCodeUrl(newSessionId);
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
      setSessionStatus('pending');

      // Set expiry countdown
      expiryRef.current = Date.now() + 60_000;
      setTimeLeft(60);

      // Start countdown timer
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((expiryRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setSessionStatus('expired');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);

      // Listen for session changes
      unsubRef.current = listenQRSession(newSessionId, (session) => {
        if (!session) {
          setSessionStatus('expired');
          return;
        }
        setSessionData(session);
        
        if (session.status === 'scanned') {
          setSessionStatus('scanned');
        } else if (session.status === 'confirmed') {
          setSessionStatus('confirmed');
          cleanup();
        } else if (session.status === 'expired' || !isSessionValid(session)) {
          setSessionStatus('expired');
        }
      });
    } catch (e) {
      console.error('[QR Session] Error creating session:', e);
      setSessionStatus('expired');
    }
  }, [cleanup]);

  // Initialize when active
  useEffect(() => {
    if (isActive) {
      createSession();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isActive, createSession, cleanup]);

  return {
    sessionId,
    qrDataUrl,
    sessionStatus,
    timeLeft,
    sessionData,
    refreshSession: createSession,
  };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGuestAccess }) => {
  const isMobile = useIsMobile();
  
  // On mobile, always default to SSO (QR tab hidden)
  const [authTab, setAuthTab] = useState<'sso' | 'qr'>(isMobile ? 'sso' : 'sso');
  
  // Interactive showcase card tab
  const [activeShowcase, setActiveShowcase] = useState<number>(0);

  // Typewriter effect states
  const [sloganIndex, setSloganIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingState, setTypingState] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  // QR Session hook (only active on Desktop when QR tab selected)
  const qrSession = useQRSession(!isMobile && authTab === 'qr');

  // Reset to SSO tab when switching to mobile
  useEffect(() => {
    if (isMobile && authTab === 'qr') {
      setAuthTab('sso');
    }
  }, [isMobile, authTab]);

  // Handle QR login confirmed - Desktop auto-login using login_hint
  useEffect(() => {
    if (qrSession.sessionStatus === 'confirmed' && qrSession.sessionData?.mobileEmail) {
      const email = qrSession.sessionData.mobileEmail;
      
      // Auto-trigger Google sign-in with login_hint to pre-select the correct account
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: email });
      
      signInWithPopup(auth, provider)
        .then(() => {
          // Clean up the session from Firestore
          if (qrSession.sessionId) {
            deleteQRSession(qrSession.sessionId);
          }
        })
        .catch((error) => {
          console.error('[QR Login] Auto sign-in error:', error);
        });
    }
  }, [qrSession.sessionStatus, qrSession.sessionData, qrSession.sessionId]);

  // Auto-cycle showcase cards mỗi 4 giây
  useEffect(() => {
    const showcaseTimer = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(showcaseTimer);
  }, []);

  // Thuật toán gõ chữ máy in chuẩn 10.0
  useEffect(() => {
    const currentSlogan = TYPEWRITER_SLOGANS[sloganIndex].text;
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (currentText.length < currentSlogan.length) {
        setTypingState('typing');
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

            {/* Dynamic Typewriter Box */}
            <div className="p-5 sm:p-6 rounded-2xl bg-black/50 border border-white/15 backdrop-blur-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[6rem] flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
              
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-2 text-cyan-400">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
                  AI Live Typewriter Engine
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px] font-bold">
                  {TYPEWRITER_SLOGANS[sloganIndex].tag}
                </span>
              </div>

              <div className="text-base sm:text-lg font-mono font-bold text-slate-100 min-h-[2.2rem] flex items-center leading-snug">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200">
                  {currentText}
                </span>
                <span className={`inline-block w-2.5 h-5 bg-cyan-400 ml-1.5 shadow-[0_0_8px_#22d3ee] ${typingState === 'pausing' ? 'animate-ping' : 'animate-pulse'}`} />
              </div>
            </div>

            {/* Interactive Showcase Preview Cards */}
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
            
            {/* Chinese SaaS Authentication Mode Tabs */}
            {/* On mobile: only SSO tab shown. On desktop: both SSO and QR tabs */}
            {isMobile ? (
              /* Mobile: Single auth mode - no tab switcher needed */
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-400/20 flex items-center justify-center space-x-2 text-xs font-bold text-blue-300">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Đăng Nhập Tài Khoản Google</span>
              </div>
            ) : (
              /* Desktop: Dual auth mode tabs */
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
            )}

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
              {/* TAB 1: GOOGLE SSO (shown on both mobile and desktop) */}
              {(authTab === 'sso' || isMobile) && (
                <motion.div
                  key="sso-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl font-black display-font text-white tracking-tight">
                      Xin Chào Giáo Viên! 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      Đăng nhập tài khoản Google Giáo Viên để mở khóa toàn bộ quyền điều hành và đồng bộ dữ liệu.
                    </p>
                  </div>

                  {/* Primary Google Login Button */}
                  <div className="space-y-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onLogin}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-[0_12px_35px_rgba(59,130,246,0.4)] border border-blue-400/40 flex items-center justify-center space-x-3 transition-all group relative overflow-hidden"
                    >
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
                </motion.div>
              )}

              {/* TAB 2: QR CODE LOGIN (Desktop Only - Real QR Code) */}
              {authTab === 'qr' && !isMobile && (
                <motion.div
                  key="qr-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5 text-center"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Quét Mã QR Đăng Nhập</h3>
                    <p className="text-xs text-slate-400">Dùng điện thoại đã đăng nhập để quét mã bên dưới</p>
                  </div>

                  {/* QR Code Display with Status States */}
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {/* LOADING STATE */}
                      {qrSession.sessionStatus === 'loading' && (
                        <motion.div
                          key="qr-loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-52 h-52 mx-auto rounded-3xl bg-white/5 border-2 border-white/10 flex flex-col items-center justify-center space-y-3"
                        >
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                          <span className="text-xs text-slate-400 font-medium">Đang tạo mã QR...</span>
                        </motion.div>
                      )}

                      {/* PENDING STATE - Show QR Code */}
                      {qrSession.sessionStatus === 'pending' && qrSession.qrDataUrl && (
                        <motion.div
                          key="qr-pending"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative inline-block"
                        >
                          <div className="w-52 h-52 mx-auto rounded-3xl bg-white p-3 shadow-2xl relative overflow-hidden border-4 border-blue-500/40 group">
                            {/* Laser Scanning Line */}
                            <motion.div 
                              animate={{ y: [-100, 100, -100] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-10"
                            />
                            
                            {/* Real QR Code Image */}
                            <img 
                              src={qrSession.qrDataUrl} 
                              alt="QR Code Login" 
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>

                          {/* Countdown Progress Ring */}
                          <div className="mt-4 flex items-center justify-center space-x-3">
                            {/* Circular progress */}
                            <div className="relative w-10 h-10">
                              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
                                <circle 
                                  cx="18" cy="18" r="15.5" fill="none" 
                                  stroke="url(#qr-progress-gradient)" 
                                  strokeWidth="3"
                                  strokeDasharray={`${(qrSession.timeLeft / 60) * 97.4} 97.4`}
                                  strokeLinecap="round"
                                  className="transition-all duration-1000 ease-linear"
                                />
                                <defs>
                                  <linearGradient id="qr-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                                {qrSession.timeLeft}s
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="text-xs text-slate-300 font-semibold block">Mã QR hợp lệ</span>
                              <span className="text-[10px] text-slate-500">Tự động làm mới khi hết hạn</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* SCANNED STATE - Someone scanned */}
                      {qrSession.sessionStatus === 'scanned' && (
                        <motion.div
                          key="qr-scanned"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-52 h-52 mx-auto rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-2 border-blue-400/40 flex flex-col items-center justify-center space-y-3 shadow-xl shadow-blue-500/20"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-16 h-16 rounded-full bg-blue-600/30 flex items-center justify-center"
                          >
                            <Smartphone className="w-8 h-8 text-blue-300" />
                          </motion.div>
                          <div className="space-y-1 text-center">
                            <span className="text-sm font-bold text-blue-300 block">Đã Quét Thành Công!</span>
                            <span className="text-[10px] text-slate-400 block">Đang chờ xác nhận trên điện thoại...</span>
                          </div>
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        </motion.div>
                      )}

                      {/* CONFIRMED STATE - Login success */}
                      {qrSession.sessionStatus === 'confirmed' && (
                        <motion.div
                          key="qr-confirmed"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-52 h-52 mx-auto rounded-3xl bg-gradient-to-br from-emerald-600/20 to-emerald-600/10 border-2 border-emerald-400/40 flex flex-col items-center justify-center space-y-3 shadow-xl shadow-emerald-500/20"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                          >
                            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                          </motion.div>
                          <div className="space-y-1 text-center">
                            <span className="text-sm font-bold text-emerald-300 block">Đăng Nhập Thành Công!</span>
                            <span className="text-[10px] text-slate-400 block">
                              {qrSession.sessionData?.mobileEmail || 'Đang chuyển hướng...'}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* EXPIRED STATE */}
                      {qrSession.sessionStatus === 'expired' && (
                        <motion.div
                          key="qr-expired"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-52 h-52 mx-auto rounded-3xl bg-white/5 border-2 border-white/10 flex flex-col items-center justify-center space-y-4"
                        >
                          <AlertCircle className="w-12 h-12 text-slate-500" />
                          <div className="space-y-1 text-center">
                            <span className="text-sm font-bold text-slate-400 block">Mã QR Đã Hết Hạn</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={qrSession.refreshSession}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center space-x-2 border border-blue-400/30"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Tạo Mã Mới</span>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2 text-[11px] text-slate-500 pt-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-bold shrink-0">1.</span>
                      <span>Đăng nhập Google trên điện thoại trước</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-bold shrink-0">2.</span>
                      <span>Bấm nút <strong className="text-blue-300">"Quét mã đăng nhập"</strong> trên điện thoại</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-400 font-bold shrink-0">3.</span>
                      <span>Hướng camera vào mã QR bên trên để đăng nhập</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
