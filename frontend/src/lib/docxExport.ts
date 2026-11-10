import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  ShadingType,
} from 'docx';

export interface ParsedDocxContent {
  title?: string;
  intro?: string;
  tableData?: Array<{ key: string; value: string }>;
  notes?: string;
  rawText: string;
}

/**
 * Trích xuất các trường thông tin từ câu trả lời của Trợ lý AI để chuẩn hoá sang cấu trúc Document.
 */
export function parseAssistantContent(rawText: string): ParsedDocxContent {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const introLines: string[] = [];
  const tableData: Array<{ key: string; value: string }> = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    // Làm sạch các ký tự markdown thô nếu có
    const cleanLine = line
      .replace(/^[*\-•]\s+/, '')
      .replace(/\*\*/g, '')
      .trim();

    // Nhận diện dòng key: value (ví dụ "Lịch tập hôm nay: Chưa có lịch" hoặc "Gói tập: Gói 12 tháng")
    const kvMatch = cleanLine.match(/^([A-Za-zÀ-ỹ0-9\s/–-]+):\s+(.+)$/);
    if (kvMatch && kvMatch[1].length < 35 && !kvMatch[1].toLowerCase().includes('chào') && !kvMatch[1].toLowerCase().includes('nếu bạn')) {
      tableData.push({
        key: kvMatch[1].trim(),
        value: kvMatch[2].trim(),
      });
      continue;
    }

    if (tableData.length === 0) {
      introLines.push(cleanLine);
    } else {
      noteLines.push(cleanLine);
    }
  }

  return {
    title: 'BÁO CÁO TỔNG HỢP TỪ TRỢ LÝ GYMFLOW',
    intro: introLines.join(' '),
    tableData: tableData.length > 0 ? tableData : undefined,
    notes: noteLines.join('\n\n'),
    rawText,
  };
}

/**
 * Tạo và tải xuống file Microsoft Word (.docx) chuyên nghiệp từ câu trả lời của Trợ lý AI.
 */
export async function downloadDocxReport(content: string, filename = 'GymFlow_Bao_Cao.docx') {
  const parsed = parseAssistantContent(content);

  const children: Array<Paragraph | Table> = [];

  // 1. Tiêu đề tài liệu chính
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: 'HỆ THỐNG QUẢN LÝ PHÒNG GYM GYMFLOW',
          bold: true,
          size: 30, // 15pt
          color: '00B24B', // GymFlow Primary Green
          font: 'Segoe UI',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'PHIẾU TRÍCH XUẤT THÔNG TIN TRỢ LÝ HỘI VIÊN',
          bold: true,
          size: 24, // 12pt
          color: '2C3E50',
          font: 'Segoe UI',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}`,
          italics: true,
          size: 18,
          color: '7F8C8D',
          font: 'Segoe UI',
        }),
      ],
    })
  );

  // 2. Lời chào / Lời mở đầu
  if (parsed.intro) {
    children.push(
      new Paragraph({
        spacing: { after: 240, line: 360 },
        children: [
          new TextRun({
            text: parsed.intro,
            size: 22,
            color: '2C3E50',
            font: 'Segoe UI',
          }),
        ],
      })
    );
  }

  // 3. Bảng dữ liệu thông tin chi tiết (nếu có)
  if (parsed.tableData && parsed.tableData.length > 0) {
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: '00B24B' },
            children: [
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({
                    text: 'HẠNG MỤC / CHỈ TIÊU',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: '00B24B' },
            children: [
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({
                    text: 'CHI TIẾT HỆ THỐNG',
                    bold: true,
                    size: 20,
                    color: 'FFFFFF',
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      ...parsed.tableData.map(
        (item, index) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                shading: {
                  type: ShadingType.CLEAR,
                  fill: index % 2 === 0 ? 'F8F9FA' : 'FFFFFF',
                },
                children: [
                  new Paragraph({
                    spacing: { before: 100, after: 100 },
                    children: [
                      new TextRun({
                        text: item.key,
                        bold: true,
                        size: 20,
                        color: '34495E',
                        font: 'Segoe UI',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                shading: {
                  type: ShadingType.CLEAR,
                  fill: index % 2 === 0 ? 'F8F9FA' : 'FFFFFF',
                },
                children: [
                  new Paragraph({
                    spacing: { before: 100, after: 100 },
                    children: [
                      new TextRun({
                        text: item.value,
                        size: 20,
                        color: '2C3E50',
                        font: 'Segoe UI',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      }),
      new Paragraph({ spacing: { after: 200 }, children: [] })
    );
  }

  // 4. Lời khuyên & Ghi chú an toàn
  if (parsed.notes) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: 'LỜI KHUYÊN & HƯỚNG DẪN:',
            bold: true,
            size: 22,
            color: '00B24B',
            font: 'Segoe UI',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 300, line: 360 },
        children: [
          new TextRun({
            text: parsed.notes,
            size: 22,
            color: '2C3E50',
            font: 'Segoe UI',
          }),
        ],
      })
    );
  }

  // 5. Chân trang ghi nhận
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: '--- Tài liệu được trích xuất tự động từ GymFlow Smart Assistant ---',
          italics: true,
          size: 16,
          color: '95A5A6',
          font: 'Segoe UI',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
