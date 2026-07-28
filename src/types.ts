export type LocationType = 'Sân' | 'Trên lớp' | 'Nhà xe' | 'Bồn cây' | 'Cổng trường' | 'Thùng rác chung' | 'Thùng rác tầng 1' | '';
export type StatusType = 'Đã hoàn thành' | 'Chưa hoàn thành' | '';
export type ShiftType = 'Sáng' | 'Chiều';
export type DayType = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';
export type ConductType = 'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu' | '';

export interface Student {
  id: string;
  code: string;
  name: string;
  team: number; // 0 = Chưa có tổ, 1..4 = Tổ 1..4
  userId?: string;
  orderIndex?: number;
  conduct?: ConductType;
  classNameText?: string;
}

export interface ShiftAssignment {
  id: string; // `w${week}-${day}-${shift}`
  day: DayType;
  shift: ShiftType;
  team: number; // 0 = Chưa phân công
  week?: number;
  userId?: string;
}

export interface StudentDutyRecord {
  id: string; // `w${week}-${day}-${shift}-${studentId}`
  day: DayType;
  shift: ShiftType;
  studentId: string;
  location: LocationType;
  status: StatusType;
  week?: number;
  userId?: string;
}

export interface PenaltyRecord {
  id: string;
  date: string;
  studentId: string;
  reason: string;
  deduction: number;
  week?: number;
  userId?: string;
  dutyDay?: DayType | string;
  dutyShift?: ShiftType | string;
  dutyLocation?: LocationType | string;
}

export interface TeamConfig {
  id: string; // '1', '2', '3', '4'
  leader: string;
  deputy: string;
}

export type RatingType = 'T' | 'K' | 'TB' | 'Đ' | 'CĐ' | '';

export interface WeeklyRating {
  id: string; // `w${week}-s${studentId}`
  week: number;
  studentId: string;
  rating: RatingType;
  userId?: string;
}

export interface TeamWeeklySummary {
  id: string; // `w${week}-t${teamId}`
  week: number;
  teamId: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  violations: string;
  userId?: string;
}

export type TabType = 'home' | 'class' | 'shifts' | 'tracking' | 'penalties' | 'ratings' | 'conduct' | 'documents' | 'officers';

export interface ClassOfficersConfig {
  id: string; // 'main'
  classLeader: string;              // Lớp trưởng
  classLeaderMember: string;        // Ủy viên Lớp trưởng
  academicDeputy: string;           // Lớp phó Học tập
  academicDeputyMember: string;     // Ủy viên Lớp phó Học tập
  laborDeputy: string;              // Lớp phó Lao động
  laborDeputyMember: string;        // Ủy viên Lớp phó Lao động
  artsSportsDeputy?: string;         // Lớp phó Văn thể mỹ
  artsSportsDeputyMember?: string;   // Ủy viên Lớp phó Văn thể mỹ
  userId?: string;
}

export type DocumentType = 'Biên bản vi phạm' | 'Biên bản họp lớp' | 'Biên bản sinh hoạt' | 'Tài liệu lớp' | 'Khác';

export interface ClassDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  studentName: string;
  className: string;
  schoolName: string;
  description: string;
  pages: string[];         // base64 data URLs (compressed images)
  createdAt: string;
  userId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  isPinned: boolean;
  priority: 'high' | 'normal' | 'low';
  userId?: string;
}

export interface ClassConfig {
  grade: string;       // '6' | '7' | '8' | '9'
  section: string;     // 'A1' | 'A2' | 'A3' | 'A4' | 'A5'
  className: string;   // e.g. '8A2'
  schoolYear: string;  // e.g. '2026 - 2027'
  schoolName: string;  // e.g. 'TRƯỜNG THCS ...'
}



