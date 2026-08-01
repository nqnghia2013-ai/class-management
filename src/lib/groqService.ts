import { 
  Student, StudentDutyRecord, PenaltyRecord, TeamWeeklySummary, 
  ClassOfficersConfig, TeamConfig, WeeklyRating, ClassDocument 
} from '../types';

export interface GroqChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SystemFullContextParams {
  week: number;
  students: Student[];
  dutyRecords: StudentDutyRecord[];
  penalties: PenaltyRecord[];
  teamSummaries: TeamWeeklySummary[];
  officersConfig?: ClassOfficersConfig;
  teamConfigs?: TeamConfig[];
  weeklyRatings?: WeeklyRating[];
  classDocuments?: ClassDocument[];
  className?: string;
  schoolYear?: string;
  homeroomTeacher?: string;
}

const DEFAULT_GROQ_API_KEY = '';
const STORAGE_KEY = 'groq_api_key';

export const getGroqApiKey = (): string => {
  // 1. Check LocalStorage
  const savedKey = localStorage.getItem(STORAGE_KEY);
  if (savedKey && savedKey.trim().length > 0) {
    return savedKey.trim();
  }

  // 2. Check Vite env variable
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_GROQ_API_KEY) {
    return metaEnv.VITE_GROQ_API_KEY.trim();
  }

  // 3. Default embedded API key
  return DEFAULT_GROQ_API_KEY;
};

