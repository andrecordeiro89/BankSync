
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Make sure this is correctly imported and used by jsPDF
import { 
    ReconciliationSessionData, 
    MatchedPair, 
    BankTransaction, 
    LedgerEntry, 
    MatchStatus 
} from '../types';
import { COMPANY_NAME } from '../constants';

// Define a more specific type for the lastAutoTable property
interface LastAutoTable {
  finalY: number;
  // Add other properties if you use them, e.g., pageCount, startY, etc.
  // For now, finalY is what's needed.
  [key: string]: any; // Allow other properties as jsPDF-autoTable adds several
}

// Extend jsPDF interface to include autoTable and lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: LastAutoTable; // Correctly typed property
  }
}

const PAGE_MARGIN = 15;
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_LARGE = 16;
const LINE_HEIGHT = 1.5;
const CORPORATE_BLUE_RGB = [7, 89, 133]; // #075985
const CORPORATE_TEAL_RGB = [13, 148, 136]; // #0D9488

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { // Check if date is valid
        // If original string is DD/MM/AAAA, try to parse it that way
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) -1;
            const year = parseInt(parts[2], 10);
            const parsedDate = new Date(year, month, day);
            if (!isNaN(parsedDate.getTime())) return parsedDate.toLocaleDateString('pt-BR');
        }
        return dateString; // return original if complex parse fails
    }
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString; // Fallback to original string if parsing fails
  }
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const addHeader = (doc: jsPDF, sessionData: ReconciliationSessionData, pageTitlePrefix: string) => {
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(FONT_SIZE_NORMAL);
  doc.setTextColor(50); // Dark grey

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `${pageTitlePrefix} - ${COMPANY_NAME} Conciliação`,
      PAGE_MARGIN,
      PAGE_MARGIN / 1.5,
      { align: 'left' }
    );
    doc.text(
      `Sessão ID: ${sessionData.sessionId}`,
      doc.internal.pageSize.getWidth() - PAGE_MARGIN,
      PAGE_MARGIN / 1.5,
      { align: 'right' }
    );
  }
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setTextColor(100); // Lighter grey

  const disclaimer = "Este relatório foi gerado com o auxílio de Inteligência Artificial e representa uma análise preliminar.\nRecomenda-se a conferência e validação manual de todos os dados antes de qualquer tomada de decisão. HealthAdmin - BankSync.";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const disclaimerLines = doc.splitTextToSize(disclaimer, doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2);
    doc.text(disclaimerLines, PAGE_MARGIN, doc.internal.pageSize.getHeight() - PAGE_MARGIN - (disclaimerLines.length * FONT_SIZE_SMALL * 0.35) - 2);
    
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - PAGE_MARGIN,
      doc.internal.pageSize.getHeight() - PAGE_MARGIN / 2,
      { align: 'right' }
    );
  }
};

const addCoverPage = (doc: jsPDF, sessionData: ReconciliationSessionData) => {
  doc.setFontSize(FONT_SIZE_LARGE + 4);
  doc.setTextColor(CORPORATE_BLUE_RGB[0], CORPORATE_BLUE_RGB[1], CORPORATE_BLUE_RGB[2]);
  doc.text(`${COMPANY_NAME} - Relatório de Conciliação Bancária`, doc.internal.pageSize.getWidth() / 2, PAGE_MARGIN + 20, { align: 'center' });

  doc.setFontSize(FONT_SIZE_NORMAL);
  doc.setTextColor(50);
  let yPos = PAGE_MARGIN + 50;

  const addTextLine = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, PAGE_MARGIN + 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, PAGE_MARGIN + 70, yPos);
    yPos += FONT_SIZE_NORMAL * LINE_HEIGHT * 0.7;
  };

  addTextLine("ID da Sessão:", sessionData.sessionId);
  addTextLine("Data da Sessão:", formatDate(sessionData.sessionDate));
  addTextLine("Data de Geração do Relatório:", formatDate(new Date().toISOString()));
  
  yPos += FONT_SIZE_NORMAL * LINE_HEIGHT;
  doc.setFontSize(FONT_SIZE_SMALL);
  doc.setTextColor(100);
  const introText = "Este documento detalha os resultados da sessão de conciliação bancária, incluindo itens conciliados, divergências e pendências identificadas.";
  const introLines = doc.splitTextToSize(introText, doc.internal.pageSize.getWidth() - (PAGE_MARGIN + 20) * 2);
  doc.text(introLines, PAGE_MARGIN + 20, yPos);

  doc.addPage();
};


const createTable = (doc: jsPDF, title: string, head: string[][], body: any[][], startY?: number) => {
  doc.setFontSize(FONT_SIZE_LARGE - 2);
  doc.setTextColor(CORPORATE_TEAL_RGB[0], CORPORATE_TEAL_RGB[1], CORPORATE_TEAL_RGB[2]);
  const titleWidth = doc.getTextWidth(title);
  const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
  
  // Check if new page is needed for title
  let currentY = startY || (doc.lastAutoTable?.finalY || PAGE_MARGIN) + 10; // Corrected: Use doc.lastAutoTable.finalY
  if (currentY + 20 > doc.internal.pageSize.getHeight() - PAGE_MARGIN) { // 20 is approx title height + space
    doc.addPage();
    currentY = PAGE_MARGIN + 10;
  }
  doc.text(title, titleX, currentY);
  currentY += 5;


  doc.autoTable({
    startY: currentY,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: CORPORATE_BLUE_RGB,
      textColor: [255, 255, 255],
      fontSize: FONT_SIZE_SMALL,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: FONT_SIZE_SMALL -1 ,
      cellPadding: 1.5,
      textColor: [50,50,50]
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255] // AliceBlue like
    },
    columnStyles: {
        0: { cellWidth: 'auto' }, // Date
        1: { cellWidth: 'auto' }, // Description
        2: { halign: 'right', cellWidth: 'auto' }, // Amount
        3: { cellWidth: 'auto'}, // Reference
        // Add more if needed, or make them specific per table
    },
    margin: { top: PAGE_MARGIN, bottom: PAGE_MARGIN + 15 }, // Ensure space for footer
    didDrawPage: (data) => {
        // This ensures header/footer are added if autoTable creates new pages
    }
  });
};

