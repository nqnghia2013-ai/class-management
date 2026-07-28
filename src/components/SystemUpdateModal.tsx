import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, CheckCircle2, ArrowRight, RefreshCw, X, ShieldCheck, Zap } from 'lucide-react';

interface SystemUpdateModalProps {
  isOpen: boolean;
  onCloseLater: () => void;
  onUpdateComplete: () => void;
  currentVersion?: string;
  latestVersion?: string;
  changelog?: string[];
}

export const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({
  isOpen,
  onCloseLater,
  onUpdateComplete,
  currentVersion = '1.1.0',
  latestVersion = '1.2.0',
  changelog = [
    '✨ Bắt buộc giáo viên mới cài đặt cấu hình thông tin lớp học lần đầu.',
    '⚙️ Tự động kiểm tra và thông báo khi có bản cập nhật mới được deploy trên Web.',
    '📱 Nâng cấp chẩn đoán thiết bị & môi trường trình duyệt Web.',
    '🔒 Bảo mật & tối ưu đồng bộ dữ liệu Real-time Firestore.',
  ],
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Đang chuẩn bị gói cập nhật...');

  useEffect(() => {
    if (!isOpen) {
      setIsUpdating(false);
      setProgress(0);
    }
  }, [isOpen]);

  const handleStartUpdate = () => {
    setIsUpdating(true);
    setProgress(5);
    setStatusMessage('Đang kết nối máy chủ phát hành...');

    // Progress simulation steps
    setTimeout(() => {
      setProgress(25);
      setStatusMessage('Đang tải gói cập nhật phiên bản v' + latestVersion + '...');
    }, 800);

    setTimeout(() => {
      setProgress(55);
      setStatusMessage('Đang nâng cấp cơ sở dữ liệu Firestore & Service Worker...');
    }, 1800);

    setTimeout(() => {
      setProgress(85);
      setStatusMessage('Đang tối ưu hóa giao diện & bộ nhớ IndexedDB...');
    }, 2800);

    setTimeout(() => {
      setProgress(100);
      setStatusMessage('Cập nhật hoàn tất! Đang khởi động lại...');
    }, 3800);

    setTimeout(() => {
      onUpdateComplete();
    }, 4500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] bg-gradient-to-b from-slate-900/95 via-purple-950/90 to-slate-950/95 text-white relative overflow-hidden"
        >
          {/* Glowing atmosphere */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />

          {!isUpdating ? (
            /* VIEW 1: NEW VERSION ANNOUNCEMENT MODAL */
            <div className="space-y-6 relative z-10">
              {/* Header Badge & Title */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg animate-bounce">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black rounded-full uppercase tracking-wider">
                        Cập Nhật Hệ Thống Web
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 border border-purple-500/30 text-[10px] font-mono font-bold rounded-md">
                        v{currentVersion} ➔ v{latestVersion}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black display-font text-white tracking-tight">
                      Đã Có Phiên Bản v{latestVersion}!
                    </h2>
                  </div>
                </div>

                <button
                  onClick={onCloseLater}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="Để Sau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Version Notice Message */}
              <p className="text-sm text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                Hệ thống <strong>Quản Lý Lớp Học Số</strong> vừa xuất bản phiên bản mới <strong>v{latestVersion}</strong> (hiện tại: <strong>v{currentVersion}</strong>). Nhấn <strong>"Cập Nhật Ngay"</strong> để tải gói mã nguồn mới nhất!
              </p>

              {/* Changelog List */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Các tính năng mới trong bản v{latestVersion}:
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {changelog.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-slate-200 font-medium flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  onClick={onCloseLater}
                  className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                  Để Sau
                </button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartUpdate}
                  className="flex-1 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl shadow-purple-500/30 border border-purple-400/40 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4.5 h-4.5 text-amber-300" />
                  <span>Cập Nhật Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          ) : (
            /* VIEW 2: UPDATE PROGRESS MODAL */
            <div className="space-y-6 py-4 text-center relative z-10">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center text-purple-300 shadow-2xl relative">
                <RefreshCw className="w-10 h-10 animate-spin text-purple-400" />
                {progress === 100 && (
                  <div className="absolute inset-0 bg-emerald-500 rounded-3xl flex items-center justify-center text-white animate-pulse">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black display-font text-white">
                  {progress === 100 ? 'Cập Nhật Thành Công!' : 'Đang Cập Nhật Hệ Thống...'}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-purple-300 animate-pulse">
                  {statusMessage}
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="w-full bg-black/40 h-4 rounded-full border border-white/10 p-0.5 overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1">
                  <span>Phiên bản v{latestVersion}</span>
                  <span className="text-emerald-400">{progress}%</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Không tắt trình duyệt trong quá trình đồng bộ dữ liệu.</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
