import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Play, Pause, ChevronLeft, ChevronRight, 
  X, Award, ShieldAlert, PlusCircle, MinusCircle, Star, Sparkles, CheckCircle2
} from 'lucide-react';
import { Student, WeeklyRating, TeamWeeklySummary, RatingType } from '../types';
import { cn } from '../lib/utils';

interface WeeklyRatingPresentationProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  classNameText?: string;
  students: Student[];
  weeklyRatings: WeeklyRating[];
  teamSummaries: TeamWeeklySummary[];
}

export const WeeklyRatingPresentation: React.FC<WeeklyRatingPresentationProps> = ({
  isOpen,
  onClose,
  currentWeek,
  classNameText = '8A2',
  students,
  weeklyRatings,
  teamSummaries,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0); // 0..3: Teams 1..4, 4: Final summary
  const [isPlaying, setIsPlaying] = useState(true); // Auto speech & slide progression
  const [speakingState, setSpeakingState] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Teams 1 to 4
  const teamIds = [1, 2, 3, 4];
  const totalSlides = 5; // 4 teams + 1 summary

  // Load and auto-select Vietnamese female voice
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Priority 1: Vietnamese Female Voices (HoaiMy, Linh, Mai, Female)
      const femaleVi = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        const isVi = lang.includes('vi') || name.includes('vietnam') || name.includes('vietnamese');
        const isFemale = name.includes('hoaimy') || name.includes('linh') || name.includes('mai') || name.includes('lan') || name.includes('huyen') || name.includes('female') || name.includes('nữ') || name.includes('nu');
        const isMale = (name.includes('male') || name.includes('nam') || name.includes('david')) && !name.includes('vietnam') && !name.includes('vietnamese');
        return isVi && isFemale && !isMale;
      });

      // Priority 2: Any non-male Vietnamese Voice
      const nonMaleVi = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        const isVi = lang.includes('vi') || name.includes('vietnam');
        const isMale = (name.includes('male') || name.includes('nam')) && !name.includes('vietnam');
        return isVi && !isMale;
      });

      // Priority 3: Fallback any Vietnamese voice
      const anyVi = voices.find(v => v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('vietnam'));

      const chosen = femaleVi || nonMaleVi || anyVi || voices[0];
      if (chosen && !selectedVoiceURI) {
        setSelectedVoiceURI(chosen.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Stop any active speech when closed or slide changes
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    setSpeakingState(false);
  };

  // Generate text script for current slide
  const getSlideScript = (slideIndex: number): string => {
    if (slideIndex < 4) {
      const teamId = teamIds[slideIndex];
      const teamStudents = students.filter(s => s.team === teamId);
      const summaryId = `w${currentWeek}-t${teamId}`;
      const summary = teamSummaries.find(t => t.id === summaryId) || { bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '' };

      let text = `Trình chiếu xếp loại Tuần ${currentWeek}, Lớp ${classNameText}. Kính mời quý thầy cô và các bạn theo dõi kết quả của Tổ ${teamId}. `;

      if (teamStudents.length === 0) {
        text += `Tổ ${teamId} hiện chưa có thành viên nào. `;
      } else {
        text += `Kết quả xếp loại học sinh Tổ ${teamId} như sau: `;
        teamStudents.forEach(st => {
          const ratingId = `w${currentWeek}-s${st.id}`;
          const r = weeklyRatings.find(x => x.id === ratingId)?.rating || '';
          let ratingText = 'Chưa xếp loại';
          if (r === 'T') ratingText = 'Tốt';
          else if (r === 'K') ratingText = 'Khá';
          else if (r === 'TB') ratingText = 'Trung bình';
          else if (r === 'Đ') ratingText = 'Đạt';
          else if (r === 'CĐ') ratingText = 'Chưa đạt';

          text += `Học sinh ${st.name}, xếp loại ${ratingText}. `;
        });
      }

      text += `Tổng kết điểm thi đua Tổ ${teamId}: `;
      text += `Điểm cộng: ${summary.bonusPoints} điểm. `;
      text += `Điểm trừ: ${summary.penaltyPoints} điểm. `;
      text += `Điểm tổng kết: ${summary.totalPoints} điểm. `;

      if (summary.violations && summary.violations.trim()) {
        text += `Các lỗi vi phạm ghi nhận của Tổ ${teamId} bao gồm: ${summary.violations}.`;
      } else {
        text += `Tổ ${teamId} xuất sắc không có lỗi vi phạm nào trong tuần.`;
      }

      return text;
    } else {
      // Summary Slide 5
      let text = `Tổng kết thi đua tuần ${currentWeek} lớp ${classNameText}. `;
      const sortedTeams = [...teamIds].map(teamId => {
        const summaryId = `w${currentWeek}-t${teamId}`;
        const summary = teamSummaries.find(t => t.id === summaryId) || { bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '' };
        return { teamId, points: summary.totalPoints };
      }).sort((a, b) => b.points - a.points);

      if (sortedTeams.length > 0) {
        text += `Tổ dẫn đầu tuần này là Tổ ${sortedTeams[0].teamId} với ${sortedTeams[0].points} điểm. Khen ngợi tinh thần thi đua của cả lớp!`;
      }
      return text;
    }
  };

  // Read speech for current slide with Female Tone & Max Volume
  const speakCurrentSlide = () => {
    stopSpeech();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this browser');
      return;
    }

    const script = getSlideScript(currentSlide);
    const utterance = new SpeechSynthesisUtterance(script);

    utterance.lang = 'vi-VN';
    utterance.volume = 1.0;  // MAX Volume 100%!
    utterance.pitch = 1.45;  // Elevated Pitch (1.45) for genuine female voice timbre!
    utterance.rate = 0.95;   // Clear pedagogy speech cadence

    if (selectedVoiceURI && availableVoices.length > 0) {
      const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
    }

    utterance.onstart = () => {
      setSpeakingState(true);
    };

    utterance.onend = () => {
      setSpeakingState(false);
      // If auto playing, wait 1.5 seconds then advance to next slide
      if (isPlaying) {
        speechTimeoutRef.current = setTimeout(() => {
          if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
          } else {
            setIsPlaying(false);
          }
        }, 1500);
      }
    };

    utterance.onerror = (err) => {
      console.error('Speech synthesis error:', err);
      setSpeakingState(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech when slide changes or isPlaying state changes
  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      return;
    }

    // Ensure voices are loaded
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        if (isPlaying) speakCurrentSlide();
      };
    }

    if (isPlaying) {
      speakCurrentSlide();
    } else {
      stopSpeech();
    }

    return () => {
      stopSpeech();
    };
  }, [currentSlide, isPlaying, isOpen]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Space, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide, totalSlides]);

  const handleNext = () => {
    stopSpeech();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    stopSpeech();
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeech();
    } else {
      setIsPlaying(true);
      speakCurrentSlide();
    }
  };

  if (!isOpen) return null;

  // Render content for current slide
  const renderSlideContent = () => {
    if (currentSlide < 4) {
      const teamId = teamIds[currentSlide];
      const teamStudents = students.filter(s => s.team === teamId);
      const summaryId = `w${currentWeek}-t${teamId}`;
      const summary = teamSummaries.find(t => t.id === summaryId) || { bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '' };

      return (
        <div className="flex-1 flex flex-col justify-between space-y-5 max-w-[96vw] xl:max-w-[92vw] mx-auto w-full z-10 py-2">
          {/* Header Team badge */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <div className="flex items-center space-x-4">
              <span className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl text-2xl sm:text-4xl font-extrabold tracking-wide border border-white/20">
                TỔ {teamId}
              </span>
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black display-font text-white tracking-tight">
                  Bảng Điểm & Xếp Loại Tổ {teamId}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-blue-300 mt-1">
                  Lớp {classNameText} • Tuần {currentWeek}
                </p>
              </div>
            </div>
            {speakingState && (
              <div className="flex items-center space-x-3 bg-blue-500/30 border-2 border-blue-400 px-4 py-2 rounded-2xl text-sm sm:text-base font-bold text-blue-200 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Volume2 className="w-5 h-5 text-blue-300 animate-bounce" />
                <span>Đang đọc giọng nữ Max Vol (100%)...</span>
              </div>
            )}
          </div>

          {/* Body: Students Table & Ratings (Dynamic Auto-Fit Grid - 100% Visible No Scroll) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 items-start">
            {/* Student Ratings List (8 cols out of 12 for maximum width) */}
            <div className="lg:col-span-8 glass-card rounded-3xl p-5 sm:p-6 border-2 border-white/20 bg-[#060e26]/90 shadow-2xl flex flex-col">
              <h3 className="text-base sm:text-xl font-black text-amber-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-3 shrink-0">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Danh Sách Xếp Loại Học Sinh Tổ {teamId} ({teamStudents.length} Thành Viên)
              </h3>

              {teamStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-lg sm:text-xl italic font-medium">
                  Tổ chưa có học sinh được phân công
                </div>
              ) : (
                <div className={cn(
                  "grid gap-3",
                  teamStudents.length <= 6 ? "grid-cols-1 sm:grid-cols-2" :
                  teamStudents.length <= 12 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                )}>
                  {teamStudents.map(st => {
                    const ratingId = `w${currentWeek}-s${st.id}`;
                    const r = weeklyRatings.find(x => x.id === ratingId)?.rating || '';
                    let badgeBg = 'bg-slate-700/50 text-slate-300 border-slate-500/50';
                    let label = 'Chưa xếp loại';

                    if (r === 'T') { badgeBg = 'bg-emerald-500/35 text-emerald-200 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'; label = 'TỐT 🌟'; }
                    else if (r === 'K') { badgeBg = 'bg-blue-500/35 text-blue-200 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'; label = 'KHÁ 👍'; }
                    else if (r === 'TB') { badgeBg = 'bg-amber-500/35 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'; label = 'TRUNG BÌNH'; }
                    else if (r === 'Đ') { badgeBg = 'bg-indigo-500/35 text-indigo-200 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]'; label = 'ĐẠT'; }
                    else if (r === 'CĐ') { badgeBg = 'bg-red-500/35 text-red-200 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'; label = 'CHƯA ĐẠT ⚠️'; }

                    const isDense = teamStudents.length > 8;

                    return (
                      <div
                        key={st.id}
                        className={cn(
                          "rounded-2xl bg-[#0b1636]/95 border-2 border-white/20 flex items-center justify-between shadow-lg hover:border-blue-400/50 transition-all",
                          isDense ? "p-3 sm:p-3.5" : "p-4 sm:p-5"
                        )}
                      >
                        <span className={cn(
                          "font-extrabold text-white tracking-wide whitespace-normal break-words leading-tight flex-1 min-w-0 pr-2",
                          teamStudents.length <= 6 ? "text-lg sm:text-2xl" :
                          teamStudents.length <= 12 ? "text-base sm:text-xl" : "text-sm sm:text-base"
                        )}>
                          {st.name}
                        </span>
                        <span className={cn(
                          "rounded-xl font-black border-2 tracking-wider shrink-0",
                          badgeBg,
                          teamStudents.length <= 6 ? "px-4 py-2 text-sm sm:text-lg" :
                          teamStudents.length <= 12 ? "px-3 py-1.5 text-xs sm:text-base" : "px-2.5 py-1 text-xs sm:text-sm"
                        )}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team Scores & Violations Summary (4 cols out of 12) */}
            <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
              {/* Score Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 text-center shadow-lg">
                  <span className="text-xs sm:text-sm uppercase font-extrabold text-emerald-300 block mb-1">Điểm cộng</span>
                  <span className="text-3xl sm:text-5xl font-black text-emerald-300">+{summary.bonusPoints}</span>
                </div>
                <div className="p-4 rounded-3xl bg-red-500/20 border-2 border-red-500/40 text-center shadow-lg">
                  <span className="text-xs sm:text-sm uppercase font-extrabold text-red-300 block mb-1">Điểm trừ</span>
                  <span className="text-3xl sm:text-5xl font-black text-red-300">-{summary.penaltyPoints}</span>
                </div>
                <div className="p-4 rounded-3xl bg-amber-500/25 border-2 border-amber-400 text-center shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  <span className="text-xs sm:text-sm uppercase font-extrabold text-amber-300 block mb-1">Tổng kết</span>
                  <span className="text-3xl sm:text-5xl font-black text-amber-300">{summary.totalPoints}</span>
                </div>
              </div>

              {/* Violations Card */}
              <div className="flex-1 p-6 rounded-3xl bg-[#0b1636]/90 border-2 border-white/20 flex flex-col justify-between shadow-2xl">
                <div>
                  <h4 className="text-sm sm:text-lg font-black uppercase tracking-wider text-red-300 mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                    <ShieldAlert className="w-6 h-6 text-red-400" />
                    Các Lỗi Vi Phạm Trong Tuần
                  </h4>
                  {summary.violations && summary.violations.trim() ? (
                    <p className="text-base sm:text-xl font-semibold text-red-100 leading-relaxed whitespace-pre-wrap bg-red-500/15 p-4 sm:p-5 rounded-2xl border-2 border-red-500/30">
                      {summary.violations}
                    </p>
                  ) : (
                    <div className="p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-200 text-sm sm:text-base font-bold flex items-center gap-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                      <span>Tổ không có lỗi vi phạm nào! Xuất sắc duy trì nề nếp.</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 mt-4 text-xs sm:text-sm text-slate-300 text-center font-bold italic">
                  Slide {currentSlide + 1} / {totalSlides} • Tổ {teamId}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Summary Slide
      const teamScores = teamIds.map(teamId => {
        const summaryId = `w${currentWeek}-t${teamId}`;
        const summary = teamSummaries.find(t => t.id === summaryId) || { bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '' };
        return { teamId, ...summary };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      return (
        <div className="flex-1 flex flex-col justify-between space-y-6 max-w-[96vw] xl:max-w-[92vw] mx-auto w-full z-10 py-2">
          <div className="text-center space-y-2 border-b border-white/20 pb-4">
            <span className="px-6 py-2 rounded-full text-sm sm:text-base font-black bg-amber-500/30 text-amber-200 border-2 border-amber-400 inline-flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Sparkles className="w-5 h-5 text-amber-300" />
              TỔNG KẾT THI ĐỦA TOÀN LỚP
            </span>
            <h2 className="text-3xl sm:text-5xl font-black display-font text-white tracking-tight">
              Bảng Vàng Tổng Kết - Tuần {currentWeek}
            </h2>
            <p className="text-base sm:text-xl font-bold text-blue-300">Lớp {classNameText}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-auto">
            {teamScores.map((t, idx) => {
              const isWinner = idx === 0;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={t.teamId}
                  className={cn(
                    "glass-card rounded-3xl p-6 sm:p-8 border-2 text-center flex flex-col items-center justify-between shadow-2xl relative overflow-hidden bg-[#0b1636]/90",
                    isWinner ? "border-amber-400/80 bg-gradient-to-b from-amber-500/30 via-slate-900/90 to-slate-950/95 shadow-[0_0_35px_rgba(245,158,11,0.4)]" : "border-white/20"
                  )}
                >
                  {isWinner && (
                    <div className="absolute top-3 right-3 px-4 py-1.5 bg-amber-400 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider shadow-lg">
                      HẠNG 1 🏆
                    </div>
                  )}

                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-500/30 border-2 border-blue-400 flex items-center justify-center text-2xl sm:text-3xl font-black text-white mb-4 shadow-lg">
                    TỔ {t.teamId}
                  </div>

                  <div className="space-y-1 my-3">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300 block">Tổng Điểm Thi Đua</span>
                    <span className={cn("text-4xl sm:text-6xl font-black display-font tracking-tight", isWinner ? "text-amber-300" : "text-white")}>
                      {t.totalPoints} <span className="text-base font-normal text-slate-400">đ</span>
                    </span>
                  </div>

                  <div className="w-full pt-4 border-t border-white/15 mt-4 text-sm sm:text-base font-bold space-y-1.5 text-slate-200">
                    <div>Điểm cộng: <strong className="text-emerald-400">+{t.bonusPoints}</strong></div>
                    <div>Điểm trừ: <strong className="text-red-400">-{t.penaltyPoints}</strong></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center text-slate-300 text-sm sm:text-base font-semibold italic border-t border-white/15 pt-4">
            Hoàn thành trình chiếu xếp loại Tuần {currentWeek}. Chúc các tổ tiếp tục duy trì nề nếp tốt!
          </div>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#050a1a] text-white p-4 sm:p-8 overflow-hidden select-none">
        {/* Atmosphere glowing effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Bar Navigation & Controls */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6 relative z-20">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              Trình Chiếu Xếp Loại Tuần
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (Dùng phím mũi tên ← → hoặc Dấu cách để phát/tạm dừng)
            </span>
          </div>

          {/* Media & Slide Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Voice Selection Dropdown */}
            {availableVoices.length > 0 && (
              <div className="flex items-center space-x-2 bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 rounded-xl">
                <Volume2 className="w-4 h-4 text-purple-300 shrink-0" />
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => {
                    const newURI = e.target.value;
                    setSelectedVoiceURI(newURI);
                    if (isPlaying) {
                      stopSpeech();
                      setTimeout(() => speakCurrentSlide(), 150);
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-purple-200 outline-none cursor-pointer max-w-[200px] sm:max-w-[240px]"
                  title="Chọn giọng đọc nữ/hệ thống"
                >
                  {availableVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-white font-sans">
                      Giọng: {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speech Volume status indicator */}
            <div className="hidden xl:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Giọng nữ • Max Vol 100%</span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all shadow-md",
                isPlaying ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
              )}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Tạm Dừng Đọc' : 'Phát Giọng Đọc'}</span>
            </button>

            {/* Close / Exit Fullscreen */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors border border-white/10"
              title="Đóng trình chiếu (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Slide Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center relative z-10"
          >
            {renderSlideContent()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Toolbar & Slide Step Navigation */}
        <div className="pt-4 border-t border-white/15 mt-6 flex items-center justify-between relative z-20">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all",
              currentSlide === 0 ? "opacity-30 cursor-not-allowed border-transparent text-slate-500" : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Slide Trước</span>
          </button>

          {/* Slide Indicator Dots */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  stopSpeech();
                  setCurrentSlide(idx);
                }}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  currentSlide === idx ? "w-8 bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]" : "w-2.5 bg-white/20 hover:bg-white/40"
                )}
                title={idx < 4 ? `Tổ ${idx + 1}` : 'Tổng kết'}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === totalSlides - 1}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all",
              currentSlide === totalSlides - 1 ? "opacity-30 cursor-not-allowed border-transparent text-slate-500" : "bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30"
            )}
          >
            <span>Slide Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};
