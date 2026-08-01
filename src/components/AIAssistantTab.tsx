import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Bot, User, Copy, Check, RefreshCw, 
  Zap, FileText, HeartHandshake, Lightbulb, AlertCircle, 
  Cpu, Radio, ShieldCheck, MessageSquare, Terminal, Flame, Star, Compass, Table,
  UserCheck, MessageCircle, Grid, HelpCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Student, StudentDutyRecord, PenaltyRecord, TeamWeeklySummary,
  ClassOfficersConfig, TeamConfig, WeeklyRating, ClassDocument 
} from '../types';
import { 
  chatWithGroq, buildClassContextPrompt, GroqChatMessage 
} from '../lib/groqService';

interface AIAssistantTabProps {
  currentWeek: number;
  students: Student[];
  dutyRecords: StudentDutyRecord[];
  penalties: PenaltyRecord[];
  teamSummaries: TeamWeeklySummary[];
  officersConfig?: ClassOfficersConfig;
  teamConfigs?: TeamConfig[];
  weeklyRatings?: WeeklyRating[];
  classDocuments?: ClassDocument[];
  className: string;
  schoolYear: string;
  homeroomTeacher?: string;
}

const AVAILABLE_MODELS = [
  { 
    id: 'llama-3.3-70b-versatile', 
    name: 'Llama 3.3 70B', 
    desc: 'Mạnh nhất & Toàn diện', 
    badge: 'Khuyên dùng',
    speed: '< 0.8s',
    param: '70B Params',
    color: 'from-blue-600 via-indigo-600 to-purple-600',
    border: 'border-blue-500/40'
  },
  { 
    id: 'llama-3.1-8b-instant', 
    name: 'Llama 3.1 8B', 
    desc: 'Phản hồi tức thì', 
    badge: 'Siêu Tốc',
    speed: '< 0.3s',
    param: '8B Params',
    color: 'from-emerald-600 via-teal-600 to-cyan-600',
    border: 'border-emerald-500/40'
  },
  { 
    id: 'qwen/qwen3.6-27b', 
    name: 'Qwen 3.6 27B', 
    desc: 'Suy luận Tiếng Việt sâu', 
    badge: 'Deep AI',
    speed: '< 1.1s',
    param: '27B Params',
    color: 'from-amber-600 via-orange-600 to-red-600',
    border: 'border-amber-500/40'
  },
  { 
    id: 'openai/gpt-oss-120b', 
    name: 'GPT-OSS 120B', 
    desc: 'Siêu mô hình trí tuệ lớn', 
    badge: 'Pro 120B',
    speed: '< 1.4s',
    param: '120B Params',
    color: 'from-purple-600 via-pink-600 to-rose-600',
    border: 'border-purple-500/40'
  },
];

