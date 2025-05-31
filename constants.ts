

import { UIText } from './types';

export const COMPANY_NAME = "BankSync"; // Changed company name for this app
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17'; // Using the latest recommended text model

// Sample text for testing Gemini extraction for financial documents
export const SAMPLE_BANK_STATEMENT_TEXT = `
EXTRATO DE CONTA CORRENTE
BANCO EXEMPLAR S.A. AG: 0001 C/C: 12345-6
PERÍODO: 01/10/2023 A 31/10/2023
CLIENTE: EMPRESA MODELO LTDA

DATA       HISTÓRICO                                 DOCUMENTO    VALOR (R$)   SALDO (R$)
02/10/2023 SAQUE ATM                                 001001       -100,00      10.900,00
03/10/2023 DEP DINHEIRO                             001002       500,00       11.400,00
05/10/2023 PAG FORNECEDOR XPTO                       159753       -1.250,75    10.149,25
10/10/2023 TED RECEBIDA CLIENTE ABC                  789456       2.500,00     12.649,25
15/10/2023 TARIFA PACOTE SERVIÇOS                    DEB AUT      -59,90       12.589,35
20/10/2023 PIX TRANSF P/ JOAO SILVA                  PIX001       -300,00      12.289,35
25/10/2023 PAG SALARIOS FOLHA SET/23                 001005       -8.500,00    3.789,35
30/10/2023 RENDIMENTOS APLIC AUT                     CRED AUT     15,50        3.804,85
`;

export const SAMPLE_INTERNAL_LEDGER_TEXT = `
REGISTROS INTERNOS - EMPRESA MODELO LTDA
REFERÊNCIA: OUTUBRO/2023

DATA       DESCRIÇÃO                                 REF_INTERNA   CONTA      VALOR (R$)    CENTRO_CUSTO
03/10/2023 Depósito em espécie na Tesouraria         DEP001        1.1.01     500,00        FINANCEIRO
05/10/2023 Pagamento NF 301 - Fornecedor XPTO        NF301         2.1.02     1.250,75      COMPRAS
10/10/2023 Recebimento Fatura 1050 - Cliente ABC    FAT1050       1.1.03     2.500,00      VENDAS
15/10/2023 Tarifa bancária Out/23                    TARIFABCO     4.1.05     59,90         ADMIN
20/10/2023 Adiantamento Salarial - João Silva        ADJ005        2.1.01     300,00        RH
25/10/2023 Folha de Pagamento Setembro/2023          FP092023      2.1.01     8.500,00      GERAL
`;


