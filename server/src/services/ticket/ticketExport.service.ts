import Ticket from '../../models/Ticket';
import type { IUserDocument } from '../../models/User';
import { buildListFilter, getTicketDuration, populateTicket } from './ticketCommon';

export const exportCsv = async (actor: IUserDocument, query: Record<string, unknown>) => {
  const filter = buildListFilter(actor, query);
  const tickets = await populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).limit(5000));

  const header = [
    'ticketCode',
    'requesterName',
    'mobile',
    'department',
    'subCategory',
    'ticketTitle',
    'priority',
    'status',
    'assignedTo',
    'createdAt',
    'expectedResolutionAt',
    'deadline',
    'duration',
  ];

  const escape = (val: unknown) => {
    const s = val == null ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = tickets.map((t) => {
    const dept = t.department as unknown as { name?: string } | undefined;
    const assignee = t.assignedTo as unknown as { name?: string } | undefined;

    return [
      t.ticketCode,
      t.requester?.name,
      t.requester?.mobile,
      dept?.name,
      t.complaintType,
      t.title || '',
      t.priority,
      t.status,
      assignee?.name || '',
      t.createdAt?.toISOString(),
      t.expectedResolutionAt?.toISOString() || '',
      t.expectedResolutionAt ? t.expectedResolutionAt.toISOString() : '',
      getTicketDuration(t),
    ]
      .map(escape)
      .join(',');
  });

  return [header.join(','), ...rows].join('\n');
};

