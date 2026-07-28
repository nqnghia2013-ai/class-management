import React, { useState, useEffect, useRef } from 'react';
import { Users, CalendarDays, ClipboardList, Download, Plus, Trash2, Save, LayoutDashboard, AlertTriangle, FileText, Upload, LogIn, LogOut, Maximize, Minimize, Image as ImageIcon, Award, BookOpen, Crown, Settings, Volume2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx';
import { Student, ShiftAssignment, StudentDutyRecord, DayType, ShiftType, LocationType, StatusType, PenaltyRecord, TeamConfig, WeeklyRating, TeamWeeklySummary, RatingType, ConductType, TabType, Announcement, ClassDocument, ClassOfficersConfig, ClassConfig } from './types';
import { exportToExcel, exportToWord, exportPenaltyToWord, exportConductToExcel, exportConductToWord, DAYS, SHIFTS } from './lib/exportUtils';
import { cn } from './lib/utils';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc, query, onSnapshot, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { SyncInput, SyncTextarea } from './components/SyncInputs';
import { HomeTab } from './components/HomeTab';
import { DocumentsTab } from './components/DocumentsTab';
import { ClassOfficersTab } from './components/ClassOfficersTab';
import { GlassSelect } from './components/GlassSelect';
import { ClassSettingsModal } from './components/ClassSettingsModal';
import { WeeklyRatingPresentation } from './components/WeeklyRatingPresentation';
import { SystemUpdateModal } from './components/SystemUpdateModal';
import { APP_BUILD_VERSION, checkServerVersion } from './lib/versionConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<DayType>('Thứ 2');
  const [activePenaltyId, setActivePenaltyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ratingsContainerRef = useRef<HTMLDivElement>(null);
  const ratingsGridRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // System Update state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateDetails, setUpdateDetails] = useState<{
    currentVersion: string;
    latestVersion: string;
    changelog: string[];
  }>({
    currentVersion: localStorage.getItem('installedAppVersion') || APP_BUILD_VERSION,
    latestVersion: APP_BUILD_VERSION,
    changelog: [],
  });

  const performVersionCheck = async (isManual = false) => {
    try {
      const res = await checkServerVersion(isManual);
      if (res.hasUpdate) {
        setUpdateDetails({
          currentVersion: res.currentVersion,
          latestVersion: res.latestVersion,
          changelog: res.changelog,
        });
        setShowUpdateModal(true);
      } else if (isManual) {
        alert(`Hệ thống đang chạy trên phiên bản mới nhất (v${res.currentVersion}).`);
      }
    } catch (e) {
      console.warn('Error performing version check', e);
    }
  };

  // Check system version on mount, periodically & on tab focus
  useEffect(() => {
    // Initial check
    performVersionCheck(false);

    // Periodic check every 10 minutes
    const intervalId = setInterval(() => {
      performVersionCheck(false);
    }, 10 * 60 * 1000);

    // Tab visibility change check
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performVersionCheck(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdateComplete = () => {
    try {
      localStorage.setItem('installedAppVersion', updateDetails.latestVersion);
      localStorage.removeItem('postponedAppVersion');
    } catch (e) {}
    if (user) {
      setDoc(doc(db, "users", user.uid, "settings", "versionInfo"), {
        installedVersion: updateDetails.latestVersion,
        updatedAt: new Date().toISOString(),
      }).catch(err => console.warn("Error updating versionInfo in Firestore:", err));
    }
    setShowUpdateModal(false);
    // Hard reload application to clear asset cache
    window.location.reload();
  };

  const handlePostponeUpdate = () => {
    try {
      localStorage.setItem('postponedAppVersion', updateDetails.latestVersion);
    } catch (e) {}
    setShowUpdateModal(false);
  };

  const handleManualCheckUpdate = () => {
    setShowSettingsModal(false);
    setTimeout(() => {
      performVersionCheck(true);
    }, 300);
  };

  // Class Settings state with local storage fallback
  const [classConfig, setClassConfig] = useState<ClassConfig>(() => {
    try {
      const saved = localStorage.getItem('classConfig');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading classConfig from localStorage', e);
    }
    return {
      grade: '8',
      section: 'A2',
      className: '8A2',
      schoolYear: '2026 - 2027',
      schoolName: 'TRƯỜNG THCS ...',
    };
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMandatorySettings, setIsMandatorySettings] = useState(false);
  const [showRatingsPresentation, setShowRatingsPresentation] = useState(false);



  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Cleanup previous listeners
      unsubs.forEach(u => u());
      unsubs = [];

      // 1. Immediately reset states on account switch/logout to prevent cross-account data leakage
      setStudents([]);
      setShiftAssignments([]);
      setDutyRecords([]);
      setPenalties([]);
      setWeeklyRatings([]);
      setTeamSummaries([]);
      setAnnouncements([]);
      setClassDocuments([]);
      setOfficersConfig({
        id: 'main',
        classLeader: '',
        classLeaderMember: '',
        academicDeputy: '',
        academicDeputyMember: '',
        laborDeputy: '',
        laborDeputyMember: '',
      });
      setTeamConfigs([
        { id: '1', leader: '', deputy: '' },
        { id: '2', leader: '', deputy: '' },
        { id: '3', leader: '', deputy: '' },
        { id: '4', leader: '', deputy: '' },
      ]);

      if (currentUser) {
        // ----------------------------------------------------
        // REALTIME FIRESTORE MULTI-DEVICE & MULTI-ACCOUNT SYNC
        // ----------------------------------------------------

        // 1. Students Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "students"), snapshot => {
          const loaded = snapshot.docs.map(doc => doc.data() as Student);
          loaded.sort((a, b) => {
             if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
               return a.orderIndex - b.orderIndex;
             }
             return a.name.localeCompare(b.name, 'vi');
          });
          setStudents(loaded);
        }, err => console.warn("Students sync error:", err)));

        // 2. Shift Assignments Collection (Auto-init in Firestore for new accounts)
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "shiftAssignments"), snapshot => {
          const data = snapshot.docs.map(doc => doc.data() as ShiftAssignment);
          if (data.length === 0) {
            const init: ShiftAssignment[] = [];
            const batch = writeBatch(db);
            DAYS.forEach(day => {
              SHIFTS.forEach(shift => {
                 const item = { id: `${day}-${shift}`, day, shift, team: 0, userId: currentUser.uid };
                 init.push(item);
                 batch.set(doc(db, "users", currentUser.uid, "shiftAssignments", item.id), item);
              });
            });
            batch.commit().catch(e => console.warn("Init shifts batch error:", e));
            setShiftAssignments(init);
          } else {
            setShiftAssignments(data);
          }
        }, err => console.warn("ShiftAssignments sync error:", err)));

        // 3. Duty Records Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "dutyRecords"), snapshot => {
          setDutyRecords(snapshot.docs.map(doc => doc.data() as StudentDutyRecord));
        }, err => console.warn("DutyRecords sync error:", err)));

        // 4. Penalty Records Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "penalties"), snapshot => {
          setPenalties(snapshot.docs.map(doc => doc.data() as PenaltyRecord));
        }, err => console.warn("Penalties sync error:", err)));

        // 5. Team Configs Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "teamConfigs"), snapshot => {
          const loaded = snapshot.docs.map(doc => doc.data() as TeamConfig);
          const defaultConfigs: TeamConfig[] = [
            { id: '1', leader: '', deputy: '' },
            { id: '2', leader: '', deputy: '' },
            { id: '3', leader: '', deputy: '' },
            { id: '4', leader: '', deputy: '' },
          ];
          const merged = defaultConfigs.map(def => {
             const found = loaded.find(l => l.id === def.id);
             return found || def;
          });
          setTeamConfigs(merged);
        }, err => console.warn("TeamConfigs sync error:", err)));

        // 6. Weekly Ratings Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "weeklyRatings"), snapshot => {
          setWeeklyRatings(snapshot.docs.map(doc => doc.data() as WeeklyRating));
        }, err => console.warn("WeeklyRatings sync error:", err)));

        // 7. Team Weekly Summaries Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "teamWeeklySummaries"), snapshot => {
          setTeamSummaries(snapshot.docs.map(doc => doc.data() as TeamWeeklySummary));
        }, err => console.warn("TeamSummaries sync error:", err)));

        // 8. Announcements Collection (Full real-time sync across tabs/devices)
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "announcements"), snapshot => {
          const loaded = snapshot.docs.map(doc => doc.data() as Announcement);
          setAnnouncements(loaded);
        }, err => console.warn("Announcements sync error:", err)));

        // 9. Class Documents Collection (Scoped cleanly to currentUser, no cross-user merging)
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "classDocuments"), snapshot => {
          const cloudDocs = snapshot.docs.map(doc => doc.data() as ClassDocument);
          setClassDocuments(cloudDocs);
          cloudDocs.forEach(d => saveDocumentIDB(d));
        }, err => {
          console.warn("ClassDocuments sync error:", err?.message);
        }));

        // 10. Class Officers Collection
        unsubs.push(onSnapshot(collection(db, "users", currentUser.uid, "classOfficers"), snapshot => {
          const loaded = snapshot.docs.map(doc => doc.data() as ClassOfficersConfig);
          if (loaded.length > 0) {
            setOfficersConfig(loaded[0]);
          }
        }, err => console.warn("ClassOfficers sync error:", err)));

        // 11. Class Settings Config Document (Enforce mandatory initial setup for new teachers)
        unsubs.push(onSnapshot(doc(db, "users", currentUser.uid, "settings", "classConfig"), snapshot => {
          if (snapshot.exists()) {
            const loadedConfig = snapshot.data() as ClassConfig;
            if (loadedConfig && loadedConfig.className && loadedConfig.configured) {
              setClassConfig(loadedConfig);
              setIsMandatorySettings(false);
              try {
                localStorage.setItem('classConfig', JSON.stringify(loadedConfig));
              } catch (e) {}
            } else {
              // Not configured yet -> prompt mandatory initial setup modal!
              setShowSettingsModal(true);
              setIsMandatorySettings(true);
            }
          } else {
            // New teacher login -> prompt mandatory initial setup modal!
            setShowSettingsModal(true);
            setIsMandatorySettings(true);
          }
        }, err => console.warn("ClassConfig sync error:", err)));

      } else {
        // Logged out: load offline documents from IndexedDB
        loadDocumentsIDB().then(localDocs => {
          if (localDocs && localDocs.length > 0) setClassDocuments(localDocs);
        });
      }
    });

    return () => {
      unsubscribe();
      unsubs.forEach(u => u());
    };
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error logging in', error);
      alert('Đăng nhập thất bại.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  const handleSaveClassConfig = async (newConfig: ClassConfig) => {
    const updatedConfig: ClassConfig = { ...newConfig, configured: true };
    setClassConfig(updatedConfig);
    setIsMandatorySettings(false);
    try {
      localStorage.setItem('classConfig', JSON.stringify(updatedConfig));
    } catch (e) {
      console.error('Error saving classConfig to localStorage', e);
    }
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "settings", "classConfig"), updatedConfig);
      } catch (err) {
        console.error('Error saving classConfig to Firestore', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const newStudents: Student[] = [];
        let startRow = 0;
        for (let i = 0; i < data.length; i++) {
           const row = data[i] as any[];
           if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('họ') || cell.toLowerCase().includes('tên') || cell.toLowerCase().includes('mã')))) {
             startRow = i + 1;
             break;
           }
        }
        
        if (startRow === 0 && data.length > 0 && Array.isArray(data[0]) && data[0].length >= 2) {
           if (typeof data[0][1] === 'string' && data[0][1].length > 3) {
             startRow = 0;
           } else {
             startRow = 1;
           }
        }

        let baseOrderIndex = students.length > 0 ? Math.max(...students.map(s => s.orderIndex || 0)) + 1 : 0;

        for (let i = startRow; i < data.length; i++) {
           const row = data[i] as any[];
           if (!row || row.length < 2) continue;
           
           let code = '';
           let name = '';
           
           const potentialCodeIdx = row.findIndex(c => typeof c === 'string' && (/^[a-zA-Z0-9-]+$/.test(c.trim()) || !isNaN(Number(c))) || typeof c === 'number');
           const potentialNameIdx = row.findIndex((c, idx) => typeof c === 'string' && idx !== potentialCodeIdx && c.length > 3 && isNaN(Number(c)));
           
           code = String(potentialCodeIdx >= 0 ? row[potentialCodeIdx] : (row[1] || row[0] || '')).trim();
           name = String(potentialNameIdx >= 0 ? row[potentialNameIdx] : (row[potentialCodeIdx === 1 ? 2 : 1] || '')).trim();
           
           if (name && name !== 'undefined') {
             newStudents.push({
               id: crypto.randomUUID(),
               code: code,
               name: name,
               team: 0,
               orderIndex: baseOrderIndex++
             });
           }
        }
        
        if (newStudents.length > 0) {
          if (user) {
            const batch = writeBatch(db);
            newStudents.forEach(st => {
              const cloudSt = { ...st, userId: user.uid };
              batch.set(doc(db, "users", user.uid, "students", st.id), cloudSt);
            });
            await batch.commit();
          } else {
            setStudents(prev => [...prev, ...newStudents]);
          }
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ.');
        }

      } else if (fileExt === 'docx') {
         alert('Tính năng nhập từ Word đang ở mức cơ bản, vui lòng ưu tiên dùng Excel để đảm bảo dữ liệu.');
         const mammoth = await import('mammoth');
         const arrayBuffer = await file.arrayBuffer();
         const result = await mammoth.extractRawText({ arrayBuffer });
         const lines = result.value.split('\n').map(l => l.trim()).filter(Boolean);
         
         const newStudents: Student[] = [];
         let baseOrderIndexWord = students.length > 0 ? Math.max(...students.map(s => s.orderIndex || 0)) + 1 : 0;
         
         for (let i = 0; i < lines.length; i++) {
           const line = lines[i];
           const parts = line.split(/[\t,-]/).map(s => s.trim()).filter(Boolean);
           if (parts.length >= 2) {
             newStudents.push({
               id: crypto.randomUUID(),
               code: parts[0],
               name: parts.slice(1).join(' '),
               team: 0,
               orderIndex: baseOrderIndexWord++
             });
           } else if (line.length > 5 && isNaN(Number(line))) {
             newStudents.push({
               id: crypto.randomUUID(),
               code: '',
               name: line,
               team: 0,
               orderIndex: baseOrderIndexWord++
             });
           }
         }
         if (newStudents.length > 0) {
            if (user) {
              const batch = writeBatch(db);
              newStudents.forEach(st => {
                const cloudSt = { ...st, userId: user.uid };
                batch.set(doc(db, "users", user.uid, "students", st.id), cloudSt);
              });
              await batch.commit();
            } else {
              setStudents(prev => [...prev, ...newStudents]);
            }
         } else {
            alert('Không thể trích xuất dữ liệu từ file Word.');
         }
      } else {
         alert('Vui lòng chọn file Excel (.xlsx, .csv) hoặc Word (.docx)');
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi đọc file');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [dutyRecords, setDutyRecords] = useState<StudentDutyRecord[]>([]);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [weeklyRatings, setWeeklyRatings] = useState<WeeklyRating[]>([]);
  const [teamSummaries, setTeamSummaries] = useState<TeamWeeklySummary[]>([]);
  const [classDocuments, setClassDocuments] = useState<ClassDocument[]>([]);
  const [officersConfig, setOfficersConfig] = useState<ClassOfficersConfig>({
    id: 'main',
    classLeader: '',
    classLeaderMember: '',
    academicDeputy: '',
    academicDeputyMember: '',
    laborDeputy: '',
    laborDeputyMember: '',
  });
  const [teamConfigs, setTeamConfigs] = useState<TeamConfig[]>([
    { id: '1', leader: '', deputy: '' },
    { id: '2', leader: '', deputy: '' },
    { id: '3', leader: '', deputy: '' },
    { id: '4', leader: '', deputy: '' },
  ]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'default-1',
      title: '📌 Nhắc nhở nề nếp trực nhật Tuần mới',
      content: 'Yêu cầu các Tổ trưởng đôn đốc ca trực đúng giờ (Sáng 6h45, Chiều 16h45). Các nhóm phân công lau bảng, thu gom rác đúng nơi quy định.',
      date: new Date().toLocaleDateString('vi-VN'),
      author: 'Giáo viên chủ nhiệm',
      isPinned: true,
      priority: 'high',
    },
    {
      id: 'default-2',
      title: '📢 Sinh hoạt lớp & Tổng kết Thi đua',
      content: 'Tiết 5 Thứ Sáu sinh hoạt lớp tổng kết tuần. Biểu dương các cá nhân và Tổ có thành tích thi đua lao động xuất sắc.',
      date: new Date().toLocaleDateString('vi-VN'),
      author: 'Ban Cán sự Lớp',
      isPinned: false,
      priority: 'normal',
    }
  ]);

  const handleAddAnnouncement = async (title: string, content: string, priority: 'high' | 'normal' | 'low') => {
    const newAnc: Announcement = {
      id: crypto.randomUUID(),
      title,
      content,
      date: new Date().toLocaleDateString('vi-VN'),
      author: user?.displayName || 'Giáo viên',
      isPinned: false,
      priority,
      userId: user?.uid || '',
    };
    if (user) {
      await setDoc(doc(db, "users", user.uid, "announcements", newAnc.id), newAnc);
    } else {
      setAnnouncements(prev => [newAnc, ...prev]);
    }
  };

  const handleTogglePinAnnouncement = async (id: string) => {
    const anc = announcements.find(a => a.id === id);
    if (!anc) return;
    if (user) {
      await setDoc(doc(db, "users", user.uid, "announcements", id), { ...anc, isPinned: !anc.isPinned }, { merge: true });
    } else {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, "users", user.uid, "announcements", id));
    } else {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  // Document Handlers
  const handleAddDocument = async (newDoc: ClassDocument) => {
    // 1. Immediately save to IndexedDB (supports multi-GB storage, no permission errors)
    await saveDocumentIDB(newDoc);

    // 2. Immediately update UI state
    setClassDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);

    // 3. Try syncing to Cloud if logged in
    if (user) {
      try {
        const cloudDoc = { ...newDoc, userId: user.uid };
        await setDoc(doc(db, "users", user.uid, "classDocuments", newDoc.id), cloudDoc);
      } catch (err: any) {
        console.warn("Firestore sync skipped (document saved locally in IndexedDB):", err?.message);
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteDocumentIDB(id);
    setClassDocuments(prev => prev.filter(d => d.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "classDocuments", id));
      } catch (err: any) {
        console.warn("Firestore delete skipped:", err?.message);
      }
    }
  };

  const handleUpdateOfficersConfig = async (updates: Partial<ClassOfficersConfig>) => {
    const updated = { ...officersConfig, ...updates, id: 'main' };
    setOfficersConfig(updated);
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "classOfficers", 'main'), { ...updated, userId: user.uid }, { merge: true });
      } catch (err) {
        console.warn("Firestore officersConfig save error:", err);
      }
    }
  };

  // Handlers for Students
  const handleAddStudent = async () => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      team: 0,
      userId: user?.uid || '',
      orderIndex: students.length > 0 ? Math.max(...students.map(s => s.orderIndex || 0)) + 1 : 0
    };
    if (user) {
      await setDoc(doc(db, "users", user.uid, "students", newStudent.id), newStudent);
    } else {
      setStudents([...students, newStudent]);
    }
  };

  const handleUpdateStudent = async (id: string, field: keyof Student, value: any) => {
    if (user) {
      const student = students.find(s => s.id === id);
      if (student) {
        await setDoc(doc(db, "users", user.uid, "students", id), { ...student, [field]: value }, { merge: true });
      }
    } else {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    }
  };

  const handleUpdateAllStudentsClass = async (value: string) => {
    if (user) {
      const batch = writeBatch(db);
      students.forEach(st => {
        const ref = doc(db, "users", user.uid, "students", st.id);
        batch.set(ref, { classNameText: value }, { merge: true });
      });
      await batch.commit();
    } else {
      setStudents(prev => prev.map(s => ({ ...s, classNameText: value })));
    }
  };

  const handleUpdateTeamConfig = async (id: string, field: 'leader' | 'deputy', value: string) => {
    if (user) {
      const existing = teamConfigs.find(t => t.id === id);
      if (existing) {
        await setDoc(doc(db, "users", user.uid, "teamConfigs", id), {
          ...existing,
          [field]: value 
        }, { merge: true });
      } else {
        const newConfig: TeamConfig = { id, leader: '', deputy: '' };
        newConfig[field] = value;
        await setDoc(doc(db, "users", user.uid, "teamConfigs", id), newConfig);
      }
    } else {
      setTeamConfigs(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    }
  };

  const handleUpdateWeeklyRating = async (studentId: string, rating: RatingType) => {
    const id = `w${currentWeek}-s${studentId}`;
    if (user) {
      await setDoc(doc(db, "users", user.uid, "weeklyRatings", id), {
        id, week: currentWeek, studentId, rating, userId: user.uid
      });
    } else {
      setWeeklyRatings(prev => {
        const existing = prev.find(r => r.id === id);
        if (existing) {
          return prev.map(r => r.id === id ? { ...r, rating } : r);
        }
        return [...prev, { id, week: currentWeek, studentId, rating }];
      });
    }
  };

  const handleUpdateTeamSummary = async (teamId: number, updates: Partial<TeamWeeklySummary>) => {
    const id = `w${currentWeek}-t${teamId}`;
    if (user) {
      const existing = teamSummaries.find(t => t.id === id) || { 
         id, week: currentWeek, teamId, bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '', userId: user.uid 
      };
      await setDoc(doc(db, "users", user.uid, "teamWeeklySummaries", id), {
        ...existing, ...updates, userId: user.uid
      });
    } else {
      setTeamSummaries(prev => {
        const existing = prev.find(t => t.id === id);
        if (existing) {
          return prev.map(t => t.id === id ? { ...t, ...updates } : t);
        }
        const newSummary: TeamWeeklySummary = { id, week: currentWeek, teamId, bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '', ...updates };
        return [...prev, newSummary];
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, "users", user.uid, "students", id));
    } else {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  // Handlers for Shifts
  const handleUpdateShift = async (day: DayType, shift: ShiftType, team: number) => {
    const id = currentWeek === 1 ? `${day}-${shift}` : `w${currentWeek}-${day}-${shift}`;
    if (user) {
      const updated: ShiftAssignment = { id, day, shift, team, week: currentWeek, userId: user.uid };
      await setDoc(doc(db, "users", user.uid, "shiftAssignments", id), updated);
    } else {
      setShiftAssignments(prev => {
        const idx = prev.findIndex(a => a.day === day && a.shift === shift && (a.week || 1) === currentWeek);
        if (idx >= 0) {
          const arr = [...prev];
          arr[idx] = { ...arr[idx], team };
          return arr;
        } else {
           return [...prev, { id, day, shift, team, week: currentWeek }];
        }
      });
    }
  };

  // Handlers for Tracking
  const handleUpdateRecord = async (id: string, updates: Partial<StudentDutyRecord>) => {
    if (user) {
      let record = dutyRecords.find(r => r.id === id);
      if (!record) {
        record = { id, day: updates.day!, shift: updates.shift!, studentId: updates.studentId!, location: '', status: '', week: currentWeek, userId: user.uid };
      }
      const updated = { ...record, ...updates, week: currentWeek, userId: user.uid };
      await setDoc(doc(db, "users", user.uid, "dutyRecords", id), updated);
    } else {
      setDutyRecords(prev => {
        const idx = prev.findIndex(r => r.id === id);
        if (idx >= 0) {
          const newRecords = [...prev];
          newRecords[idx] = { ...newRecords[idx], ...updates };
          return newRecords;
        } else {
          return [...prev, { id, location: '', status: '', week: currentWeek, ...updates } as StudentDutyRecord];
        }
      });
    }
  };

  const handleCreatePenalty = async () => {
    const newPenalty: PenaltyRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('vi-VN'),
      studentId: '',
      reason: 'Không trực nhật theo phân công',
      deduction: 2,
      week: currentWeek,
      userId: user?.uid || '',
    };
    if (user) {
      await setDoc(doc(db, "users", user.uid, "penalties", newPenalty.id), newPenalty);
    } else {
      setPenalties([...penalties, newPenalty]);
    }
  };

  const handleAutoGeneratePenalties = async () => {
    const currentWeekDuties = dutyRecords.filter(r => (r.week || 1) === currentWeek);
    const uncompletedDuties = currentWeekDuties.filter(r => r.status === 'Chưa hoàn thành');
    if (uncompletedDuties.length === 0) {
      alert("Không có học sinh nào chưa hoàn thành trực nhật.");
      return;
    }

    const newGeneratedPenalties: PenaltyRecord[] = [];
    
    uncompletedDuties.forEach(duty => {
      // Check if already penalized for this duty in this week
      const alreadyPenalized = penalties.some(p => (p.week || 1) === currentWeek && p.studentId === duty.studentId && p.dutyDay === duty.day && p.dutyShift === duty.shift);
      
      if (!alreadyPenalized) {
        newGeneratedPenalties.push({
          id: crypto.randomUUID(),
          date: new Date().toLocaleDateString('vi-VN'),
          studentId: duty.studentId,
          reason: `Không hoàn thành trực nhật`,
          deduction: 2,
          week: currentWeek,
          userId: user?.uid || '',
          dutyDay: duty.day,
          dutyShift: duty.shift,
          dutyLocation: duty.location,
        });
      }
    });

    if (newGeneratedPenalties.length === 0) {
       alert("Tất cả vi phạm hiện tại đã được lập phiếu phạt.");
       return;
    }

    if (user) {
      const batch = writeBatch(db);
      newGeneratedPenalties.forEach(p => {
        batch.set(doc(db, "users", user.uid, "penalties", p.id), p);
      });
      await batch.commit();
      alert(`Đã lập thêm ${newGeneratedPenalties.length} phiếu phạt tự động.`);
    } else {
      setPenalties([...penalties, ...newGeneratedPenalties]);
      alert(`Đã lập thêm ${newGeneratedPenalties.length} phiếu phạt tự động.`);
    }
  };

  const handleUpdatePenalty = async (id: string, updates: Partial<PenaltyRecord>) => {
    if (user) {
      const penalty = penalties.find(p => p.id === id);
      if (penalty) {
        await setDoc(doc(db, "users", user.uid, "penalties", id), { ...penalty, ...updates }, { merge: true });
      }
    } else {
      setPenalties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const handleDeletePenalty = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, "users", user.uid, "penalties", id));
    } else {
      setPenalties(prev => prev.filter(p => p.id !== id));
    }
  };

  const getRecord = (day: DayType, shift: ShiftType, studentId: string) => {
    const recordId = currentWeek === 1 ? `${day}-${shift}-${studentId}` : `w${currentWeek}-${day}-${shift}-${studentId}`;
    let record = dutyRecords.find(r => r.id === recordId);
    if (!record) {
      record = {
        id: recordId,
        day,
        shift,
        studentId,
        location: '',
        status: '',
        week: currentWeek
      };
    }
    return record;
  };

  const LOCATIONS: LocationType[] = [
    'Sân', 'Trên lớp', 'Nhà xe', 'Bồn cây', 'Cổng trường', 'Thùng rác chung', 'Thùng rác tầng 1'
  ];

  const renderShiftCard = (day: DayType, shift: ShiftType, headerBg: string, dotCol: string, txtCol: string, selectBg: string, title: string) => {
    const assignment = shiftAssignments.find(a => a.day === day && a.shift === shift && (a.week || 1) === currentWeek);
    const team = assignment?.team || 0;
    const teamStudents = students.filter(s => s.team === team);

    return (
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card flex flex-col overflow-hidden max-h-full rounded-2xl"
      >
        <div className={cn("p-4 border-b border-white/10 flex justify-between items-center shrink-0", headerBg.replace('bg-', 'bg-opacity-20 bg-').replace('100', '500').replace('50', '500').replace('200', '500').replace('purple-100', 'purple-500/20').replace('orange-50', 'orange-500/20').replace('emerald-50', 'emerald-500/20').replace('blue-50', 'blue-500/20'))}>
          <h3 className={cn("font-bold flex items-center text-sm sm:text-base text-white")}>
            <span className={cn("w-3 h-3 rounded-full mr-2 shadow-[0_0_8px_currentColor]", dotCol.replace('bg-', 'bg-').replace('400', '400').replace('500', '500').replace('600', '500').replace('text-', 'bg-').replace('emerald-600', 'bg-emerald-400 text-emerald-400'))}></span>
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-300 hidden sm:inline">Trực bởi:</span>
            <GlassSelect
              value={team}
              onChange={(val) => handleUpdateShift(day, shift, Number(val))}
              options={[
                { value: 0, label: 'Chưa phân' },
                { value: 1, label: 'TỔ 1' },
                { value: 2, label: 'TỔ 2' },
                { value: 3, label: 'TỔ 3' },
                { value: 4, label: 'TỔ 4' },
              ]}
              size="sm"
              className="w-32"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-transparent min-h-[220px] flex flex-col">
          {team === 0 || teamStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/20">
              <AlertTriangle className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
              <p className="text-slate-400 text-xs font-medium max-w-xs leading-relaxed">
                {team === 0 
                  ? "Ca trực chưa được phân công tổ. Vui lòng chọn Tổ ở góc trên hoặc tại tab 'Phân Công Ca'."
                  : `Tổ ${team} chưa có học sinh nào. Vui lòng thêm học sinh vào Tổ ${team} tại tab 'Danh Sách Lớp'.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-200">
              <thead className="bg-black/20 text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3">Thành viên</th>
                  <th className="px-4 py-3 w-28 hidden sm:table-cell">Mã ĐD</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3 text-center w-28">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {teamStudents.map((st) => {
                    const record = getRecord(day, shift, st.id);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        key={st.id} 
                        className="table-row-glass"
                      >
                        <td className="px-4 py-3 font-medium text-slate-100">{st.name}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[10px] tracking-wider hidden sm:table-cell">{st.code}</td>
                        <td className="px-4 py-3">
                          <GlassSelect
                            value={record.location}
                            onChange={(val) => handleUpdateRecord(record.id, {
                              day, shift, studentId: st.id, location: val as LocationType
                            })}
                            options={[
                              { value: '', label: 'Chọn vị trí...' },
                              ...LOCATIONS.map(loc => ({ value: loc, label: loc }))
                            ]}
                            size="sm"
                            placeholder="Chọn vị trí..."
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <GlassSelect
                            value={record.status}
                            onChange={(val) => handleUpdateRecord(record.id, {
                              day, shift, studentId: st.id, status: val as StatusType
                            })}
                            options={[
                              { value: '', label: 'Chờ trực' },
                              { value: 'Đã hoàn thành', label: 'Đã xong', badge: 'ĐÃ XONG', badgeColor: 'bg-green-500/20 text-green-300' },
                              { value: 'Chưa hoàn thành', label: 'Chưa xong', badge: 'CHƯA XONG', badgeColor: 'bg-amber-500/20 text-amber-300' },
                            ]}
                            size="sm"
                            placeholder="Chờ trực"
                          />
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </motion.section>
    )
  }

  const renderClassTab = () => (
    <>
      <header className="border-b border-white/10 p-6 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-transparent backdrop-blur-sm z-20 sticky top-0">
        <div>
          <h2 className="text-3xl display-font font-bold text-white tracking-tight">Danh Sách Lớp & Tổ</h2>
          <p className="text-slate-400 text-sm mt-1">Quản lý học sinh và phân chia tổ</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv, .docx" 
            onChange={handleFileUpload} 
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-white/10 shadow-sm"
          >
            <Upload size={16} /> Nhập file
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddStudent}
            className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          >
            <Plus size={16} /> Thêm HS
          </motion.button>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6 overflow-auto space-y-6">
        {/* Team Stats Summary */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[1, 2, 3, 4].map(teamIdNum => {
              const teamId = String(teamIdNum);
              const config = teamConfigs.find(t => t.id === teamId) || { id: teamId, leader: '', deputy: '' };
              const teamStudentCount = students.filter(s => s.team === teamIdNum).length;
              return (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: teamIdNum * 0.05 }}
                   key={teamId} 
                   className="glass-card rounded-2xl p-4 shadow-lg border border-white/10"
                 >
                   <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                     <h3 className="font-bold text-white text-md">Tổ {teamId}</h3>
                     <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md">{teamStudentCount} thành viên</span>
                   </div>
                   <div className="space-y-3">
                     <div>
                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tổ trưởng</label>
                       <SyncInput 
                          type="text"
                          placeholder="Tên tổ trưởng..."
                          className="w-full bg-slate-800/50 border border-white/10 text-xs rounded-lg p-2 text-slate-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                          value={config.leader}
                          onChangeValue={(val: string) => handleUpdateTeamConfig(teamId, 'leader', val)}
                       />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tổ phó</label>
                       <SyncInput 
                          type="text"
                          placeholder="Tên tổ phó..."
                          className="w-full bg-slate-800/50 border border-white/10 text-xs rounded-lg p-2 text-slate-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                          value={config.deputy}
                          onChangeValue={(val: string) => handleUpdateTeamConfig(teamId, 'deputy', val)}
                       />
                     </div>
                   </div>
                 </motion.div>
              );
           })}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden max-w-5xl mx-auto shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-200">
                <thead className="bg-black/20 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10 backdrop-blur-md">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 w-16 text-center">STT</th>
                    <th className="px-4 sm:px-6 py-4 w-32 sm:w-48">Mã Định Danh</th>
                    <th className="px-4 sm:px-6 py-4">Họ và Tên</th>
                    <th className="px-4 sm:px-6 py-4 w-32 sm:w-40 text-center">Tổ (1-4)</th>
                    <th className="px-4 sm:px-6 py-4 text-center w-20 sm:w-24">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-base italic">
                          Chưa có học sinh nào. Bấm "Thêm HS" để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {students.map((student, index) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={student.id} 
                            className="table-row-glass transition-colors group"
                          >
                            <td className="px-4 sm:px-6 py-3 font-medium text-slate-400 text-center">{index + 1}</td>
                            <td className="px-4 sm:px-6 py-3">
                              <SyncInput
                                type="text"
                                className="w-full glass-input rounded-lg px-3 py-2 font-mono text-xs tracking-widest bg-transparent border-transparent focus:bg-white/5 focus:border-white/20 transition-all placeholder:text-slate-600"
                                value={student.code}
                                onChangeValue={(val: string) => handleUpdateStudent(student.id, 'code', val)}
                                placeholder="0012..."
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <SyncInput
                                type="text"
                                className="w-full glass-input rounded-lg px-3 py-2 font-medium text-slate-100 bg-transparent border-transparent focus:bg-white/5 focus:border-white/20 transition-all placeholder:text-slate-600"
                                value={student.name}
                                onChangeValue={(val: string) => handleUpdateStudent(student.id, 'name', val)}
                                placeholder="Nhập tên..."
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-center">
                              <GlassSelect
                                value={student.team}
                                onChange={(val) => handleUpdateStudent(student.id, 'team', Number(val))}
                                options={[
                                  { value: 0, label: '-- Chưa phân --' },
                                  { value: 1, label: 'Tổ 1', badge: 'Tổ 1' },
                                  { value: 2, label: 'Tổ 2', badge: 'Tổ 2' },
                                  { value: 3, label: 'Tổ 3', badge: 'Tổ 3' },
                                  { value: 4, label: 'Tổ 4', badge: 'Tổ 4' },
                                ]}
                                size="sm"
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-center">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-slate-500 hover:text-red-400 p-2 rounded-full transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Trash2 size={18} />
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderShiftsTab = () => (
    <>
      <header className="border-b border-white/10 p-6 shrink-0 bg-transparent backdrop-blur-sm z-20 sticky top-0">
        <div>
          <h2 className="text-3xl display-font font-bold text-white tracking-tight">Phân Công Tổ Trực</h2>
          <p className="text-slate-400 text-sm mt-1">Thiết lập ca trực tổ theo từng ngày trong tuần</p>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {DAYS.map((day, dIdx) => (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: dIdx * 0.05 }}
               key={day} 
               className="glass-card rounded-2xl overflow-hidden shadow-xl"
             >
               <div className="bg-black/20 p-4 border-b border-white/5 flex justify-center items-center backdrop-blur-md">
                  <h3 className="font-bold text-white tracking-wider text-sm uppercase">{day}</h3>
               </div>
               <div className="p-5 space-y-6">
                 {SHIFTS.map(shift => {
                   const assignment = shiftAssignments.find(a => a.day === day && a.shift === shift && ((a.week || 1) === currentWeek));
                   return (
                     <div key={`${day}-${shift}`}>
                       <label className="block text-[10px] font-bold text-blue-300/80 mb-2 uppercase tracking-widest pl-1">
                          Ca {shift}
                       </label>
                       <GlassSelect
                          value={assignment?.team || 0}
                          onChange={(val) => handleUpdateShift(day, shift, Number(val))}
                          options={[
                            { value: 0, label: '-- Chưa phân công --' },
                            { value: 1, label: 'Tổ 1', badge: 'Tổ 1' },
                            { value: 2, label: 'Tổ 2', badge: 'Tổ 2' },
                            { value: 3, label: 'Tổ 3', badge: 'Tổ 3' },
                            { value: 4, label: 'Tổ 4', badge: 'Tổ 4' },
                          ]}
                          size="sm"
                       />
                     </div>
                   )
                 })}
               </div>
             </motion.div>
          ))}
        </div>
      </div>
    </>
  );

  const renderTrackingTab = () => (
    <>
      <header className="border-b border-white/10 p-6 shrink-0 z-10 bg-transparent backdrop-blur-sm sticky top-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl display-font font-bold text-white tracking-tight">Bảng Phân Công Trực Nhật</h2>
            <p className="text-slate-400 text-sm mt-1">Chi tiết phân công và theo dõi tiến độ</p>
          </div>
          <div className="flex space-x-3">
             <div className="text-xs uppercase tracking-wider border border-white/10 bg-black/20 text-blue-300 px-4 py-2 rounded-xl font-bold shadow-sm flex items-center backdrop-blur-md">
                Tuần hiện tại
             </div>
          </div>
        </div>

        <div className="flex bg-black/20 p-1.5 rounded-xl border border-white/10 overflow-x-auto overflow-y-hidden shadow-inner backdrop-blur-md">
          {DAYS.map(day => (
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               key={day}
               onClick={() => setSelectedDay(day)}
               className={cn(
                 "flex-1 py-2.5 text-xs sm:text-sm px-4 whitespace-nowrap transition-all duration-300 rounded-lg outline-none", 
                 day === selectedDay 
                   ? "font-bold bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-500/30 text-blue-300" 
                   : "font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
               )}>
               {day}
             </motion.button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 overflow-auto min-h-0">
         {renderShiftCard(selectedDay, 'Sáng', 'bg-blue-50', 'bg-blue-500', 'text-blue-600', 'bg-blue-100', 'CA SÁNG')}
         {renderShiftCard(selectedDay, 'Chiều', 'bg-orange-50', 'bg-orange-500', 'text-orange-600', 'bg-orange-100', 'CA CHIỀU')}
      </div>
    </>
  );

  const renderPenaltiesTab = () => (
    <>
      <header className="border-b border-white/10 p-6 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 z-10 bg-transparent backdrop-blur-sm sticky top-0">
        <div>
          <h2 className="text-3xl display-font font-bold text-white tracking-tight">Phiếu Xử Phạt</h2>
          <p className="text-slate-400 text-sm mt-1">Lập biên bản xử phạt học sinh vi phạm lao động</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAutoGeneratePenalties}
            className="flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] text-sm font-semibold transition-colors"
          >
            Tự động phạt
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreatePenalty}
            className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.15)] text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Lập phiếu phạt
          </motion.button>
        </div>
      </header>
      
      <div className="flex-1 p-4 sm:p-6 bg-transparent overflow-auto flex flex-col xl:flex-row gap-6">
        {/* List of penalties */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          {penalties.filter(p => (p.week || 1) === currentWeek).length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 italic">
              Chưa có phiếu phạt nào được lập trong tuần này.
            </div>
          ) : (
            <AnimatePresence>
              {penalties.filter(p => (p.week || 1) === currentWeek).map((penalty, idx) => {
                const st = students.find(s => s.id === penalty.studentId);
                const isActive = activePenaltyId === penalty.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={penalty.id} 
                    onClick={() => setActivePenaltyId(penalty.id)}
                    className={cn(
                      "glass-card rounded-2xl p-4 hover:border-red-500/30 shadow-lg cursor-pointer transition-all",
                      isActive ? "border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg">Phiếu #{idx + 1}</span>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeletePenalty(penalty.id)} 
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                    <div className="mb-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Học sinh</p>
                      <GlassSelect
                        value={penalty.studentId}
                        onChange={(val) => handleUpdatePenalty(penalty.id, { studentId: String(val) })}
                        options={[
                          { value: '', label: 'Chọn học sinh...' },
                          ...students.map(s => ({
                            value: s.id,
                            label: s.name,
                            sublabel: `Mã: ${s.code}`,
                            badge: s.team > 0 ? `Tổ ${s.team}` : undefined,
                          }))
                        ]}
                        searchable
                        size="sm"
                        placeholder="Chọn học sinh..."
                      />
                      {penalty.dutyDay && (
                        <div className="text-xs text-blue-300/80 mb-2 p-2 bg-blue-500/10 rounded-lg flex flex-col gap-1">
                           <div><strong>Ca trực vi phạm:</strong> {penalty.dutyShift} - {penalty.dutyDay}</div>
                           {penalty.dutyLocation && <div><strong>Vị trí:</strong> {penalty.dutyLocation}</div>}
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mức phạt</p>
                      <GlassSelect
                        value={penalty.deduction}
                        onChange={(val) => handleUpdatePenalty(penalty.id, { deduction: Number(val) })}
                        options={[
                          { value: 2, label: 'Vi phạm lần 1 (-2 sao)', badge: '-2 điểm', badgeColor: 'bg-red-500/20 text-red-300' },
                          { value: 5, label: 'Tái phạm lần 1 (-5 sao)', badge: '-5 điểm', badgeColor: 'bg-red-500/20 text-red-300' },
                          { value: 10, label: 'Tái phạm lần 2 (-10 sao)', badge: '-10 điểm', badgeColor: 'bg-red-500/20 text-red-300' },
                          { value: 20, label: 'Tối đa / Nghiêm trọng (-20 sao)', badge: '-20 điểm', badgeColor: 'bg-red-500/20 text-red-300' },
                        ]}
                        size="sm"
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => st && exportPenaltyToWord(penalty, st)}
                        disabled={!penalty.studentId}
                        className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors border", penalty.studentId ? "bg-white/10 hover:bg-white/20 border-white/20" : "bg-white/5 border-transparent text-slate-500 cursor-not-allowed")}
                      >
                        <Download size={14} /> Xuất Word
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
        
        {/* Document Preview */}
        {penalties.length > 0 && (() => {
          const activePenalty = penalties.find(p => p.id === activePenaltyId) || penalties[penalties.length - 1];
          const student = students.find(s => s.id === activePenalty.studentId);
          return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex justify-center"
          >
             <div className="bg-white p-8 md:p-12 shadow-2xl rounded-sm max-w-[210mm] w-full min-h-[297mm] font-[Times_New_Roman] text-[13pt] text-black">
                <div className="flex justify-between items-start mb-8">
                   <div className="text-center w-1/2">
                      <p className="font-bold">TRƯỜNG THCS ...</p>
                      <p className="font-bold underline decoration-1 text-sm mt-1">LỚP 8A2</p>
                   </div>
                   <div className="text-center w-1/2">
                      <p className="font-bold">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="font-bold underline decoration-1 text-sm mt-1">Độc lập - Tự do - Hạnh phúc</p>
                   </div>
                </div>

                <div className="text-center mb-10">
                   <h1 className="font-bold text-2xl uppercase mb-1">Phiếu xử phạt</h1>
                   <h2 className="font-bold text-xl uppercase mb-3">Vi phạm nội quy lao động</h2>
                   <p className="italic text-sm">
                      Ngày lập form: &nbsp;
                      <SyncInput 
                        className="border-b border-dashed border-gray-400 outline-none text-center bg-transparent w-32" 
                        value={activePenalty.date}
                        onChangeValue={(val: string) => handleUpdatePenalty(activePenalty.id, { date: val })}
                      />
                   </p>
                </div>

                <div className="space-y-4 text-justify leading-relaxed">
                   <p>Căn cứ vào nội quy lao động và theo dõi trực tuần, Ban cán sự lớp 8A2 tiến hành lập biên bản xử phạt đối với:</p>
                   <div className="flex gap-2">
                     <span className="font-bold whitespace-nowrap">Họ và tên học sinh:</span>
                     <span className="flex-1 font-bold border-b border-dotted border-gray-400 min-h-[24px]">
                       {student?.name || ''} {student?.team ? `(Tổ ${student.team})` : ''}
                     </span>
                   </div>
                   {(activePenalty.dutyDay || activePenalty.dutyShift) && (
                   <div className="flex gap-2">
                     <span className="whitespace-nowrap">Vi phạm ca trực:</span>
                     <span className="flex-1 border-b border-dotted border-gray-400 min-h-[24px]">
                       {[activePenalty.dutyShift ? `Ca ${activePenalty.dutyShift}` : '', activePenalty.dutyDay].filter(Boolean).join(' - ')}
                     </span>
                   </div>
                   )}
                   {activePenalty.dutyLocation && (
                   <div className="flex gap-2">
                     <span className="whitespace-nowrap">Vị trí phân công:</span>
                     <span className="flex-1 border-b border-dotted border-gray-400 min-h-[24px]">
                       {activePenalty.dutyLocation}
                     </span>
                   </div>
                   )}
                   <div className="flex gap-2 items-start">
                     <span className="whitespace-nowrap">Lý do xử phạt:</span>
                     <SyncTextarea 
                       className="flex-1 border-b border-dotted border-gray-400 bg-transparent outline-none resize-none leading-relaxed min-h-[48px]"
                       value={activePenalty.reason}
                       onChangeValue={(val: string) => handleUpdatePenalty(activePenalty.id, { reason: val })}
                     />
                   </div>
                   <div className="flex gap-2">
                     <span className="font-bold whitespace-nowrap">Hình thức xử phạt:</span>
                     <span>Trừ <strong className="text-red-600">{activePenalty.deduction} sao</strong> vào kết quả thi đua cá nhân cuối tuần.</span>
                   </div>
                   <p className="mt-4 indent-8">
                     Học sinh vi phạm cần nghiêm túc kiểm điểm và rút kinh nghiệm, không để tái phạm trong các ca trực tiếp theo. Nếu vẫn tiếp tục vi phạm sẽ bị xử lý theo mức phạt tăng dần.
                   </p>
                </div>

                <div className="flex justify-between items-start mt-16 px-8">
                   <div className="text-center">
                     <p className="font-bold">Học sinh vi phạm</p>
                     <p className="italic text-sm">(Ký, ghi rõ họ tên)</p>
                   </div>
                   <div className="text-center">
                     <p className="font-bold">Người lập phiếu</p>
                     <p className="italic text-sm">(Ký, ghi rõ họ tên)</p>
                   </div>
                </div>
             </div>
          </motion.div>
          );
        })()}
      </div>
    </>
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      ratingsContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const exportRatingsToPng = async () => {
    if (!ratingsGridRef.current) return;
    try {
      // Adding a temporary background and padding to capture correctly
      const originalBg = ratingsGridRef.current.style.backgroundColor;
      ratingsGridRef.current.style.backgroundColor = '#0f172a'; // slate-900
      ratingsGridRef.current.style.padding = '24px';
      
      const dataUrl = await htmlToImage.toPng(ratingsGridRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });
      
      // Restore styles
      ratingsGridRef.current.style.backgroundColor = originalBg;
      ratingsGridRef.current.style.padding = '';

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Xep_Loai_Tuan_${currentWeek}.png`;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh', err);
      alert('Có lỗi xảy ra khi xuất ảnh.');
    }
  };

  const renderRatingsTab = () => {
    return (
      <div ref={ratingsContainerRef} className={cn("flex flex-col h-full", isFullscreen ? "bg-slate-900 overflow-y-auto" : "")}>
        <header className={cn("border-b border-white/10 p-6 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 z-10 sticky top-0", isFullscreen ? "bg-slate-900" : "bg-transparent backdrop-blur-sm")}>
          <div>
            <h2 className="text-3xl display-font font-bold text-white tracking-tight">Xếp Loại Cuối Tuần</h2>
            <p className="text-slate-400 text-sm mt-1">Đánh giá thành viên theo tuần và tổng kết điểm các tổ</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowRatingsPresentation(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/30 border border-white/20 transition-all"
            >
              <Volume2 className="w-4.5 h-4.5 animate-pulse text-amber-300" />
              <span>Trình Chiếu Xếp Loại (Có Giọng Đọc Nữ)</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportRatingsToPng}
              className="flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Xuất Ảnh PNG"
            >
              <ImageIcon className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleFullscreen}
              className="flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </motion.button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 bg-transparent overflow-auto flex flex-col gap-8">
           <div ref={ratingsGridRef} className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto w-full rounded-2xl">
              {[1, 2, 3, 4].map(teamIdNum => {
                 const teamStudents = students.filter(s => s.team === teamIdNum);
                 const summaryId = `w${currentWeek}-t${teamIdNum}`;
                 const summary = teamSummaries.find(t => t.id === summaryId) || { teamId: teamIdNum, week: currentWeek, bonusPoints: 0, penaltyPoints: 0, totalPoints: 0, violations: '' };
                 
                 return (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: teamIdNum * 0.05 }}
                       key={teamIdNum} 
                       className="glass-card rounded-2xl flex flex-col overflow-hidden shadow-lg border border-white/10"
                    >
                       <div className="p-4 border-b border-white/10 bg-blue-500/10 flex justify-between items-center">
                          <h3 className="font-bold text-blue-300 text-lg">Tổ {teamIdNum}</h3>
                       </div>
                       
                       <div className="p-4 flex-1">
                          {teamStudents.length === 0 ? (
                             <p className="text-slate-500 text-sm italic text-center py-4">Tổ chưa có thành viên</p>
                          ) : (
                            <table className="w-full text-sm text-left mb-6">
                              <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                                 <tr>
                                    <th className="py-2">Học sinh</th>
                                    <th className="py-2 w-32 text-center">Xếp loại</th>
                                 </tr>
                              </thead>
                              <tbody>
                                {teamStudents.map(st => {
                                   const ratingId = `w${currentWeek}-s${st.id}`;
                                   const r = weeklyRatings.find(x => x.id === ratingId)?.rating || '';
                                   return (
                                     <tr key={st.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                        <td className="py-2 text-slate-200">{st.name}</td>
                                        <td className="py-2">
                                            <GlassSelect
                                               value={r}
                                               onChange={(val) => handleUpdateWeeklyRating(st.id, val as RatingType)}
                                               options={[
                                                  { value: '', label: '- - -' },
                                                  { value: 'T', label: 'Tốt', badge: 'TỐT', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
                                                  { value: 'K', label: 'Khá', badge: 'KHÁ', badgeColor: 'bg-blue-500/20 text-blue-300' },
                                                  { value: 'TB', label: 'Trung bình', badge: 'TB', badgeColor: 'bg-amber-500/20 text-amber-300' },
                                                  { value: 'Đ', label: 'Đạt', badge: 'ĐẠT', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
                                                  { value: 'CĐ', label: 'Chưa Đạt', badge: 'CĐ', badgeColor: 'bg-red-500/20 text-red-300' },
                                               ]}
                                               size="sm"
                                               placeholder="- - -"
                                            />
                                        </td>
                                     </tr>
                                   )
                                })}
                              </tbody>
                            </table>
                          )}

                          <div className="space-y-4 pt-4 border-t border-white/10 mt-auto">
                              <div className="flex gap-4">
                                 <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Điểm cộng</label>
                                    <SyncInput 
                                       type="number" 
                                       className="w-full glass-input text-sm p-2 rounded-lg" 
                                       value={summary.bonusPoints === 0 ? '' : summary.bonusPoints}
                                       placeholder="0"
                                       onChangeValue={(val: string) => handleUpdateTeamSummary(teamIdNum, { bonusPoints: parseFloat(val) || 0 })}
                                    />
                                 </div>
                                 <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Điểm trừ</label>
                                    <SyncInput 
                                       type="number" 
                                       className="w-full glass-input text-sm p-2 rounded-lg" 
                                       value={summary.penaltyPoints === 0 ? '' : summary.penaltyPoints}
                                       placeholder="0"
                                       onChangeValue={(val: string) => handleUpdateTeamSummary(teamIdNum, { penaltyPoints: parseFloat(val) || 0 })}
                                    />
                                 </div>
                                 <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tổng kết</label>
                                    <SyncInput 
                                       type="number" 
                                       className="w-full glass-input text-sm p-2 rounded-lg font-bold text-blue-300" 
                                       value={summary.totalPoints === 0 ? '' : summary.totalPoints}
                                       placeholder="0"
                                       onChangeValue={(val: string) => handleUpdateTeamSummary(teamIdNum, { totalPoints: parseFloat(val) || 0 })}
                                    />
                                 </div>
                              </div>
                              <div>
                                  <label className="text-[10px] uppercase font-bold text-red-300/80 mb-1 block">Các lỗi vi phạm</label>
                                  <SyncTextarea 
                                     rows={3} 
                                     className="w-full glass-input text-sm p-2 rounded-lg resize-none text-red-200"
                                     placeholder="Nhập các lỗi vi phạm của tổ..."
                                     value={summary.violations}
                                     onChangeValue={(val: string) => handleUpdateTeamSummary(teamIdNum, { violations: val })}
                                  />
                              </div>
                          </div>
                       </div>
                    </motion.div>
                 );
              })}
           </div>
        </div>
      </div>
    );
  };

  const renderConductTab = () => {
    return (
      <div className="flex flex-col h-full">
        <header className="border-b border-white/10 p-6 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 z-10 bg-transparent backdrop-blur-sm sticky top-0">
          <div>
            <h2 className="text-3xl display-font font-bold text-white tracking-tight">Bình Xét Hạnh Kiểm</h2>
            <p className="text-slate-400 text-sm mt-1">Đánh giá hạnh kiểm các học sinh trong lớp</p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => exportConductToExcel(students)}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-semibold flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => exportConductToWord(students)}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl font-semibold flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Word</span>
            </motion.button>
          </div>
        </header>
        
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto bg-black/20 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto min-h-0">
               <table className="w-full text-sm text-left relative min-w-[600px]">
                  <thead className="text-xs uppercase text-slate-300 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                     <tr>
                        <th className="px-4 sm:px-6 py-4 font-bold tracking-wider rounded-tl-xl text-center w-16">STT</th>
                        <th className="px-4 sm:px-6 py-4 font-bold tracking-wider">Lớp</th>
                        <th className="px-4 sm:px-6 py-4 font-bold tracking-wider">Họ và Tên</th>
                        <th className="px-4 sm:px-6 py-4 font-bold tracking-wider text-center">Tổ</th>
                        <th className="px-4 sm:px-6 py-4 font-bold tracking-wider text-center rounded-tr-xl">Hạnh Kiểm</th>
                     </tr>
                  </thead>
                  <tbody>
                     {students.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                             Chưa có học sinh nào trong danh sách.
                          </td>
                        </tr>
                     ) : (
                        students.map((student, index) => (
                          <tr key={student.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                             <td className="px-4 sm:px-6 py-3 font-medium text-slate-400 text-center">{index + 1}</td>
                             <td className="px-4 sm:px-6 py-3 font-mono text-xs tracking-widest text-slate-300">
                               <SyncInput
                                 type="text"
                                 className="w-full glass-input rounded-lg px-2 py-1 font-mono text-xs tracking-widest bg-transparent border-transparent focus:bg-white/5 focus:border-white/20 transition-all font-bold text-center"
                                 value={student.classNameText || ''}
                                 onChangeValue={(val: string) => handleUpdateAllStudentsClass(val)}
                                 placeholder="8A2..."
                               />
                             </td>
                             <td className="px-4 sm:px-6 py-3 font-medium text-slate-100">{student.name}</td>
                             <td className="px-4 sm:px-6 py-3 text-center text-slate-300">
                                {student.team === 0 ? <span className="opacity-50">-</span> : `Tổ ${student.team}`}
                             </td>
                             <td className="px-4 sm:px-6 py-3 text-center">
                                <GlassSelect
                                   value={student.conduct || ''}
                                   onChange={(val) => handleUpdateStudent(student.id, 'conduct', val as ConductType)}
                                   options={[
                                      { value: '', label: 'Đánh giá...' },
                                      { value: 'Tốt', label: 'Tốt', badge: 'TỐT', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
                                      { value: 'Khá', label: 'Khá', badge: 'KHÁ', badgeColor: 'bg-blue-500/20 text-blue-300' },
                                      { value: 'Trung Bình', label: 'Trung Bình', badge: 'TB', badgeColor: 'bg-amber-500/20 text-amber-300' },
                                      { value: 'Yếu', label: 'Yếu', badge: 'YẾU', badgeColor: 'bg-red-500/20 text-red-300' },
                                   ]}
                                   size="sm"
                                   placeholder="Đánh giá..."
                                />
                             </td>
                          </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <>
        <div className="atmosphere" />
        <div className="min-h-screen flex items-center justify-center text-white relative z-10">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, scale: [0.9, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", alternate: true }}>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           </motion.div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className="atmosphere" />
        <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#060c21]/80 backdrop-blur-3xl p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10 max-w-md w-full text-center relative overflow-hidden"
          >
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-blue-500 blur-[50px] opacity-20 -z-10 rounded-full"></div>
              <h1 className="text-5xl display-font font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Quản Lý Lao Động</h1>
              <p className="text-slate-300">Vui lòng đăng nhập để bắt đầu sử dụng và đồng bộ dữ liệu của bạn.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center space-x-3 transition-all shadow-[0_8px_20px_rgba(59,130,246,0.3)] border border-white/10"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-0.5" />
              <span>Đăng nhập qua Google</span>
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="atmosphere" />
      <div className="w-full h-screen flex flex-col md:flex-row overflow-hidden font-sans relative z-10 text-slate-100 p-2 md:p-4 gap-2 md:gap-4">
        {/* Sidebar */}
        <aside className="w-full md:w-72 glass-card rounded-2xl flex flex-col shrink-0 z-20 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 hidden md:block relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] -z-10"></div>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl display-font font-bold tracking-tight text-white">{classConfig.className} Class management</h1>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-300 transition-colors border border-white/10"
                title="Cài Đặt Lớp & Năm Học"
              >
                <Settings className="w-4.5 h-4.5 animate-spin-slow" />
              </button>
            </div>
            <p className="text-xs text-blue-300 mb-3 uppercase font-semibold">Lớp {classConfig.className} • Năm học {classConfig.schoolYear}</p>
            <div className="flex items-center space-x-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Tuần học:</label>
               <GlassSelect
                 value={currentWeek}
                 onChange={(val) => setCurrentWeek(Number(val))}
                 options={Array.from({length: 35}, (_, i) => ({
                   value: i + 1,
                   label: `Tuần ${i + 1}`
                 }))}
                 size="sm"
               />
            </div>
          </div>
          
          {/* Mobile Header Toggle */}
          <div className="p-4 border-b border-white/10 md:hidden flex flex-col gap-2 glass-panel">
             <div className="flex justify-between items-center">
                 <h1 className="text-xl display-font font-bold tracking-tight text-white">{classConfig.className} Class management</h1>
                 <button 
                   onClick={() => setShowSettingsModal(true)}
                   className="p-1.5 rounded-xl bg-white/10 text-blue-300 border border-white/10"
                   title="Cài Đặt Lớp & Năm Học"
                 >
                   <Settings className="w-4 h-4" />
                 </button>
             </div>
             <div className="flex items-center justify-between space-x-2 text-xs text-blue-300 font-semibold">
                 <span>Lớp {classConfig.className} • NH {classConfig.schoolYear}</span>
                 <div className="flex items-center space-x-2">
                   <span className="text-xs font-bold text-slate-400 uppercase">Tuần:</span>
                   <select 
                     className="glass-input text-xs font-bold rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 text-slate-200 outline-none"
                     value={currentWeek}
                     onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                   >
                     {Array.from({length: 35}, (_, i) => i + 1).map(w => (
                       <option key={w} className="bg-slate-800" value={w}>Tuần {w}</option>
                     ))}
                   </select>
                 </div>
             </div>
          </div>

          <nav className="flex-none p-4 flex overflow-x-auto gap-2 md:flex-col md:overflow-visible md:gap-0 md:space-y-2 md:flex-1">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('home')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'home' ? "bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 text-white border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] font-bold" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0 text-blue-400" />
              <span>Trang Chủ</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('tracking')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'tracking' ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <ClipboardList className="w-5 h-5 shrink-0" />
              <span>Bảng Trực Tuần</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('shifts')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'shifts' ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <CalendarDays className="w-5 h-5 shrink-0" />
              <span>Phân Công Ca</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('penalties')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'penalties' ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-400/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Phiếu Xử Phạt</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('ratings')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'ratings' ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <FileText className="w-5 h-5 shrink-0" />
              <span>Xếp Loại Tuần</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('conduct')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'conduct' ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Award className="w-5 h-5 shrink-0" />
              <span>Hạnh Kiểm</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('documents')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'documents' ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span>Nhật Ký & Biên Bản</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('officers')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'officers' ? "bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Crown className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Sơ Đồ Cán Sự</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('class')}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all text-sm shrink-0 shadow-sm border border-transparent whitespace-nowrap",
                activeTab === 'class' ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Danh sách Lớp</span>
            </motion.button>
          </nav>

          <div className="p-4 border-t border-white/10 mt-auto flex flex-col gap-3">
            <div className="bg-black/20 rounded-xl p-3 text-sm backdrop-blur-sm border border-white/5">
              <p className="text-blue-300/80 mb-1 text-[10px] font-bold uppercase tracking-wider">Tài khoản</p>
              <p className="font-bold mb-3 truncate text-white" title={user.email || ''}>{user.displayName || user.email}</p>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </motion.button>
            </div>
            
            <div className="flex flex-col gap-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => exportToExcel(students, shiftAssignments.filter(a => (a.week || 1) === currentWeek), dutyRecords.filter(r => (r.week || 1) === currentWeek), classConfig.className, classConfig.schoolYear, classConfig.schoolName)}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Excel</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => exportToWord(students, shiftAssignments.filter(a => (a.week || 1) === currentWeek), dutyRecords.filter(r => (r.week || 1) === currentWeek), classConfig.className, classConfig.schoolYear, classConfig.schoolName)}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Word</span>
              </motion.button>
            </div>
          </div>
        </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-[calc(100vh-140px)] md:h-screen bg-[#060c21]/60 backdrop-blur-3xl border border-white/10 md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-20 md:ml-4 m-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full"
          >
            {activeTab === 'home' && (
              <HomeTab
                currentWeek={currentWeek}
                students={students}
                shiftAssignments={shiftAssignments}
                dutyRecords={dutyRecords}
                penalties={penalties}
                classConfig={classConfig}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onAutoGeneratePenalties={handleAutoGeneratePenalties}
                onExportExcel={() => exportToExcel(students, shiftAssignments.filter(a => (a.week || 1) === currentWeek), dutyRecords.filter(r => (r.week || 1) === currentWeek), classConfig.className, classConfig.schoolYear, classConfig.schoolName)}
                onExportWord={() => exportToWord(students, shiftAssignments.filter(a => (a.week || 1) === currentWeek), dutyRecords.filter(r => (r.week || 1) === currentWeek), classConfig.className, classConfig.schoolYear, classConfig.schoolName)}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            )}
            {activeTab === 'class' && renderClassTab()}
            {activeTab === 'shifts' && renderShiftsTab()}
            {activeTab === 'tracking' && renderTrackingTab()}
            {activeTab === 'penalties' && renderPenaltiesTab()}
            {activeTab === 'ratings' && renderRatingsTab()}
            {activeTab === 'conduct' && renderConductTab()}
            {activeTab === 'documents' && (
              <DocumentsTab
                documents={classDocuments}
                className={classConfig.className}
                schoolName={classConfig.schoolName}
                onAddDocument={handleAddDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            )}
            {activeTab === 'officers' && (
              <ClassOfficersTab
                students={students}
                officersConfig={officersConfig}
                teamConfigs={teamConfigs}
                className={classConfig.className}
                schoolYear={classConfig.schoolYear}
                onUpdateOfficersConfig={handleUpdateOfficersConfig}
                onUpdateTeamConfig={handleUpdateTeamConfig}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Class Settings & System Info Modal */}
      <ClassSettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          if (!isMandatorySettings) {
            setShowSettingsModal(false);
          }
        }}
        config={classConfig}
        onSave={handleSaveClassConfig}
        students={students}
        shiftAssignments={shiftAssignments}
        penalties={penalties}
        classDocuments={classDocuments}
        user={user}
        onCheckForUpdates={handleManualCheckUpdate}
        isMandatory={isMandatorySettings}
      />

      {/* Weekly Rating Presentation Fullscreen Modal with TTS Voice */}
      <WeeklyRatingPresentation
        isOpen={showRatingsPresentation}
        onClose={() => setShowRatingsPresentation(false)}
        currentWeek={currentWeek}
        classNameText={classConfig.className}
        students={students}
        weeklyRatings={weeklyRatings}
        teamSummaries={teamSummaries}
      />

      {/* System Update Announcement & Progress Modal */}
      <SystemUpdateModal
        isOpen={showUpdateModal}
        onCloseLater={handlePostponeUpdate}
        onUpdateComplete={handleUpdateComplete}
        currentVersion={updateDetails.currentVersion}
        latestVersion={updateDetails.latestVersion}
        changelog={updateDetails.changelog}
      />
    </div>
    </>
  );
}


