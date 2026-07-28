import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TextRun,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  Tab,
} from 'docx';
import { saveAs } from 'file-saver';
import { Student, StudentDutyRecord, ShiftAssignment, DayType, ShiftType, PenaltyRecord, LocationType } from '../types';

export const DAYS: DayType[] = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
export const SHIFTS: ShiftType[] = ['Sáng', 'Chiều'];
export const LOCATIONS: LocationType[] = ['Sân', 'Trên lớp', 'Nhà xe', 'Bồn cây', 'Cổng trường', 'Thùng rác chung', 'Thùng rác tầng 1'];


export const exportToExcel = async (
  students: Student[],
  shiftAssignments: ShiftAssignment[],
  dutyRecords: StudentDutyRecord[],
  className: string = '8A2',
  schoolYear: string = '2026 - 2027',
  schoolName: string = 'TRƯỜNG THCS ...'
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('TrucTuan', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // Headers
  ws.mergeCells('A1:B1');
  const d1 = ws.getCell('A1');
  d1.value = schoolName || 'TRƯỜNG THCS ...';
  d1.font = { name: 'Times New Roman', size: 12, bold: true };
  d1.alignment = { horizontal: 'center' };

  ws.mergeCells('C1:E1');
  const d2 = ws.getCell('C1');
  d2.value = 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  d2.font = { name: 'Times New Roman', size: 12, bold: true };
  d2.alignment = { horizontal: 'center' };

  ws.mergeCells('A2:B2');
  const d3 = ws.getCell('A2');
  d3.value = `LỚP ${className.toUpperCase()}`;
  d3.font = { name: 'Times New Roman', size: 12, bold: true, underline: true };
  d3.alignment = { horizontal: 'center' };

  ws.mergeCells('C2:E2');
  const d4 = ws.getCell('C2');
  d4.value = 'Độc lập - Tự do - Hạnh phúc';
  d4.font = { name: 'Times New Roman', size: 13, bold: true, underline: true };
  d4.alignment = { horizontal: 'center' };

  ws.addRow([]);
  
  ws.mergeCells('A4:E4');
  const title = ws.getCell('A4');
  title.value = `BẢNG PHÂN CÔNG VÀ THEO DÕI LAO ĐỘNG LỚP ${className.toUpperCase()}`;
  title.font = { name: 'Times New Roman', size: 14, bold: true };
  title.alignment = { horizontal: 'center' };

  ws.mergeCells('A5:E5');
  const subtitle = ws.getCell('A5');
  subtitle.value = `NĂM HỌC: ${schoolYear}`;
  subtitle.font = { name: 'Times New Roman', size: 12, italic: true };
  subtitle.alignment = { horizontal: 'center' };

  ws.addRow([]);

  ws.columns = [
    { width: 6 },
    { width: 15 },
    { width: 25 },
    { width: 20 },
    { width: 20 }
  ];

  let currentRow = 7;

  DAYS.forEach(day => {
    SHIFTS.forEach(shift => {
      const assignment = shiftAssignments.find(a => a.day === day && a.shift === shift);
      const teamValue = assignment?.team || 0;
      
      ws.mergeCells(`A${currentRow}:E${currentRow}`);
      const headerCell = ws.getCell(`A${currentRow}`);
      headerCell.value = `${day} - Ca ${shift}${teamValue > 0 ? ` (Tổ ${teamValue})` : ' (Chưa phân công)'}`;
      headerCell.font = { name: 'Times New Roman', size: 12, bold: true };
      headerCell.alignment = { vertical: 'middle' };
      currentRow++;

      if (teamValue > 0) {
        const headerRow = ws.getRow(currentRow);
        headerRow.values = ['STT', 'Mã Định Danh', 'Họ và Tên', 'Vị trí trực', 'Tiến độ'];
        headerRow.font = { name: 'Times New Roman', size: 12, bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        
        ['A','B','C','D','E'].forEach(col => {
          ws.getCell(`${col}${currentRow}`).border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
        
        currentRow++;

        const teamStudents = students.filter(s => s.team === teamValue);
        
        if (teamStudents.length === 0) {
           const row = ws.getRow(currentRow);
           ws.mergeCells(`C${currentRow}:E${currentRow}`);
           row.values = [
             '',
             '',
             '(Chưa có học sinh trong tổ này)',
             '',
             ''
           ];
           row.font = { name: 'Times New Roman', size: 12, italic: true };
           
           ['A','B','C','D','E'].forEach(col => {
             ws.getCell(`${col}${currentRow}`).border = {
               top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
             };
           });
           currentRow++;
        }

        teamStudents.forEach((st, idx) => {
          const recordId = `${day}-${shift}-${st.id}`;
          const record = dutyRecords.find(r => r.id === recordId);
          
          const row = ws.getRow(currentRow);
          row.values = [
            idx + 1,
            st.code,
            st.name,
            record?.location || '',
            record?.status || ''
          ];
          row.font = { name: 'Times New Roman', size: 12 };
          
          ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
          ws.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
          
          ['A','B','C','D','E'].forEach(col => {
            ws.getCell(`${col}${currentRow}`).border = {
              top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
          });
          
          currentRow++;
        });
      } else {
        ws.mergeCells(`A${currentRow}:E${currentRow}`);
        const emptyCell = ws.getCell(`A${currentRow}`);
        emptyCell.value = '(Không có phân công trực nhật)';
        emptyCell.font = { name: 'Times New Roman', size: 12, italic: true };
        emptyCell.alignment = { horizontal: 'left', vertical: 'middle' };
        emptyCell.border = {
          top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        currentRow++;
      }
      
      currentRow++; // add an empty row spacing
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `BangTrucTuan_${className}.xlsx`);
};

export const exportToWord = async (
  students: Student[],
  shiftAssignments: ShiftAssignment[],
  dutyRecords: StudentDutyRecord[],
  className: string = '8A2',
  schoolYear: string = '2026 - 2027',
  schoolName: string = 'TRƯỜNG THCS ...'
) => {
  const docElements: any[] = [
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: schoolName || 'TRƯỜNG THCS ...', bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: `LỚP ${className.toUpperCase()}`, bold: true, font: 'Times New Roman', size: 26, underline: { type: 'single' } })], alignment: AlignmentType.CENTER }),
              ],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, font: 'Times New Roman', size: 28, underline: { type: 'single' } })], alignment: AlignmentType.CENTER }),
              ],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }),
    new Paragraph({ spacing: { before: 200, after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `BẢNG PHÂN CÔNG VÀ THEO DÕI LAO ĐỘNG LỚP ${className.toUpperCase()}\n`,
          bold: true,
          font: 'Times New Roman',
          size: 28, // 14pt
        }),
        new TextRun({ text: `Năm học: ${schoolYear}`, font: 'Times New Roman', size: 26, italics: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  ];

  DAYS.forEach(day => {
    SHIFTS.forEach(shift => {
      const assignment = shiftAssignments.find(a => a.day === day && a.shift === shift);
      const teamValue = assignment?.team || 0;
      
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${day} - Ca ${shift}${teamValue > 0 ? ` (Tổ ${teamValue})` : ' (Chưa phân công)'}`,
              bold: true,
              font: 'Times New Roman',
              size: 26,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );

      // Even if unassigned, we should perhaps show an empty table or skip the table if unassigned
      if (teamValue > 0) {
        const teamStudents = students.filter(s => s.team === teamValue);
        
        const tableRows = [
          new TableRow({
            children: ['STT', 'Mã Định Danh', 'Họ và Tên', 'Vị trí trực', 'Tiến độ'].map(text => 
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER })],
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ),
          })
        ];

        // Ensure we show an empty row if no students are assigned
        if (teamStudents.length === 0) {
           tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({text: '', alignment: AlignmentType.CENTER})], margins: { top: 100, bottom: 100 } }),
                new TableCell({ children: [new Paragraph({text: '', alignment: AlignmentType.CENTER})] }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: '(Chưa có học sinh trong tổ này)', font: 'Times New Roman', size: 26})]})] }),
                new TableCell({ children: [new Paragraph('')] }),
                new TableCell({ children: [new Paragraph('')] }),
              ]
            })
          );
        }

        teamStudents.forEach((st, idx) => {
          const recordId = `${day}-${shift}-${st.id}`;
          const record = dutyRecords.find(r => r.id === recordId);
          
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: String(idx + 1), font: 'Times New Roman', size: 26})], alignment: AlignmentType.CENTER})], margins: { top: 100, bottom: 100 } }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: st.code, font: 'Times New Roman', size: 26})], alignment: AlignmentType.CENTER})] }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: st.name, font: 'Times New Roman', size: 26})]})], margins: { left: 100 } }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: record?.location || '', font: 'Times New Roman', size: 26})]})], margins: { left: 100 } }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: record?.status || '', font: 'Times New Roman', size: 26})]})], margins: { left: 100 } }),
              ]
            })
          );
        });

        docElements.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [10, 15, 35, 20, 20],
          })
        );
      } else {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '(Không có phân công trực nhật)',
                italics: true,
                font: 'Times New Roman',
                size: 26,
              }),
            ],
            spacing: { before: 50, after: 50 },
          })
        );
      }
    });
  });

  const doc = new Document({
    sections: [{ 
      properties: {
        page: {
          margin: {
            top: 1134, // 2 cm
            right: 1134,
            bottom: 1134,
            left: 1701, // 3 cm
          },
        },
      },
      children: docElements 
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BangTrucTuan_${className}.docx`);
};

export const exportPenaltyToWord = async (
  penalty: PenaltyRecord,
  student: Student,
  className: string = '8A2',
  schoolYear: string = '2026 - 2027',
  schoolName: string = 'TRƯỜNG THCS ...'
) => {
  const classNameText = student.classNameText || className || '8A2';
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134, // 2 cm
            right: 1134,
            bottom: 1134,
            left: 1701, // 3 cm
          },
        },
      },
      children: [
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: schoolName || 'TRƯỜNG THCS ...', bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: `LỚP ${classNameText.toUpperCase()}`, bold: true, font: 'Times New Roman', size: 26, underline: { type: 'single' } })], alignment: AlignmentType.CENTER }),
                  ],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, font: 'Times New Roman', size: 28, underline: { type: 'single' } })], alignment: AlignmentType.CENTER }),
                  ],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                })
              ]
            })
          ],
          width: { size: 100, type: WidthType.PERCENTAGE }
        }),
        new Paragraph({ spacing: { before: 400, after: 400 } }),
        new Paragraph({
          children: [
            new TextRun({ text: 'PHIẾU XỬ PHẠT', bold: true, font: 'Times New Roman', size: 36 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'VI PHẠM NỘI QUY LAO ĐỘNG', bold: true, font: 'Times New Roman', size: 32 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ngày lập form:   ', italics: true, font: 'Times New Roman', size: 28 }),
            new TextRun({ text: penalty.date || '...', italics: true, font: 'Times New Roman', size: 28, underline: { type: 'dash' } })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Căn cứ vào nội quy lao động và theo dõi trực tuần, Ban cán sự lớp ${classNameText} tiến hành lập biên bản xử phạt đối với:`, font: 'Times New Roman', size: 28 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Họ và tên học sinh: ', bold: true, font: 'Times New Roman', size: 28 }),
            new TextRun({ text: ` ${student.name} ${student.team ? `(Tổ ${student.team})` : ''} `, bold: true, font: 'Times New Roman', size: 28, underline: { type: 'dotted' } }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),
        ...(penalty.dutyDay || penalty.dutyShift ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Vi phạm ca trực: ', font: 'Times New Roman', size: 28 }),
              new TextRun({ text: ` ${[penalty.dutyShift ? `Ca ${penalty.dutyShift}` : '', penalty.dutyDay].filter(Boolean).join(' - ')} `, font: 'Times New Roman', size: 28, underline: { type: 'dotted' } }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 }
          })
        ] : []),
        ...(penalty.dutyLocation ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Vị trí phân công: ', font: 'Times New Roman', size: 28 }),
              new TextRun({ text: ` ${penalty.dutyLocation} `, font: 'Times New Roman', size: 28, underline: { type: 'dotted' } }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 }
          })
        ] : []),
        new Paragraph({
          children: [
            new TextRun({ text: 'Lý do xử phạt: ', font: 'Times New Roman', size: 28 }),
            new TextRun({ text: ` ${penalty.reason || ''} `, font: 'Times New Roman', size: 28, underline: { type: 'dotted' } }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Hình thức xử phạt: ', bold: true, font: 'Times New Roman', size: 28 }),
            new TextRun({ text: 'Trừ ', font: 'Times New Roman', size: 28 }),
            new TextRun({ text: `${penalty.deduction} sao`, bold: true, font: 'Times New Roman', size: 28, color: 'FF0000' }), // Red color for deduction
            new TextRun({ text: ' vào kết quả thi đua cá nhân cuối tuần.', font: 'Times New Roman', size: 28 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '\tHọc sinh vi phạm cần nghiêm túc kiểm điểm và rút kinh nghiệm, không để tái phạm trong các ca trực tiếp theo. Nếu vẫn tiếp tục vi phạm sẽ bị xử lý theo mức phạt tăng dần.', font: 'Times New Roman', size: 28 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 800 }
        }),
        new Paragraph({ spacing: { before: 400, after: 400 } }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Học sinh vi phạm', bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                  ],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Người lập phiếu', bold: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, font: 'Times New Roman', size: 26 })], alignment: AlignmentType.CENTER }),
                  ],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                })
              ]
            })
          ],
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `PhieuPhat_${student.name.replace(/\s+/g,'_')}.docx`);
};

export const exportConductToExcel = async (
  students: Student[],
  className: string = '',
  schoolYear: string = '',
  schoolName: string = ''
) => {
  const classNameText = className || (students.length > 0 && students[0].classNameText ? students[0].classNameText : '8A2');
  const titleText = `BẢNG BÌNH XÉT HẠNH KIỂM LỚP ${classNameText.toUpperCase()}${schoolYear ? ` - NĂM HỌC ${schoolYear}` : ''}`;
  const fileName = `BinhXetHanhKiem_${classNameText}.xlsx`;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('DanhGiaHanhKiem', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  ws.mergeCells('A1:E1');
  const title = ws.getCell('A1');
  title.value = titleText;
  title.font = { name: 'Times New Roman', size: 14, bold: true };
  title.alignment = { horizontal: 'center' };

  ws.addRow([]);

  ws.columns = [
    { width: 6 },
    { width: 15 },
    { width: 30 },
    { width: 15 },
    { width: 25 },
  ];

  const headerRow = ws.addRow(['STT', 'Lớp', 'Họ và Tên', 'Tổ', 'Hạnh Kiểm']);
  headerRow.font = { name: 'Times New Roman', size: 12, bold: true };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  ['A','B','C','D','E'].forEach(col => {
    ws.getCell(`${col}3`).border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  let currentRow = 4;
  students.forEach((st, idx) => {
    const row = ws.getRow(currentRow);
    row.values = [
      idx + 1,
      st.classNameText || classNameText,
      st.name,
      `Tổ ${st.team}`,
      st.conduct || ''
    ];
    row.font = { name: 'Times New Roman', size: 12 };

    ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`D${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };

    ['A','B','C','D','E'].forEach(col => {
      ws.getCell(`${col}${currentRow}`).border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    currentRow++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
};

export const exportConductToWord = async (
  students: Student[],
  className: string = '',
  schoolYear: string = '',
  schoolName: string = ''
) => {
  const classNameText = className || (students.length > 0 && students[0].classNameText ? students[0].classNameText : '8A2');
  const titleText = `BẢNG BÌNH XÉT HẠNH KIỂM LỚP ${classNameText.toUpperCase()}${schoolYear ? ` - NĂM HỌC ${schoolYear}` : ''}\n`;
  const fileName = `BinhXetHanhKiem_${classNameText}.docx`;

  const docElements: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: titleText,
          bold: true,
          font: 'Times New Roman',
          size: 28,
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  ];

  const tableRows = [
    new TableRow({
      children: ['STT', 'Lớp', 'Họ và Tên', 'Tổ', 'Hạnh Kiểm'].map(text => 
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.CENTER })],
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })
      ),
    })
  ];

  students.forEach((st, idx) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({children: [new TextRun({text: String(idx + 1), font: 'Times New Roman', size: 24})], alignment: AlignmentType.CENTER})], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({children: [new TextRun({text: st.classNameText || '', font: 'Times New Roman', size: 24})], alignment: AlignmentType.CENTER})] }),
          new TableCell({ children: [new Paragraph({children: [new TextRun({text: st.name, font: 'Times New Roman', size: 24})]})], margins: { left: 100 } }),
          new TableCell({ children: [new Paragraph({children: [new TextRun({text: `Tổ ${st.team}`, font: 'Times New Roman', size: 24})], alignment: AlignmentType.CENTER})] }),
          new TableCell({ children: [new Paragraph({children: [new TextRun({text: st.conduct || '', font: 'Times New Roman', size: 24})], alignment: AlignmentType.CENTER})] }),
        ]
      })
    );
  });

  docElements.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [10, 15, 40, 15, 20],
    })
  );

  const doc = new Document({
    sections: [{ 
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1701 }
        },
      },
      children: docElements 
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
};
