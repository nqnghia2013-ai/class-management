import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Camera, CheckCircle2, AlertTriangle, Smartphone, 
  Shield, Loader2, QrCode, Monitor, UserCheck 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  getQRSession, markSessionScanned, confirmQRSession, 
  isSessionValid, parseQRSessionId 
} from '../lib/qrLoginService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

type ScanState = 'scanning' | 'confirming' | 'success' | 'error';

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, user }) => {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup scanner on unmount
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      try {
        scannerRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  // Initialize scanner when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScanState('scanning');
      setSessionId(null);
      setErrorMessage('');
      return;
    }

    let mounted = true;

    const initScanner = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!mounted || !videoContainerRef.current) return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        
        const scannerId = 'qr-scanner-viewport';
        
        // Make sure the container element exists
        let scannerElement = document.getElementById(scannerId);
        if (!scannerElement && videoContainerRef.current) {
          scannerElement = document.createElement('div');
          scannerElement.id = scannerId;
          videoContainerRef.current.appendChild(scannerElement);
        }

        if (!scannerElement) return;

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText: string) => {
            if (!mounted) return;
            
            // Parse the QR code content
            const parsedSessionId = parseQRSessionId(decodedText);
            
            if (!parsedSessionId) {
              setScanState('error');
              setErrorMessage('Mã QR không hợp lệ. Vui lòng quét mã QR trên trang đăng nhập máy tính.');
              await stopScanner();
              return;
            }

            // Validate the session exists and is not expired
            try {
              const session = await getQRSession(parsedSessionId);
              
              if (!session) {
                setScanState('error');
                setErrorMessage('Phiên đăng nhập không tồn tại. Mã QR có thể đã hết hạn.');
                await stopScanner();
                return;
              }

              if (!isSessionValid(session)) {
                setScanState('error');
                setErrorMessage('Mã QR đã hết hạn. Vui lòng làm mới mã QR trên máy tính.');
                await stopScanner();
                return;
              }

              if (session.status !== 'pending') {
                setScanState('error');
                setErrorMessage('Mã QR này đã được sử dụng. Vui lòng tạo mã mới.');
                await stopScanner();
                return;
              }

              // Mark as scanned
              await markSessionScanned(parsedSessionId, {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || undefined,
              });

              setSessionId(parsedSessionId);
              setScanState('confirming');
              await stopScanner();
            } catch (e) {
              setScanState('error');
              setErrorMessage('Lỗi kết nối. Vui lòng thử lại.');
              await stopScanner();
            }
          },
          () => {
            // QR code scan error - ignore, keep scanning
          }
        );
      } catch (e: any) {
        if (!mounted) return;
        console.error('[QR Scanner] Init error:', e);
        if (e.toString().includes('NotAllowed') || e.toString().includes('Permission')) {
          setErrorMessage('Vui lòng cho phép truy cập camera để quét mã QR.');
        } else {
          setErrorMessage('Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập.');
        }
        setScanState('error');
      }
    };

    initScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen, stopScanner, user]);

  // Handle confirm login
  const handleConfirm = async () => {
    if (!sessionId) return;
    
    try {
      await confirmQRSession(sessionId, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });
      setScanState('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (e) {
      setErrorMessage('Lỗi xác nhận. Vui lòng thử lại.');
      setScanState('error');
    }
  };

  // Handle retry
  const handleRetry = () => {
    setScanState('scanning');
    setSessionId(null);
    setErrorMessage('');
    // Re-trigger scanner by remounting
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Quét Mã QR Đăng Nhập</h3>
                <p className="text-[11px] text-slate-400">Đăng nhập trên máy tính từ xa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* SCANNING STATE */}
              {scanState === 'scanning' && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-blue-400">
                      <Camera className="w-5 h-5 animate-pulse" />
                      <span className="text-sm font-bold">Đang mở camera...</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Hướng camera vào mã QR trên trang đăng nhập máy tính
                    </p>
                  </div>

                  {/* Camera viewport */}
                  <div 
                    ref={videoContainerRef}
                    className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-blue-500/30"
                  >
                    {/* Scanner overlay corners */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {/* Top-left corner */}
                      <div className="absolute top-4 left-4 w-10 h-10 border-t-3 border-l-3 border-cyan-400 rounded-tl-lg" />
                      {/* Top-right corner */}
                      <div className="absolute top-4 right-4 w-10 h-10 border-t-3 border-r-3 border-cyan-400 rounded-tr-lg" />
                      {/* Bottom-left corner */}
                      <div className="absolute bottom-4 left-4 w-10 h-10 border-b-3 border-l-3 border-cyan-400 rounded-bl-lg" />
                      {/* Bottom-right corner */}
                      <div className="absolute bottom-4 right-4 w-10 h-10 border-b-3 border-r-3 border-cyan-400 rounded-br-lg" />
                      
                      {/* Scanning laser line */}
                      <motion.div
                        animate={{ y: ['10%', '90%', '10%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kết nối bảo mật SSL 256-bit</span>
                  </div>
                </motion.div>
              )}

              {/* CONFIRMING STATE */}
              {scanState === 'confirming' && (
                <motion.div
                  key="confirming"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <Monitor className="w-10 h-10 text-white" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-white">Xác Nhận Đăng Nhập?</h4>
                    <p className="text-sm text-slate-400">
                      Bạn đang đăng nhập vào tài khoản trên <span className="text-blue-400 font-semibold">máy tính</span> với:
                    </p>
                  </div>

                  {/* User info card */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-4">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-blue-500/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {(user.displayName || user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{user.displayName || 'Giáo viên'}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <UserCheck className="w-5 h-5 text-emerald-400 ml-auto" />
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm border border-white/10 transition-colors"
                    >
                      Hủy
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 border border-blue-400/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác Nhận</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS STATE */}
              {scanState === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5 text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/40"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-emerald-400">Đăng Nhập Thành Công!</h4>
                    <p className="text-sm text-slate-400">
                      Máy tính đã được đăng nhập thành công với tài khoản của bạn.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {scanState === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5 text-center py-4"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-red-400">Quét Mã Thất Bại</h4>
                    <p className="text-sm text-slate-400">{errorMessage}</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRetry}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg border border-blue-400/30"
                  >
                    Thử Lại
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