export const setGroqApiKey = (key: string): void => {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export async function chatWithGroq(
  messages: GroqChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    apiKey?: string;
  }
): Promise<string> {
  const apiKey = options?.apiKey || getGroqApiKey();

  if (!apiKey) {
    throw new Error('Chưa cấu hình Groq API Key.');
  }

  const model = options?.model || 'llama-3.3-70b-versatile';
  const temperature = options?.temperature ?? 0.7;
  const max_tokens = options?.max_tokens ?? 3072;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `Lỗi HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Groq API Error: ${msg}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Không nhận được phản hồi từ AI.';
    return reply;
  } catch (error: any) {
    console.error('Groq AI Request Error:', error);
    throw error;
  }
}

export function buildClassContextPrompt(params: SystemFullContextParams): string {
  const {
    week,
    students = [],
    dutyRecords = [],
    penalties = [],
    teamSummaries = [],
    officersConfig,
    teamConfigs = [],
    weeklyRatings = [],
    classDocuments = [],
    className = '8A2',
    schoolYear = '2026 - 2027',
    homeroomTeacher = 'Chưa cập nhật'
  } = params;

  // 1. Class Roster & Roles
  const rosterStr = students.map((s, idx) => {
    return `${idx + 1}. [${s.code || 'Mã N/A'}] ${s.name} - Tổ ${s.team || 'Chưa phân'} ${s.conduct ? `(Hạnh kiểm: ${s.conduct})` : ''}`;
  }).join('\n');

  // 2. Officers Configuration
  const officersStr = `
- Giáo viên chủ nhiệm: ${homeroomTeacher}
- Lớp trưởng: ${officersConfig?.classLeader || 'Chưa phân công'} (Ủy viên: ${officersConfig?.classLeaderMember || 'N/A'})
- Lớp phó Học tập: ${officersConfig?.academicDeputy || 'Chưa phân công'} (Ủy viên: ${officersConfig?.academicDeputyMember || 'N/A'})
- Lớp phó Lao động: ${officersConfig?.laborDeputy || 'Chưa phân công'} (Ủy viên: ${officersConfig?.laborDeputyMember || 'N/A'})
${teamConfigs.map(t => `- Ban Cán sự Tổ ${t.id}: Tổ trưởng "${t.leader || 'Chưa có'}", Tổ phó "${t.deputy || 'Chưa có'}"`).join('\n')}
`;

  // 3. Duty Records (Current Week & Stats)
  const currentWeekDuties = dutyRecords.filter(r => (r.week || 1) === week);
  const completedCount = currentWeekDuties.filter(r => r.status === 'Đã hoàn thành').length;
  const uncompletedCount = currentWeekDuties.filter(r => r.status === 'Chưa hoàn thành').length;
  const totalCount = currentWeekDuties.length;
  const dutyRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  const currentWeekDutyDetails = currentWeekDuties.map(r => {
    const st = students.find(s => s.id === r.studentId);
    return `${r.day} (${r.shift}) - ${st?.name || 'Học sinh'} [Tổ ${st?.team || '-'}] - Vị trí: ${r.location} - Trạng thái: ${r.status || 'Đang phân công'}`;
  }).join('\n');

  // 4. Penalties Records (Current Week & Full Log)
  const currentWeekPenalties = penalties.filter(p => (p.week || 1) === p.week);
  const currentWeekPenaltiesList = penalties.filter(p => (p.week || 1) === week).map(p => {
    const st = students.find(s => s.id === p.studentId);
    return `• ${st?.name || 'Học sinh'} (Tổ ${st?.team || '-'}): ${p.reason} [Trừ -${p.deduction}đ] - Ngày: ${p.date} (Tuần ${p.week})`;
  }).join('\n');

  const allPenaltiesList = penalties.map(p => {
    const st = students.find(s => s.id === p.studentId);
    return `• Tuần ${p.week || 1} | ${st?.name || 'Học sinh'} (Tổ ${st?.team || '-'}): ${p.reason} [-${p.deduction}đ] - Ngày: ${p.date}`;
  }).join('\n');

  // 5. Team Weekly Summaries
  const currentWeekTeamSummaries = teamSummaries.filter(t => (t.week || 1) === week);
  const teamSummariesStr = currentWeekTeamSummaries.map(t => 
    `Tổ ${t.teamId}: Tổng ${t.totalPoints || 100} điểm (Cộng +${t.bonusPoints}đ, Trừ -${t.penaltyPoints}đ) -> Xếp hạng #${t.rank || '-'}. Ghi chú vi phạm: ${t.violations || 'Không'}`
  ).join('\n');

  const allTeamSummariesStr = teamSummaries.map(t =>
    `Tuần ${t.week}: Tổ ${t.teamId} -> ${t.totalPoints || 100}đ (Hạng #${t.rank || '-'})`
  ).join('\n');

  // 6. Weekly Ratings
  const currentWeekRatings = weeklyRatings.filter(r => r.week === week).map(r => {
    const st = students.find(s => s.id === r.studentId);
    return `${st?.name || 'Học sinh'}: Loại ${r.rating}`;
  }).join(', ');

  // 7. Documents List
  const docsStr = classDocuments.map(d => `• [${d.documentType}] ${d.title} (Học sinh: ${d.studentName || 'Chung'}, Ngày tạo: ${d.createdAt || 'N/A'})`).join('\n');

  return `
================================================================================
BỘ DỮ LIỆU TOÀN DIỆN VỀ LỚP HỌC HỆ THỐNG - CHÍNH XÁC 100% (REAL-TIME)
================================================================================
📍 THÔNG TIN CHUNG:
- Lớp: ${className} | Năm học: ${schoolYear} | Tuần hiện tại: ${week}
- Tổng sĩ số: ${students.length} học sinh

👮 BAN CÁN SỰ LỚP & TỔ:
${officersStr}

📋 DANH SÁCH SĨ SỐ TOÀN BỘ HỌC SINH LỚP (${students.length} HỌC SINH):
${rosterStr || 'Chưa có danh sách học sinh.'}

🏆 THI ĐỦA VÀ ĐIỂM SỐ CÁC TỔ (TUẦN ${week}):
${teamSummariesStr || 'Chưa có bản tổng kết thi đua tuần này.'}

📊 LỊCH SỬ THI ĐỦA TẤT CẢ CÁC TUẦN:
${allTeamSummariesStr || 'Chưa có lịch sử.'}

⚠️ DANH SÁCH VI PHẠM & TRỪ ĐIỂM TUẦN ${week} (${currentWeekPenaltiesList ? currentWeekPenaltiesList.split('\n').length : 0} LƯỢT):
${currentWeekPenaltiesList || 'Không có vi phạm nào trong tuần này!'}

📜 TOÀN BỘ LỊCH SỬ VI PHẠM LỚP (TẤT CẢ CÁC TUẦN - ${penalties.length} LƯỢT):
${allPenaltiesList || 'Chưa có ghi nhận vi phạm nào.'}

🧹 TÌNH HÌNH TRỰC NHẬT TUẦN ${week}:
- Tiến độ: ${completedCount}/${totalCount} ca hoàn thành (${dutyRate}%). Số ca trễ/bỏ: ${uncompletedCount}.
Chi tiết ca trực:
${currentWeekDutyDetails || 'Chưa phân công ca trực.'}

⭐ ĐÁNH GIÁ XẾP LOẠI TUẦN ${week}:
${currentWeekRatings || 'Chưa đánh giá xếp loại tuần này.'}

📁 KHO VĂN BẢN & TÀI LIỆU LỚP (${classDocuments.length} TÀI LIỆU):
${docsStr || 'Chưa có tài liệu.'}
================================================================================
`;
}
