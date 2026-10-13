import { jsPDF } from 'jspdf';
import { AnalysisReport, Project } from '../types/project';
import { formatINR } from '../engine/fraudDetector';

export interface GeneratedPdfResult {
  doc: jsPDF;
  blob: Blob;
  base64: string;
  filename: string;
}

export function generateProjectAuditPdf(report: AnalysisReport, project?: Project): GeneratedPdfResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add page header
  const drawHeader = () => {
    // Top banner
    doc.setFillColor(15, 23, 42); // Navy 900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('MPLAD PROJECT FRAUD DETECTION SYSTEM', margin, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Forensic Financial Audit Dossier · Ministry Scheme Monitoring', margin, 18);

    doc.setFontSize(8);
    doc.text(`Ref: ${report.projectNumber}`, pageWidth - margin, 11, { align: 'right' });
    doc.text(`Date: ${new Date(report.generatedAt).toLocaleDateString('en-IN')}`, pageWidth - margin, 18, { align: 'right' });

    y = 32;
  };

  const drawFooter = (pageNum: number, totalPages: number = 1) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Official Disclaimer: Automated warnings highlight potential accounting anomalies requiring on-site audit verification. Not legal proof of fraud.',
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  drawHeader();

  // Demonstration Data Watermark banner if applicable
  if (report.verificationStatus === 'Demo Data') {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DEMONSTRATION RECORD: This audit report is generated for academic / evaluation simulation.', margin + 4, y + 5.8);
    y += 14;
  }

  // Project Identity Block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(report.projectTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 5.5 + 2;

  // Metadata row
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const metaText = `Category: ${project?.category || 'General'}  |  State: ${project?.state || 'N/A'}  |  District: ${project?.district || 'N/A'}  |  Status: ${project?.status || 'Active'}`;
  doc.text(metaText, margin, y);
  y += 6;

  if (project?.mpName || project?.constituency) {
    doc.text(`Constituency: ${project.constituency || 'N/A'}  |  MP: ${project.mpName || 'N/A'} (${project.mpHouse || 'Lok Sabha'})`, margin, y);
    y += 6;
  }

  doc.text(`Verification Status: ${report.verificationStatus}  |  Provenance: ${report.dataProvenance}`, margin, y);
  y += 9;

  // Financial & Risk Score Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  // Risk Score Column
  const riskBoxWidth = 50;
  doc.setFillColor(
    report.riskCategory === 'Critical'
      ? 239
      : report.riskCategory === 'High'
      ? 249
      : report.riskCategory === 'Moderate'
      ? 254
      : 240,
    report.riskCategory === 'Critical'
      ? 68
      : report.riskCategory === 'High'
      ? 115
      : report.riskCategory === 'Moderate'
      ? 243
      : 253,
    report.riskCategory === 'Critical'
      ? 68
      : report.riskCategory === 'High'
      ? 22
      : report.riskCategory === 'Moderate'
      ? 199
      : 244
  );
  doc.rect(margin + 2, y + 2, riskBoxWidth, 22, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK EVALUATION', margin + 6, y + 7);

  doc.setFontSize(14);
  const scoreDisplay = report.riskScore !== null ? `${report.riskScore}/100` : 'N/A';
  doc.text(scoreDisplay, margin + 6, y + 14);

  doc.setFontSize(9);
  doc.text(`${report.riskCategory} Risk`, margin + 6, y + 20);

  // Financial Metrics Columns
  const fxStart = margin + riskBoxWidth + 8;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SANCTIONED AMOUNT', fxStart, y + 8);
  doc.text('RECORDED EXPENDITURE', fxStart + 45, y + 8);
  doc.text('VARIANCE (EXPENDITURE - SANCTION)', fxStart + 92, y + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatINR(report.financials.sanctionedAmount), fxStart, y + 15);
  doc.text(formatINR(report.financials.recordedExpenditure), fxStart + 45, y + 15);

  const variance =
    report.financials.recordedExpenditure !== undefined && report.financials.sanctionedAmount
      ? report.financials.recordedExpenditure - report.financials.sanctionedAmount
      : undefined;

  if (variance !== undefined) {
    if (variance > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`+${formatINR(variance)} (Excess)`, fxStart + 92, y + 15);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text(`${formatINR(variance)} (Within Budget)`, fxStart + 92, y + 15);
    }
  } else {
    doc.text('N/A', fxStart + 92, y + 15);
  }

  y += 33;

  // Executive AI Narrative (if generated)
  if (report.aiSummary) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Audit Analysis Summary', margin, y);
    y += 5;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    const summaryLines = doc.splitTextToSize(report.aiSummary, contentWidth - 8);
    const boxHeight = summaryLines.length * 4.2 + 8;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(summaryLines, margin + 4, y + 5);
    y += boxHeight + 7;
  }

  // Findings Section Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Audit Findings & Potential Irregularities (${report.findings.length})`, margin, y);
  y += 6;

  if (report.findings.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('No deterministic warning signs or mathematical anomalies detected in this project record.', margin, y);
    y += 10;
  } else {
    for (const finding of report.findings) {
      // Check if we need a new page
      if (y > pageHeight - 45) {
        drawFooter(1);
        doc.addPage();
        drawHeader();
      }

      // Finding Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);

      // Severity indicator bar color
      const sevColor =
        finding.severity === 'Critical'
          ? [220, 38, 38]
          : finding.severity === 'High'
          ? [234, 88, 12]
          : finding.severity === 'Moderate'
          ? [202, 138, 4]
          : [71, 85, 105];

      // Draw title
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.text(`[${finding.severity.toUpperCase()}] ${finding.ruleId}: ${finding.title}`, margin, y);
      y += 4.5;

      // Explanation
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const expLines = doc.splitTextToSize(finding.explanation, contentWidth);
      doc.text(expLines, margin, y);
      y += expLines.length * 3.8 + 2;

      // Evidence & Action
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const evText = `Evidence: ${finding.evidence}`;
      const evLines = doc.splitTextToSize(evText, contentWidth);
      doc.text(evLines, margin, y);
      y += evLines.length * 3.4 + 2;

      doc.setTextColor(3, 105, 161);
      const actText = `Action Required: ${finding.recommendedAction}`;
      const actLines = doc.splitTextToSize(actText, contentWidth);
      doc.text(actLines, margin, y);
      y += actLines.length * 3.4 + 5;
    }
  }

  // Recommended Administrative Actions & Limitations
  if (y > pageHeight - 50) {
    drawFooter(1);
    doc.addPage();
    drawHeader();
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Verification Procedures', margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const actions = report.recommendedActions.length > 0 ? report.recommendedActions : ['Verify on-site execution with Nodal Collectorate.'];
  for (const act of actions) {
    doc.text(`•  ${act}`, margin + 2, y);
    y += 4.5;
  }

  y += 4;
  if (report.dataLimitations.length > 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.text('Data Integrity Notice:', margin, y);
    y += 4;
    for (const lim of report.dataLimitations) {
      doc.text(`- ${lim}`, margin + 2, y);
      y += 3.8;
    }
  }

  drawFooter(1);

  const filename = `MPLADS_Audit_Report_${report.projectNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring');

  return { doc, blob, base64, filename };
}

export function downloadPdf(result: GeneratedPdfResult): void {
  result.doc.save(result.filename);
}