export const UI_TEXT_RECONCILIATION: UIText = {
  appName: `${COMPANY_NAME} - Conciliação Bancária Inteligente`,
  // File Upload Stage
  fileUploadTitle: "Upload de Documentos para Conciliação",
  bankStatementsSectionTitle: "Extratos Bancários",
  internalRecordsSectionTitle: "Registros Internos da Empresa",
  uploadInstructionsBank: "Envie arquivos de extrato bancário (ex: PDF, CSV, OFX).",
  uploadInstructionsInternal: "Envie arquivos de registros internos (ex: CSV, Excel, PDF de relatórios).",
  addFileButton: "Adicionar Arquivo",
  maxFilesError: (max: number) => `Você pode selecionar no máximo ${max} arquivos por vez.`,
  processFilesButton: "Analisar Arquivos e Iniciar Conciliação", // Changed text
  processingFilesMessage: "Processando arquivos... Extraindo transações com IA.",
  noFilesUploaded: "Nenhum arquivo adicionado. Clique em 'Adicionar Arquivo' para começar.",
  removeFileButton: "Remover",
  fileStatusPending: "Pendente",
  fileStatusProcessing: "Processando...",
  fileStatusSuccess: "Extraído",
  fileStatusError: "Erro na Extração",
  proceedToReconciliationButton: "Ver Resultados da Conciliação", // Changed text
  allFilesProcessedOrError: "Todos os arquivos foram processados ou resultaram em erro.",
  viewExtractedDataButton: "Ver Dados Extraídos",

  // Internal Records Format Info
  internalRecordsFormatInfoTitle: "Dica para Melhor Desempenho na Conciliação!",
  internalRecordsFormatInfoIntro: "Para otimizar a conciliação com IA, seus arquivos de controle financeiro interno (CSV, Excel) devem idealmente conter as seguintes colunas e formatos:",
  internalRecordsFormatInfoColumns: [
    { label: "Data da Transação:", example: "ex: DD/MM/AAAA", importance: "Essencial." },
    { label: "Descrição Detalhada:", example: "ex: Pagamento NF 123 Fornecedor XYZ", importance: "Essencial." },
    { label: "Valor:", example: "ex: 1250.75 (ponto como decimal)", importance: "Essencial." },
    { label: "Número de Referência:", example: "ex: NF123, Pedido456, Cheque789", importance: "CRUCIAL para alta precisão da IA." },
    { label: "Código da Conta Contábil:", example: "ex: 4.01.01", importance: "Recomendado." },
    { label: "Centro de Custo:", example: "ex: Vendas", importance: "Recomendado." },
  ],
  internalRecordsFormatInfoOutro: "Quanto mais detalhada e padronizada for a informação, melhores serão os resultados.",


  // Reconciliation View Stage
  reconciliationWorkspaceTitle: "Área de Conciliação Bancária",
  reconciliationSummaryTitle: "Resumo da Conciliação",
  bankTransactionsTitle: "Transações Bancárias",
  ledgerEntriesTitle: "Lançamentos Internos",
  matchedItemsTitle: "Itens Conciliados",
  discrepanciesTitle: "Itens com Divergência",
  unmatchedBankTitle: "Pendentes (Extrato Bancário)",
  unmatchedLedgerTitle: "Pendentes (Registros Internos)",
  
  reconcileButton: "Conciliar Selecionados",
  markAsInvestigateButton: "Marcar para Investigar",
  editTransactionButton: "Editar Transação",
  saveChangesButton: "Salvar Alterações",
  cancelButton: "Cancelar",
  confirmButton: "Confirmar",
  noTransactionsExtracted: "Nenhuma transação extraída para este arquivo.",
  errorExtractingTransactions: "Erro ao extrair transações.",
  matchConfidenceLabel: "Confiança:",
  highConfidence: "Alta",
  mediumConfidence: "Média",
  lowConfidence: "Baixa",
  manualMatch: "Manual",
  
  amountMismatchAlert: (bankAmt: string, ledgerAmt: string, diff: string) => `Valor divergente: Banco ${bankAmt}, Interno ${ledgerAmt}. Diferença: ${diff}.`,
  dateMismatchAlert: (bankDate: string, ledgerDate: string, diffDays: number) => `Data divergente: Banco ${bankDate}, Interno ${ledgerDate}. (${diffDays} dias).`,
  referenceMismatchAlert: "Referências diferentes ou ausentes.",
  descriptionMismatchAlert: "Descrições significativamente diferentes.",
  exactMatchInfo: "Conciliado (Exato)",
  discrepancyInfo: "Conciliado com Divergência",

  downloadReportButton: "Baixar Relatório (PDF)", // Placeholder for now
  reportDownloadInProgress: "Gerando relatório PDF...",
  reportDownloadSuccess: "Relatório PDF gerado e download iniciado!",
  reportDownloadNotReady: "Funcionalidade de relatório em desenvolvimento.",

  // Summary Labels
  summaryTotalBankItems: "Total de Transações Bancárias:",
  summaryTotalLedgerItems: "Total de Lançamentos Internos:",
  summaryTotalBankAmount: "Valor Total (Extrato):",
  summaryTotalLedgerAmount: "Valor Total (Interno):",
  summaryMatchedPairsCount: "Pares Conciliados:",
  summaryTotalAmountMatched: "Valor Total Conciliado (Exato):",
  summaryDiscrepanciesCount: "Pares com Divergência:",
  summaryNetDifferenceInDiscrepancies: "Diferença Líquida (Divergências):",
  summaryUnmatchedBankCount: "Pendentes no Extrato (Qtd):",
  summaryUnmatchedBankValue: "Pendentes no Extrato (Valor):",
  summaryUnmatchedLedgerCount: "Pendentes Internos (Qtd):",
  summaryUnmatchedLedgerValue: "Pendentes Internos (Valor):",


  // History
  reconciliationHistoryTitle: "Histórico de Conciliações",
  noSessionsInHistory: "Nenhuma sessão de conciliação encontrada no histórico.",
  viewSessionButton: "Ver Detalhes",
  backToFileUploadButton: "Nova Conciliação",
  sessionIdLabel: "ID da Sessão",
  sessionDateLabel: "Data da Sessão",
  totalMatchedLabel: "Total Conciliado",

  // General
  pageTitleSuffix: ` | ${COMPANY_NAME}`,
  errorGeneral: "Ocorreu um erro inesperado.",
  successGeneral: "Operação realizada com sucesso!",
  aiSuggestionsTooltip: "Sugestões de conciliação baseadas em Inteligência Artificial. Revise antes de confirmar.",
  loadingMessage: "Carregando...",
  performingInitialMatchingMessage: "Realizando conciliação automática inicial...",

  // Modal Titles
  modalTitleViewExtractedData: (fileName: string) => `Dados Extraídos de: ${fileName}`,
  modalTitleEditTransaction: "Editar Transação",
  modalTitleConfirmAction: "Confirmar Ação",
};

// Accepted file types for reconciliation documents
export const ACCEPTED_BANK_STATEMENT_TYPES = ".pdf,.csv,.ofx,.txt";
export const ACCEPTED_INTERNAL_RECORD_TYPES = ".csv,.xlsx,.xls,.pdf,.txt";
export const MAX_FILES_PER_UPLOAD_SLOT = 5; // Max files per bank statement or internal record upload action

// Matching Tolerances
export const MATCHING_TOLERANCE_DAYS = 3; // Max difference in days for dates to be considered "close"
export const MATCHING_TOLERANCE_AMOUNT = 0.05; // Max absolute difference for amounts to be "close" (e.g., 5 cents)
export const MIN_REFERENCE_MATCH_LENGTH = 5; // Minimum length for a reference string to be considered for matching