export const exportExcel = async (actor: IUserDocument, query: Record<string, unknown>) => {
  const ExcelJS = (await import('exceljs')).default;
  const filter = buildListFilter(actor, query);
  const tickets = await populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).limit(10000));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ticket Management System';
  workbook.lastModifiedBy = actor.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Tickets Report', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  });

  worksheet.mergeCells('A1:R1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'TICKET MANAGEMENT SYSTEM - PERFORMANCE & RESOLUTION REPORT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 36;

  worksheet.mergeCells('A2:R2');
  const metaCell = worksheet.getCell('A2');

  const filterSummaryParts: string[] = [];
  if (filter.createdAt) {
    const ca = filter.createdAt as Record<string, Date>;
    if (ca.$gte && ca.$lte) {
      filterSummaryParts.push(`Date: ${ca.$gte.toLocaleDateString()} to ${ca.$lte.toLocaleDateString()}`);
    } else if (ca.$gte) {
      filterSummaryParts.push(`Date From: ${ca.$gte.toLocaleDateString()}`);
    } else if (ca.$lte) {
      filterSummaryParts.push(`Date To: ${ca.$lte.toLocaleDateString()}`);
    }
  }
  if (query.status && query.status !== 'all') filterSummaryParts.push(`Status: ${query.status}`);
  if (query.priority && query.priority !== 'all') filterSummaryParts.push(`Priority: ${query.priority}`);
  if (query.department && query.department !== 'all') filterSummaryParts.push(`Dept Filter: Active`);
  if (query.search) filterSummaryParts.push(`Search: "${query.search}"`);

  const filterLabel = filterSummaryParts.length > 0 ? ` | Filter: [${filterSummaryParts.join(', ')}]` : ' | Filter: All Records';
  metaCell.value = `Generated on: ${new Date().toLocaleString()} | Matching Records: ${tickets.length}${filterLabel} | Exported by: ${actor.name}`;
  metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  worksheet.getRow(3).height = 10;

  const headers = [
    'Ticket Code',
    'Requester Name',
    'Mobile',
    'Roll Number',
    'Department',
    'Sub Category',
    'Ticket Title',
    'Priority',
    'Status',
    'Assigned To',
    'Description',
    'Resolution Remarks',
    'Deadline',
    'Duration',
    'User Attachment Image URL',
    'Resolution Proof Image URL',
    'Feedback Rating',
    'Created Date',
  ];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'medium', color: { argb: '1E3A8A' } },
      left: { style: 'thin', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: '94A3B8' } },
    };
  });

  const statusFills: Record<string, { fgColor: string; textColor: string }> = {
    new: { fgColor: 'DBEAFE', textColor: '1E40AF' },
    assigned: { fgColor: 'E0E7FF', textColor: '3730A3' },
    accepted: { fgColor: 'FEF3C7', textColor: '92400E' },
    in_progress: { fgColor: 'FFEDD5', textColor: '9A3412' },
    resolved: { fgColor: 'DCFCE7', textColor: '166534' },
    closed: { fgColor: 'E2E8F0', textColor: '334155' },
    reopened: { fgColor: 'FEE2E2', textColor: '991B1B' },
  };

  const priorityFills: Record<string, { fgColor: string; textColor: string }> = {
    low: { fgColor: 'F3F4F6', textColor: '4B5563' },
    medium: { fgColor: 'E0F2FE', textColor: '075985' },
    high: { fgColor: 'FFEDD5', textColor: 'C2410C' },
    urgent: { fgColor: 'FEE2E2', textColor: 'B91C1C' },
  };

  tickets.forEach((t, idx) => {
    const dept = t.department as unknown as { name?: string } | undefined;
    const assignee = t.assignedTo as unknown as { name?: string } | undefined;
    const userAttUrl = t.userAttachments?.length ? t.userAttachments[0]?.url : t.userAttachment?.url || '—';
    const resAttUrl = t.resolution?.attachments?.length ? t.resolution.attachments[0]?.url : t.resolution?.attachment?.url || '—';
    const feedbackText = t.feedback?.rating
      ? `${t.feedback.rating}★ ${t.feedback.comment ? `("${t.feedback.comment}")` : ''}`
      : 'Unrated';
    const deadlineText = t.expectedResolutionAt
      ? new Date(t.expectedResolutionAt).toLocaleString()
      : '—';
    const durationText = getTicketDuration(t);

    const rowIndex = idx + 5;
    const row = worksheet.getRow(rowIndex);

    row.values = [
      t.ticketCode,
      t.requester?.name || '—',
      t.requester?.mobile || '—',
      t.requester?.rollNumber || '—',
      dept?.name || '—',
      t.complaintType || '—',
      t.title || '—',
      (t.priority || 'medium').toUpperCase(),
      (t.status || 'new').toUpperCase().replace('_', ' '),
      assignee?.name || 'Unassigned',
      t.description || '—',
      t.resolution?.remarks || '—',
      deadlineText,
      durationText,
      userAttUrl,
      resAttUrl,
      feedbackText,
      t.createdAt ? new Date(t.createdAt).toLocaleString() : '—',
    ];

    row.height = 24;

    const isZebra = idx % 2 === 1;
    const bgArgb = isZebra ? 'F8FAFC' : 'FFFFFF';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: '1E293B' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal:
          colNumber === 1 ||
          colNumber === 7 ||
          colNumber === 8 ||
          colNumber === 9 ||
          colNumber === 13 ||
          colNumber === 14 ||
          colNumber === 17
            ? 'center'
            : 'left',
        wrapText: colNumber === 11 || colNumber === 12,
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };

      if (colNumber === 8) {
        const pStyle = priorityFills[t.priority] || priorityFills.medium;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pStyle.fgColor } };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: pStyle.textColor } };
      }

      if (colNumber === 9) {
        const sStyle = statusFills[t.status] || statusFills.new;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sStyle.fgColor } };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: sStyle.textColor } };
      }
    });
  });

  worksheet.columns.forEach((column, colIdx) => {
    let maxLen = 12;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    if (colIdx === 10 || colIdx === 11) {
      column.width = 35;
    } else if (colIdx === 12 || colIdx === 13) {
      column.width = 22;
    } else if (colIdx === 14 || colIdx === 15) {
      column.width = 40;
    } else {
      column.width = Math.min(Math.max(maxLen + 4, 12), 40);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
