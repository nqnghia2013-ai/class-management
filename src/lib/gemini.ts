import { GoogleGenAI } from '@google/genai';
import { Student, StudentDutyRecord, PenaltyRecord, TeamWeeklySummary } from '../types';

const getApiKey = (): string => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_GEMINI_API_KEY) {
    return metaEnv.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process?.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return '';
};

export async function generateClassInsights(
  week: number,
  students: Student[],
  dutyRecords: StudentDutyRecord[],
  penalties: PenaltyRecord[],
  teamSummaries: TeamWeeklySummary[],
  customPrompt?: string,
  className: string = '8A2',
  schoolYear: string = '2026 - 2027'
): Promise<string> {
  const apiKey = getApiKey();
  
  const weekDuties = dutyRecords.filter(r => (r.week || 1) === week);
  const completedDuties = weekDuties.filter(r => r.status === 'Đã hoàn thành').length;
  const uncompletedDuties = weekDuties.filter(r => r.status === 'Chưa hoàn thành').length;
  const totalDuties = weekDuties.length;
  const completionRate = totalDuties > 0 ? Math.round((completedDuties / totalDuties) * 100) : 100;

  const weekPenalties = penalties.filter(p => (p.week || 1) === week);
  const penalizedStudents = weekPenalties.map(p => {
    const st = students.find(s => s.id === p.studentId);
    return `${st?.name || 'Học sinh'} (Lý do: ${p.reason}, Trừ: -${p.deduction}đ)`;
  });

  const weekTeamSummaries = teamSummaries.filter(t => (t.week || 1) === week);
  const teamScoreText = weekTeamSummaries.map(t => `Tổ ${t.teamId}: Trừ ${t.penaltyPoints}đ, Cộng ${t.bonusPoints}đ -> Tổng ${t.totalPoints || 100}đ`).join(' | ');

  const contextData = `
Báo cáo thi đua & nề nếp Lớp ${className} (Năm học ${schoolYear}) - Tuần ${week}:
- Sĩ số lớp: ${students.length} học sinh
- Tình hình trực nhật: Thống kê ${completedDuties}/${totalDuties} ca hoàn thành (${completionRate}%). Số ca vi phạm: ${uncompletedDuties}.
- Danh sách vi phạm kỷ luật/trực nhật (${weekPenalties.length} lượt): ${penalizedStudents.length > 0 ? penalizedStudents.join('; ') : 'Không có vi phạm nào!'}
- Tình hình điểm thi đua các tổ: ${teamScoreText || 'Chưa cập nhật đầy đủ.'}
  `;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Bạn là Trợ Lý Giáo Viên Chủ Nhiệm Thông Minh cho lớp ${className}. Hãy đưa ra nhận xét ngắn gọn, sắc bén, chuyên nghiệp và có tính sư phạm cao. Sử dụng ngôn ngữ tiếng Việt chu đáo, truyền cảm hứng nhưng nghiêm túc. Đưa ra 3 phần: 
1. Đánh giá chung tuần ${week} (Điểm sáng & Hạn chế)
2. Tuyên dương & Nhắc nhở cụ thể
3. Kế hoạch / Lời khuyên cho tuần tiếp theo.`;

      const promptText = customPrompt 
        ? `${contextData}\n\nCâu hỏi/Yêu cầu từ Giáo viên: ${customPrompt}`
        : `${contextData}\n\nHãy tổng hợp báo cáo đánh giá tuần ${week} cho giáo viên chủ nhiệm.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      if (response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn('Gemini API call failed, generating dynamic fallback report:', error);
    }
  }

  // Smart structured fallback report if API Key is not set or network fails
  return `### 📊 Báo Cáo Nhận Xét Thi Đua & Nề Nếp Lớp ${className} (Năm học ${schoolYear}) - Tuần ${week}

#### 1. Đánh giá tổng quan:
* **Tỉ lệ hoàn thành trực nhật**: **${completionRate}%** (${completedDuties}/${totalDuties} ca trực đạt yêu cầu).
* **Tình hình vi phạm kỷ luật**: Ghi nhận **${weekPenalties.length} lượt vi phạm** trong tuần.
* **Tinh thần tập thể**: ${completionRate >= 80 ? 'Nề nếp lao động tương đối ổn định, các tổ có sự chủ động tốt.' : 'Cần chấn chỉnh ngay công tác trực nhật ở các ca chiều và khu vực sân trường.'}

#### 2. Tuyên dương & Nhắc nhở:
* 🌟 **Tuyên dương**: ${completionRate > 90 ? 'Tập thể lớp và các Tổ trưởng đã duy trì xuất sắc kỷ luật vệ sinh.' : 'Các bạn hoàn thành đúng giờ ca trực được phân công.'}
* ⚠️ **Cần chấn chỉnh**: ${weekPenalties.length > 0 ? `Các học sinh bị lập phiếu phạt (${weekPenalties.length} lượt) cần nghiêm túc khắc phục và trực bù.` : 'Duy trì không để phát sinh vi phạm mới.'}

#### 3. Đề xuất hành động cho Giáo viên chủ nhiệm:
1. Yêu cầu các Tổ trưởng họp kiểm điểm các ca trực chưa xong.
2. Động viên các bạn có thái độ lao động tốt trong buổi sinh hoạt lớp cuối tuần.
3. Tiếp tục duy trì theo dõi và chấm điểm nề nếp hàng ngày.`;
}