// Rich Markdown & Table Renderer Component
const RichMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white bg-blue-500/10 px-1 py-0.5 rounded border border-blue-400/20">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded text-[11px] border border-white/10">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table Block
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const isSeparator = tableLines[1].includes('---');
        const dataRows = tableLines.slice(isSeparator ? 2 : 1).map(row => 
          row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        blocks.push(
          <div key={`table-${i}`} className="my-3 w-full overflow-x-auto rounded-2xl border border-white/15 shadow-xl bg-slate-900/90 sidebar-scroll">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 border-b border-white/15 text-blue-300 font-bold">
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="p-3 whitespace-nowrap font-sans uppercase tracking-wider text-[11px]">
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dataRows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {r.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-slate-200">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={i} className="text-base font-black text-white mt-4 mb-2 flex items-center gap-2 display-font">
          {parseInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={i} className="text-lg font-black text-white mt-5 mb-2 pb-1.5 border-b border-blue-500/30 flex items-center gap-2 display-font bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300">
          {parseInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={i} className="my-2.5 p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border-l-4 border-blue-400 text-slate-200 text-xs shadow-md">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet lists
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      blocks.push(
        <div key={i} className="flex items-start space-x-2 my-1 text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span>{parseInline(line.trim().slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Paragraph
    if (line.trim() === '') {
      blocks.push(<div key={i} className="h-1.5" />);
    } else {
      blocks.push(
        <p key={i} className="my-1 leading-relaxed text-slate-200">
          {parseInline(line)}
        </p>
      );
    }

    i++;
  }

  return <div className="space-y-1 font-sans">{blocks}</div>;
};

export const AIAssistantTab: React.FC<AIAssistantTabProps> = ({
  currentWeek,
  students,
  dutyRecords,
  penalties,
  teamSummaries,
  officersConfig,
  teamConfigs,
  weeklyRatings,
  classDocuments,
  className,
  schoolYear,
  homeroomTeacher,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');
  const [messages, setMessages] = useState<GroqChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State for AI Generator Tools
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [parentMessageType, setParentMessageType] = useState<string>('praise');
  const [seatingStrategy, setSeatingStrategy] = useState<string>('progress_pair');
  const [quizTopicInput, setQuizTopicInput] = useState<string>('An toàn giao thông & Kỷ luật học đường');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students]);

  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    setErrorMsg(null);
    const userMsg: GroqChatMessage = { role: 'user', content: query.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const classContext = buildClassContextPrompt({
        week: currentWeek,
        students,
        dutyRecords,
        penalties,
        teamSummaries,
        officersConfig,
        teamConfigs,
        weeklyRatings,
        classDocuments,
        className,
        schoolYear,
        homeroomTeacher,
      });

      const systemInstruction = `Bạn là Trợ Lý AI Quản Lý Lớp Học Cao Cấp (Class Management AI Assistant Pro) được cấp quyền TRUY CẬP TOÀN BỘ CƠ SỞ DỮ LIỆU LỚP HỌC (Full Database Access) và vận hành bởi mô hình ${activeModelObj.name} trên Groq Cloud LPU.

Quy tắc truy cập dữ liệu & Trình bày:
1. ĐẢM BẢO CHÍNH XÁC DỮ LIỆU 100%:
   - Bạn được kết nối với toàn bộ dữ liệu thực tế: Danh sách học sinh (${students.length} em), Ban cán sự lớp, Ban cán sự các tổ, Toàn bộ lịch sử vi phạm, Điểm thi đua các tổ, Tiến độ trực nhật, Đánh giá xếp loại tuần, Kho tài liệu văn bản.
   - Khi trả lời bất kỳ thông tin nào (Tên học sinh, Lớp trưởng, Tổ trưởng, Chi tiết phiếu phạt, Ca trực nhật, Xếp loại...), BẮT BUỘC TRUY XUẤT CHÍNH XÁC 100% THEO BỘ DỮ LIỆU HỆ THỐNG CUNG CẤP NÀY. KHÔNG ĐƯỢC BỊA ĐẶT HOẶC ĐOÁN TÙY Ý.
2. TRÌNH BÀY BẢNG MARKDOWN & ĐỒ HỌA CHUẨN:
   - Khi tổng hợp, so sánh, báo cáo hay xuất danh sách: BẮT BUỘC TRÌNH BÀY DẠNG BẢNG MARKDOWN (| Cột 1 | Cột 2 | Cột 3 |).
   - Phân bố cục rõ ràng bằng các tiêu đề đẹp (### 📊 Báo cáo, ### 🏆 Tuyên dương, ### ⚠️ Vi phạm, ### 📋 Kế hoạch).
   - In đậm **Tên học sinh**, **Chức vụ**, **Số điểm**, **Tổ**.
3. Khi hỏi về mô hình, trả lời chính xác bạn là **${activeModelObj.name} (${activeModelObj.desc})**.

DỮ LIỆU HỆ THỐNG TOÀN DIỆN THỜI GIAN THỰC LỚP ${className}:
${classContext}`;

      const payloadMessages: GroqChatMessage[] = [
        { role: 'system', content: systemInstruction },
        ...newMessages,
      ];

      const reply = await chatWithGroq(payloadMessages, {
        model: selectedModel,
      });

      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      console.error('Groq AI Chat Error:', err);
      setErrorMsg(err.message || 'Có lỗi xảy ra khi kết nối tới Groq AI Server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePresetPrompt = (type: string) => {
    let prompt = '';
    if (type === 'speech') {
      prompt = `Hãy lập bảng tổng hợp và soạn kịch bản nhận xét bài phát biểu Sinh hoạt lớp tuần ${currentWeek} cho Giáo viên chủ nhiệm lớp ${className}. Trình bày bằng bảng chi tiết ưu nhược điểm các tổ và phương hướng tuần mới.`;
    } else if (type === 'discipline') {
      prompt = `Dựa trên danh sách vi phạm tuần ${currentWeek}, hãy lập bảng phân loại vi phạm và gợi ý các phương pháp giáo dục tích cực cho từng trường hợp.`;
    } else if (type === 'praise') {
      prompt = `Hãy lập bảng danh sách vinh danh các cá nhân và tổ xuất sắc nhất tuần ${currentWeek}, kèm thư khen ngợi truyền cảm hứng.`;
    } else if (type === 'games') {
      prompt = `Gợi ý bảng danh sách 3 trò chơi tập thể ngắn (5-10 phút) thích hợp cho giờ Sinh hoạt lớp cuối tuần (gồm Tên trò chơi, Thời gian, Cách chơi, Ý nghĩa).`;
    }

    if (prompt) {
      handleSendMessage(prompt);
    }
  };

  // AI Tool Handlers
  const handleGenerateStudentReport = () => {
    const targetStudent = students.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;
    const prompt = `Hãy lập BẢNG nhận xét rèn luyện và tiến bộ cá nhân chi tiết cho học sinh **${targetStudent.name}** (Tổ ${targetStudent.team || 'Chưa phân'}). Phân tích kỹ lịch sử vi phạm, trực nhật, hạnh kiểm và đưa ra nhận xét sư phạm truyền cảm hứng kèm lời khuyên quý giá.`;
    handleSendMessage(prompt);
  };

  const handleGenerateParentMessage = () => {
    const targetStudent = students.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;
    let typeDesc = 'khen ngợi thành tích nề nếp xuất sắc trong tuần';
    if (parentMessageType === 'penalty') typeDesc = 'nhắc nhở nhẹ nhàng về tình hình vi phạm nề nếp cần phối hợp chấn chỉnh';
    if (parentMessageType === 'meeting') typeDesc = 'thông báo tình hình rèn luyện và mời tham dự buổi họp phụ huynh';

    const prompt = `Hãy soạn một tin nhắn Zalo/SMS ngắn gọn, văn phong vô cùng lịch sự, khéo léo và giàu tính sư phạm dành gửi cho Phụ huynh học sinh **${targetStudent.name}** (Nội dung: ${typeDesc} Tuần ${currentWeek}). Trình bày có định dạng đẹp kèm các biểu tượng trân trọng.`;
    handleSendMessage(prompt);
  };

  const handleGenerateSeatingPlan = () => {
    let stratDesc = 'Ghép cặp đôi bạn cùng tiến (Học sinh khá giỏi ngồi cùng học sinh cần cố gắng)';
    if (seatingStrategy === 'separate_violators') stratDesc = 'Phân tán các học sinh hay vi phạm/nói chuyện ra các vị trí khác nhau';
    if (seatingStrategy === 'height_vision') stratDesc = 'Ưu tiên học sinh thị lực kém hoặc chiều cao thấp ngồi phía trước';

    const prompt = `Hãy lập BẢNG gợi ý sơ đồ chỗ ngồi thông minh tối ưu cho toàn bộ ${students.length} học sinh Lớp ${className} theo tiêu chí: **${stratDesc}**. Trình bày dưới dạng Bảng phân chia 4 dãy bàn (Dãy 1, Dãy 2, Dãy 3, Dãy 4) kèm giải thích lý do sắp xếp.`;
    handleSendMessage(prompt);
  };

  const handleGenerateQuizGame = () => {
    const topic = quizTopicInput.trim() || 'An toàn giao thông & Văn hóa ứng xử';
    const prompt = `Hãy lập BẢNG bộ 5 câu hỏi đố vui kiến thức ngắn + 1 trò chơi khởi động tập thể (5-10 phút) dành cho giờ Sinh hoạt Lớp ${className} với chủ đề: **${topic}**. Trình bày dưới dạng Bảng gồm: STT, Câu hỏi / Tên trò chơi, Đáp án / Cách chơi, Điểm thưởng.`;
    handleSendMessage(prompt);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* HERO BRAND BAR */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/20 rounded-full blur-[100px] -z-10 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(79,70,229,0.5)] shrink-0 overflow-hidden">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden p-0.5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.3),transparent_70%)] animate-pulse" />
                <img src="/ai-avatar.png" alt="AI Mascot" className="w-full h-full object-contain relative z-10 hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-black display-font text-white tracking-tight">
                  Trợ Lý AI Lớp Học <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">PRO</span>
                </h2>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>GROQ LPU ENGINE</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-2">
                <span>Trí tuệ nhân tạo trình bày tự động dạng Bảng & Đồ họa</span>
                <span className="text-slate-500">•</span>
                <span className="text-blue-300 font-semibold">Tuần {currentWeek}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center space-x-2 backdrop-blur-md">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Tốc độ: <strong className="text-emerald-400">{activeModelObj.speed}</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center space-x-2 backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Tham số: <strong className="text-amber-300">{activeModelObj.param}</strong></span>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 text-xs font-semibold flex items-center space-x-2 transition-all shadow-md active:scale-95"
                title="Làm mới hội thoại"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                <span>Reset Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4.0 INTERACTIVE AI GENERATOR TOOLS HUB */}
      {/* ============================================================ */}
      <div className="glass-card p-5 rounded-3xl border border-blue-500/20 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Zap className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white display-font uppercase tracking-wider">
                Bộ Công Cụ AI 4.0 Chuyên Sâu (AI Smart Tools)
              </h3>
              <p className="text-[11px] text-slate-400">Chọn công cụ bên dưới để AI tự động xuất kết quả dạng Bảng & Tin nhắn khéo léo</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            Tự động hóa 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tool 1: AI Student Report */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-3 hover:border-blue-400/30 transition-all">
            <div className="flex items-center space-x-2 text-blue-300 font-bold text-xs">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>AI Nhận Xét Học Sinh</span>
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white bg-slate-950 border border-white/10 outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} (Tổ {s.team || 'N/A'})
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateStudentReport}
              disabled={isLoading || !selectedStudentId}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <span>Xuất Nhận Xét AI</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tool 2: AI Parent Zalo Message */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-3 hover:border-emerald-400/30 transition-all">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>AI Tin Nhắn Phụ Huynh</span>
            </div>
            <select
              value={parentMessageType}
              onChange={(e) => setParentMessageType(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white bg-slate-950 border border-white/10 outline-none"
            >
              <option value="praise" className="bg-slate-900 text-white">🌟 Khen ngợi nề nếp</option>
              <option value="penalty" className="bg-slate-900 text-white">⚠️ Nhắc nhở vi phạm</option>
              <option value="meeting" className="bg-slate-900 text-white">📅 Mời họp Phụ huynh</option>
            </select>
            <button
              onClick={handleGenerateParentMessage}
              disabled={isLoading || !selectedStudentId}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <span>Tạo Tin Nhắn Zalo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tool 3: AI Seating Chart */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-3 hover:border-amber-400/30 transition-all">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
              <Grid className="w-4 h-4 text-amber-400" />
              <span>AI Sơ Đồ Chỗ Ngồi</span>
            </div>
            <select
              value={seatingStrategy}
              onChange={(e) => setSeatingStrategy(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white bg-slate-950 border border-white/10 outline-none"
            >
              <option value="progress_pair" className="bg-slate-900 text-white">🤝 Đôi bạn cùng tiến</option>
              <option value="separate_violators" className="bg-slate-900 text-white">🚫 Phân tán vi phạm</option>
              <option value="height_vision" className="bg-slate-900 text-white">👁️ Chiều cao & Thị lực</option>
            </select>
            <button
              onClick={handleGenerateSeatingPlan}
              disabled={isLoading}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <span>Gợi Ý Sơ Đồ AI</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tool 4: AI Quiz & Game */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-3 hover:border-purple-400/30 transition-all">
            <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>AI Đố Vui & Trò Chơi</span>
            </div>
            <input
              type="text"
              placeholder="Chủ đề (VD: Tình bạn)..."
              value={quizTopicInput}
              onChange={(e) => setQuizTopicInput(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white bg-slate-950 border border-white/10 outline-none placeholder-slate-500"
            />
            <button
              onClick={handleGenerateQuizGame}
              disabled={isLoading}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1"
            >
              <span>Xuất Đố Vui AI</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODEL SELECTOR & ACTION HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Model Selector Cards */}
        <div className="lg:col-span-5 glass-card p-4 rounded-3xl border border-white/10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Mô Hình AI Đang Dùng</span>
            </label>
            <span className="text-[10px] text-blue-400 font-mono font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              4 Model Sẵn Sàng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_MODELS.map(m => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between border ${
                    isSelected
                      ? `bg-gradient-to-br ${m.color} text-white border-white/30 shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-[1.02]`
                      : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800/80 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs truncate">{m.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isSelected ? 'bg-black/30 text-white border border-white/20' : 'bg-white/10 text-slate-400'
                      }`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                      {m.desc}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono">
                    <span className={isSelected ? 'text-slate-200' : 'text-slate-400'}>{m.param}</span>
                    <span className={isSelected ? 'text-amber-200 font-bold' : 'text-emerald-400'}>{m.speed}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Action Hub */}
        <div className="lg:col-span-7 glass-card p-4 rounded-3xl border border-white/10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gợi Ý Tác Vụ Nhanh (Xuất Bảng & Đồ Họa)</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
              <Table className="w-3 h-3" /> Auto Table
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handlePresetPrompt('speech')}
              className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 hover:from-blue-900/60 hover:to-indigo-900/60 border border-blue-400/25 text-left transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center space-x-2 text-blue-300 font-bold text-xs mb-1">
                <FileText className="w-4 h-4 text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                <span>Kịch bản & Bảng Sinh hoạt</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Tự động xuất bảng nhận xét thi đua các tổ Tuần {currentWeek}</p>
            </button>

            <button
              onClick={() => handlePresetPrompt('discipline')}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 to-orange-950/40 hover:from-amber-900/60 hover:to-orange-900/60 border border-amber-400/25 text-left transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs mb-1">
                <HeartHandshake className="w-4 h-4 text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                <span>Bảng Phân Loại Vi Phạm</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Bảng tổng hợp vi phạm & hướng xử lý sư phạm</p>
            </button>

            <button
              onClick={() => handlePresetPrompt('praise')}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 hover:from-emerald-900/60 hover:to-teal-900/60 border border-emerald-400/25 text-left transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs mb-1">
                <Star className="w-4 h-4 text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                <span>Bảng Vinh Danh Xuất Sắc</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Bảng vinh danh cá nhân & tổ dẫn đầu thi đua</p>
            </button>

            <button
              onClick={() => handlePresetPrompt('games')}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-pink-950/40 hover:from-purple-900/60 hover:to-pink-900/60 border border-purple-400/25 text-left transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs mb-1">
                <Lightbulb className="w-4 h-4 text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                <span>Bảng Trò Chơi Lớp Học</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Bảng danh sách trò chơi sinh hoạt 5-10 phút</p>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-[11px] border border-rose-400/30"
          >
            Đóng
          </button>
        </div>
      )}

      {/* CHAT STREAM CONTAINER */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 min-h-[400px] max-h-[620px] overflow-y-auto space-y-4 flex flex-col border border-white/15 relative bg-slate-950/40 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] sidebar-scroll">
        {messages.length === 0 ? (
          <div className="my-auto text-center p-8 sm:p-12 text-slate-400 space-y-4 relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(59,130,246,0.3)] relative p-1 overflow-hidden">
              <img src="/ai-avatar.png" alt="AI Mascot" className="w-full h-full object-contain drop-shadow-md animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white display-font">Trợ Lý AI Lớp Học Đã Sẵn Sàng</h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                Tự động tổng hợp dữ liệu Lớp {className} Tuần {currentWeek} và xuất kết quả dạng <strong className="text-blue-300">Bảng & Markdown Hiện Đại</strong>.
              </p>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => handleSendMessage(`Lập BẢNG tổng hợp chi tiết nề nếp và vi phạm Lớp ${className} tuần ${currentWeek}`)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all hover:border-blue-400/40 flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5 text-blue-400" />
                <span>Bảng vi phạm Tuần {currentWeek}</span>
              </button>
              <button
                onClick={() => handleSendMessage(`Cho tôi biết thông tin mô hình AI hiện tại đang dùng`)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all hover:border-indigo-400/40"
              >
                🤖 Bạn là mô hình AI nào?
              </button>
              <button
                onClick={() => handleSendMessage(`Lập BẢNG kế hoạch sinh hoạt và phân công nhiệm vụ tuần tới`)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all hover:border-purple-400/40 flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5 text-purple-400" />
                <span>Bảng kế hoạch tuần tới</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(79,70,229,0.5)] shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden p-0.5">
                    <img src="/ai-avatar.png" alt="AI Mascot" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              <div
                className={`rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed border relative group ${
                  msg.role === 'user'
                    ? 'max-w-[85%] sm:max-w-[75%] ms-auto bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 text-white border-blue-400/40 rounded-tr-none shadow-[0_4px_20px_rgba(59,130,246,0.2)]'
                    : 'flex-1 w-full bg-slate-900/90 text-slate-100 border-white/15 rounded-tl-none shadow-2xl backdrop-blur-xl'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-blue-300">{activeModelObj.name}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all font-mono text-[10px] active:scale-95"
                      title="Sao chép phản hồi"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Rich Markdown & Table Renderer */}
                <RichMarkdownRenderer content={msg.content} />
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/20 flex items-center justify-center text-slate-200 shrink-0 shadow-md">
                  <User className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-3 text-blue-400 text-xs">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/ai-avatar.png" alt="AI Loading" className="w-full h-full object-contain animate-bounce" />
            </div>
            <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-3 rounded-2xl border border-white/15 backdrop-blur-xl shadow-lg">
              <Zap className="w-4 h-4 text-amber-300 animate-spin" />
              <span className="font-mono text-slate-200">
                AI <strong className="text-blue-400">{activeModelObj.name}</strong> đang tổng hợp dữ liệu & xuất bảng...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* FUTURISTIC PROMPT INPUT DOCK */}
      <div className="glass-card p-2 sm:p-3 rounded-3xl border border-white/20 flex flex-col gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 px-2 overflow-x-auto sidebar-scroll text-[11px] font-medium text-slate-400">
          <span className="shrink-0 text-slate-500 flex items-center gap-1">
            <Compass className="w-3 h-3 text-blue-400" /> Gợi ý:
          </span>
          <button 
            onClick={() => setInputPrompt(`Xuất BẢNG tổng hợp tình hình trực nhật Tuần ${currentWeek} của các tổ`)}
            className="hover:text-blue-300 whitespace-nowrap bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/5 transition-colors flex items-center gap-1"
          >
            <Table className="w-3 h-3 text-blue-400" /> Bảng trực nhật Tuần {currentWeek}
          </button>
          <button 
            onClick={() => setInputPrompt(`Lập BẢNG xếp hạng thi đua các tổ Tuần ${currentWeek}`)}
            className="hover:text-amber-300 whitespace-nowrap bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/5 transition-colors flex items-center gap-1"
          >
            <Table className="w-3 h-3 text-amber-400" /> Bảng xếp hạng thi đua
          </button>
          <button 
            onClick={() => setInputPrompt(`Lập BẢNG chi tiết vi phạm của các học sinh bị trừ điểm trong Tuần ${currentWeek}`)}
            className="hover:text-rose-300 whitespace-nowrap bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/5 transition-colors flex items-center gap-1"
          >
            <Table className="w-3 h-3 text-rose-400" /> Bảng chi tiết vi phạm
          </button>
        </div>

        {/* Main Input Row */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder={`Hỏi AI về lớp ${className} (VD: Xuất bảng vi phạm tuần ${currentWeek})...`}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 glass-input px-4 py-3.5 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputPrompt.trim()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex items-center space-x-2 shrink-0 active:scale-95"
          >
            <span>Gửi</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
