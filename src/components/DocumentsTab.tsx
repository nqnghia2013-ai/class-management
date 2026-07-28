import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Eye, Upload, FileText, BookOpen, Search, Filter, ZoomIn, Maximize2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { ClassDocument, DocumentType } from '../types';
import { GlassSelect } from './GlassSelect';

const DOCUMENT_TYPES: DocumentType[] = [
  'Biên bản vi phạm',
  'Biên bản họp lớp',
  'Biên bản sinh hoạt',
  'Tài liệu lớp',
  'Khác',
];

const DOC_TYPE_COLORS: Record<DocumentType, { bg: string; text: string; border: string }> = {
  'Biên bản vi phạm': { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/30' },
  'Biên bản họp lớp': { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  'Biên bản sinh hoạt': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  'Tài liệu lớp': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'Khác': { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
};

interface DocumentsTabProps {
  documents: ClassDocument[];
  className?: string;
  schoolName?: string;
  onAddDocument: (doc: ClassDocument) => void;
  onDeleteDocument: (id: string) => void;
}

// Compress image to max width while maintaining aspect ratio
function compressImage(file: File, maxWidth: number = 800, quality: number = 0.55): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentsTab({
  documents,
  className = '8A2',
  schoolName = '',
  onAddDocument,
  onDeleteDocument
}: DocumentsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<ClassDocument | null>(null);
  const [viewerPage, setViewerPage] = useState(0);
  const [filterType, setFilterType] = useState<DocumentType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Add/Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<DocumentType>('Biên bản họp lớp');
  const [formStudentName, setFormStudentName] = useState('');
  const [formClassName, setFormClassName] = useState(className);
  const [formSchoolName, setFormSchoolName] = useState(schoolName);
  const [formDescription, setFormDescription] = useState('');
  const [formPages, setFormPages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormTitle('');
    setFormType('Biên bản họp lớp');
    setFormStudentName('');
    setFormClassName(className);
    setFormSchoolName(schoolName);
    setFormDescription('');
    setFormPages([]);
    setUploadProgressText('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileList: File[] = Array.from(files);
    const compressedResults: string[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        setUploadProgressText(`Đang xử lý ảnh ${i + 1}/${fileList.length}...`);
        const compressed = await compressImage(fileList[i]);
        compressedResults.push(compressed);
      }
      setFormPages(prev => [...prev, ...compressedResults]);
    } catch (err) {
      console.error('Error compressing images:', err);
      alert('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleRemovePage = (index: number) => {
    setFormPages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDocument = () => {
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tên văn bản.');
      return;
    }
    if (formPages.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 trang ảnh.');
      return;
    }

    const newDoc: ClassDocument = {
      id: crypto.randomUUID(),
      title: formTitle.trim(),
      documentType: formType,
      studentName: formStudentName.trim(),
      className: formClassName.trim(),
      schoolName: formSchoolName.trim(),
      description: formDescription.trim(),
      pages: formPages,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    onAddDocument(newDoc);
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteConfirm = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa văn bản "${title}"?`)) {
      onDeleteDocument(id);
    }
  };

  // Filter & search
  const filteredDocs = documents
    .filter(d => !filterType || d.documentType === filterType)
    .filter(d => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.studentName.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Sort newest first by parsing createdAt
      return b.createdAt.localeCompare(a.createdAt);
    });

  return (
    <>
      {/* HEADER */}
      <header className="border-b border-white/10 p-6 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-transparent backdrop-blur-sm z-20 sticky top-0">
        <div>
          <h2 className="text-3xl display-font font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            Nhật Ký & Biên Bản
          </h2>
          <p className="text-slate-400 text-sm mt-1">Quản lý biên bản họp lớp, biên bản vi phạm và các tài liệu lớp học</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(99,102,241,0.3)] border border-white/10 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm Văn Bản Mới
        </motion.button>
      </header>

      {/* FILTER BAR */}
      <div className="px-6 py-3 flex flex-wrap gap-3 items-center border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm văn bản..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <GlassSelect
            value={filterType}
            onChange={(val) => setFilterType(val as DocumentType | '')}
            options={[
              { value: '', label: 'Tất cả loại' },
              ...DOCUMENT_TYPES.map(t => ({ value: t, label: t }))
            ]}
            className="w-44"
            size="sm"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredDocs.length} văn bản
        </span>
      </div>

      {/* DOCUMENTS LIST */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 pb-12">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-indigo-400/60" />
            </div>
            <p className="text-slate-400 text-base font-medium">Chưa có văn bản nào</p>
            <p className="text-slate-500 text-sm mt-1 max-w-xs">Bấm "Thêm Văn Bản Mới" để tải lên biên bản, tài liệu họp lớp hoặc biên bản vi phạm.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredDocs.map((doc) => {
                const typeColor = DOC_TYPE_COLORS[doc.documentType] || DOC_TYPE_COLORS['Khác'];
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card rounded-2xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 bg-black/30 overflow-hidden">
                      {doc.pages.length > 0 ? (
                        <img
                          src={doc.pages[0]}
                          alt={doc.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                      {/* Page count badge */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {doc.pages.length} trang
                      </div>
                      {/* Type badge */}
                      <div className={cn(
                        "absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur-sm",
                        typeColor.bg, typeColor.text, typeColor.border
                      )}>
                        {doc.documentType}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2.5">
                      <h3 className="font-bold text-white text-sm truncate" title={doc.title}>
                        {doc.title}
                      </h3>

                      {doc.studentName && (
                        <p className="text-xs text-slate-400">
                          <span className="text-slate-500">Họ tên:</span>{' '}
                          <span className="text-slate-200 font-medium">{doc.studentName}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {doc.className && <span>Lớp: <span className="text-slate-300">{doc.className}</span></span>}
                        {doc.schoolName && <span>• Trường: <span className="text-slate-300">{doc.schoolName}</span></span>}
                      </div>

                      {doc.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{doc.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-mono">{doc.createdAt}</span>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setViewingDoc(doc); setViewerPage(0); }}
                            className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteConfirm(doc.id, doc.title)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors"
                            title="Xóa văn bản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========== ADD DOCUMENT MODAL ========== */}
      {createPortal(
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d1528] border border-white/10 rounded-3xl shadow-2xl"
              >
                {/* Modal Header */}
                <div className="sticky top-0 z-10 bg-[#0d1528]/95 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white display-font flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    Thêm Văn Bản Mới
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  {/* Document Type */}
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Loại văn bản *</label>
                    <GlassSelect
                      value={formType}
                      onChange={(val) => setFormType(val as DocumentType)}
                      options={DOCUMENT_TYPES.map(t => ({ value: t, label: t }))}
                      size="md"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Tên văn bản *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="VD: Biên bản vi phạm Nguyễn Văn A, Biên bản họp lớp tuần 5..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Row: Student Name + Class + School */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Họ tên</label>
                      <input
                        type="text"
                        value={formStudentName}
                        onChange={(e) => setFormStudentName(e.target.value)}
                        placeholder="Họ và tên..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Lớp</label>
                      <input
                        type="text"
                        value={formClassName}
                        onChange={(e) => setFormClassName(e.target.value)}
                        placeholder="8A2"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Trường</label>
                      <input
                        type="text"
                        value={formSchoolName}
                        onChange={(e) => setFormSchoolName(e.target.value)}
                        placeholder="Tên trường..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">Ghi chú / Nội dung</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Tóm tắt nội dung văn bản..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  {/* Image Upload Area */}
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-400 mb-1.5 block tracking-wider">
                      Tải ảnh các trang văn bản * <span className="normal-case text-slate-500">(Chụp ảnh hoặc chọn từ thiết bị)</span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    {/* Upload button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={cn(
                        "w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                        isUploading
                          ? "border-indigo-500/30 bg-indigo-500/5"
                          : "border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                      )}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-indigo-300 font-medium">{uploadProgressText || 'Đang xử lý ảnh...'}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400" />
                          <p className="text-sm text-slate-300 font-medium">Bấm để chọn ảnh hoặc chụp ảnh</p>
                          <p className="text-[11px] text-slate-500">Có thể chọn nhiều ảnh cùng lúc (mỗi ảnh = 1 trang)</p>
                        </>
                      )}
                    </motion.button>

                    {/* Pages Preview Grid */}
                    {formPages.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-slate-400 font-medium">
                          Đã tải: <span className="text-indigo-300 font-bold">{formPages.length} trang</span>
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {formPages.map((page, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4]">
                              <img
                                src={page}
                                alt={`Trang ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemovePage(idx)}
                                  className="p-2 rounded-full bg-red-500/80 text-white"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Trang {idx + 1}
                              </span>
                            </div>
                          ))}

                          {/* Add more pages button */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/10 hover:border-indigo-500/30 rounded-xl aspect-[3/4] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-indigo-500/5"
                          >
                            <Plus className="w-6 h-6 text-slate-500" />
                            <span className="text-[10px] text-slate-500 font-medium">Thêm trang</span>
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-[#0d1528]/95 backdrop-blur-md p-6 border-t border-white/10 flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveDocument}
                    disabled={isUploading}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_4px_14px_rgba(99,102,241,0.3)] border border-white/10 transition-all disabled:opacity-50"
                  >
                    Lưu Văn Bản
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ========== DOCUMENT VIEWER MODAL (FULL APP OVERLAY) ========== */}
      {createPortal(
        <AnimatePresence>
          {viewingDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex flex-col p-3 sm:p-6 overflow-hidden"
              onClick={() => setViewingDoc(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col h-full w-full max-w-7xl mx-auto glass-card border border-white/15 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-[#080d1c]"
              >
                {/* Viewer Header */}
                <div className="shrink-0 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-[#0d1528]/95 backdrop-blur-md">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white truncate display-font">{viewingDoc.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] font-bold border",
                        DOC_TYPE_COLORS[viewingDoc.documentType]?.bg,
                        DOC_TYPE_COLORS[viewingDoc.documentType]?.text,
                        DOC_TYPE_COLORS[viewingDoc.documentType]?.border
                      )}>
                        {viewingDoc.documentType}
                      </span>
                      {viewingDoc.studentName && <span>Họ tên: <span className="text-white font-semibold">{viewingDoc.studentName}</span></span>}
                      {viewingDoc.className && <span>Lớp: <span className="text-white font-semibold">{viewingDoc.className}</span></span>}
                      {viewingDoc.schoolName && <span>Trường: <span className="text-white font-semibold">{viewingDoc.schoolName}</span></span>}
                      <span>Ngày: <span className="text-white font-semibold">{viewingDoc.createdAt}</span></span>
                    </div>
                    {viewingDoc.description && (
                      <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">{viewingDoc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Page indicator */}
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl shadow-sm">
                      Trang {viewerPage + 1} / {viewingDoc.pages.length}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setViewingDoc(null)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors border border-white/10"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Viewer Body - Image */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4 bg-black/40">
                  {/* Previous Button */}
                  {viewerPage > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.1, x: -3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setViewerPage(p => p - 1); }}
                      className="absolute left-6 z-20 p-3.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition-all shadow-xl backdrop-blur-md"
                    >
                      <ChevronLeft className="w-7 h-7" />
                    </motion.button>
                  )}

                  {/* Image */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={viewerPage}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      src={viewingDoc.pages[viewerPage]}
                      alt={`${viewingDoc.title} - Trang ${viewerPage + 1}`}
                      className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl cursor-pointer border border-white/5"
                      onClick={(e) => { e.stopPropagation(); setFullscreenImage(viewingDoc.pages[viewerPage]); }}
                    />
                  </AnimatePresence>

                  {/* Next Button */}
                  {viewerPage < viewingDoc.pages.length - 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1, x: 3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setViewerPage(p => p + 1); }}
                      className="absolute right-6 z-20 p-3.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition-all shadow-xl backdrop-blur-md"
                    >
                      <ChevronRight className="w-7 h-7" />
                    </motion.button>
                  )}

                  {/* Zoom hint */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white/80 text-xs px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-400" /> Bấm vào ảnh để phóng to toàn màn hình
                  </div>
                </div>

                {/* Viewer Footer - Page Thumbnails */}
                {viewingDoc.pages.length > 1 && (
                  <div className="shrink-0 p-3.5 border-t border-white/10 bg-[#0d1528]/95 backdrop-blur-md">
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 justify-center">
                      {viewingDoc.pages.map((page, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); setViewerPage(idx); }}
                          className={cn(
                            "w-16 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 relative",
                            idx === viewerPage
                              ? "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105"
                              : "border-white/10 opacity-50 hover:opacity-100"
                          )}
                        >
                          <img
                            src={page}
                            alt={`Trang ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-center text-white py-0.5">
                            {idx + 1}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ========== FULLSCREEN IMAGE OVERLAY ========== */}
      {createPortal(
        <AnimatePresence>
          {fullscreenImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center cursor-pointer p-4 backdrop-blur-md"
              onClick={() => setFullscreenImage(null)}
            >
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                src={fullscreenImage}
                alt="Fullscreen"
                className="max-h-[96vh] max-w-[96vw] object-contain rounded-xl shadow-2xl"
              />
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFullscreenImage(null)}
                  className="p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors border border-white/20 shadow-xl"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