export const generateReconciliationReportPdf = async (sessionData: ReconciliationSessionData): Promise<void> => {
  const doc = new jsPDF('p', 'mm', 'a4');

  addCoverPage(doc, sessionData);

  // Section 1: Conciliados (Valores Exatos)
  const exactMatches = sessionData.matchedPairs.filter(p => p.status === MatchStatus.MatchedExact);
  if (exactMatches.length > 0) {
    const headExact = [['Data Extrato', 'Desc Extrato', 'Valor Extrato', 'Ref Extrato', 'Data Interno', 'Desc Interno', 'Valor Interno', 'Ref Interno']];
    const bodyExact = exactMatches.map(p => [
      formatDate(p.bankTransaction.date),
      p.bankTransaction.description,
      formatCurrency(p.bankTransaction.amount),
      p.bankTransaction.reference || '-',
      formatDate(p.ledgerEntry.date),
      p.ledgerEntry.description,
      formatCurrency(p.ledgerEntry.amount),
      p.ledgerEntry.reference || '-',
    ]);
    createTable(doc, 'Conciliados (Valores Exatos)', headExact, bodyExact);
  }

  // Section 2: Itens com Divergência
  const discrepancies = sessionData.matchedPairs.filter(p => p.status === MatchStatus.MatchedWithDiscrepancy);
  if (discrepancies.length > 0) {
    const headDiscrepancy = [['Data Extrato', 'Desc Extrato', 'Valor Extrato', 'Ref Extrato', 'Data Interno', 'Desc Interno', 'Valor Interno', 'Ref Interno', 'Divergências']];
    const bodyDiscrepancy = discrepancies.map(p => {
      let discrepancyNotes = [];
      if (p.discrepancy?.amount) discrepancyNotes.push(`Valor: E ${formatCurrency(p.discrepancy.amount.bank)} / I ${formatCurrency(p.discrepancy.amount.ledger)} (Dif: ${formatCurrency(p.discrepancy.amount.difference)})`);
      if (p.discrepancy?.date) discrepancyNotes.push(`Data: E ${formatDate(p.discrepancy.date.bank)} / I ${formatDate(p.discrepancy.date.ledger)} (${p.discrepancy.date.differenceDaysAbs} dias)`);
      if (p.discrepancy?.reference) discrepancyNotes.push('Referência difere');
      return [
        formatDate(p.bankTransaction.date),
        p.bankTransaction.description,
        formatCurrency(p.bankTransaction.amount),
        p.bankTransaction.reference || '-',
        formatDate(p.ledgerEntry.date),
        p.ledgerEntry.description,
        formatCurrency(p.ledgerEntry.amount),
        p.ledgerEntry.reference || '-',
        discrepancyNotes.join('; ') || 'Detalhes na UI'
      ];
    });
    createTable(doc, 'Itens com Divergência', headDiscrepancy, bodyDiscrepancy);
  }

  // Section 3: Pendentes (Extrato Bancário)
  const unmatchedBank = sessionData.allBankTransactions.filter(bt => !bt.isMatched);
  if (unmatchedBank.length > 0) {
    const headBank = [['Data', 'Descrição', 'Valor', 'Referência', 'Saldo Pós']];
    const bodyBank = unmatchedBank.map(tx => [
      formatDate(tx.date),
      tx.description,
      formatCurrency(tx.amount),
      tx.reference || '-',
      formatCurrency(tx.balanceAfter)
    ]);
    createTable(doc, 'Pendentes (Extrato Bancário)', headBank, bodyBank);
  }

  // Section 4: Pendentes (Registros Internos)
  const unmatchedLedger = sessionData.allLedgerEntries.filter(le => !le.isMatched);
  if (unmatchedLedger.length > 0) {
    const headLedger = [['Data', 'Descrição', 'Valor', 'Referência', 'Conta', 'C. Custo']];
    const bodyLedger = unmatchedLedger.map(entry => [
      formatDate(entry.date),
      entry.description,
      formatCurrency(entry.amount),
      entry.reference || '-',
      entry.accountCode || '-',
      entry.costCenter || '-'
    ]);
    createTable(doc, 'Pendentes (Registros Internos)', headLedger, bodyLedger);
  }
  
  if (exactMatches.length === 0 && discrepancies.length === 0 && unmatchedBank.length === 0 && unmatchedLedger.length === 0) {
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.setTextColor(50);
    // Corrected: Use doc.lastAutoTable.finalY. Ensure lastAutoTable exists, otherwise default to PAGE_MARGIN
    const yPositionForNoDataText = (doc.lastAutoTable?.finalY || PAGE_MARGIN) + 20;
    doc.text("Nenhum dado para exibir no relatório.", PAGE_MARGIN, yPositionForNoDataText);
  }

  // Add header and footer to all pages AFTER all content is added
  addHeader(doc, sessionData, "Relatório de Conciliação");
  addFooter(doc);

  doc.save(`${COMPANY_NAME}_Relatorio_Conciliacao_${sessionData.sessionId}_${new Date().toISOString().substring(0,10)}.pdf`);
};
