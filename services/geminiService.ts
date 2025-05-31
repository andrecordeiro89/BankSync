import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Content } from "@google/genai";
import { ExtractedFinancialData, BankTransaction, LedgerEntry, ReconciliationFileType } from '../types';
import { GEMINI_MODEL_TEXT, SAMPLE_BANK_STATEMENT_TEXT, SAMPLE_INTERNAL_LEDGER_TEXT } from '../constants';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY for Gemini is not set in environment variables. AI processing will fail.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY_FOR_INITIALIZATION" });

const SHARED_FINANCIAL_JSON_RULES = `
1.  SUA RESPOSTA DEVE SER EXCLUSIVAMENTE UM ÚNICO OBJETO JSON VÁLIDO.
2.  NÃO inclua NENHUM texto explicativo, introdução, observação, ou markdown (como \`\`\`json). O JSON deve começar com '{' e terminar com '}'.
3.  Se um campo textual (descrição, referência, etc.) não for encontrado, use o valor JSON \`null\`. NÃO use strings vazias.
4.  Datas: Formate TODAS as datas como "DD/MM/AAAA". Se o ano for de dois dígitos, infira o ano completo. Se não puder determinar, use \`null\`.
5.  Valores (amount): Devem ser NÚMEROS JSON. Para extratos bancários, valores de débito devem ser NEGATIVOS, e créditos POSITIVOS. Para registros internos, os valores geralmente são positivos representando a magnitude da transação. Se um valor não puder ser determinado, use \`null\`. Remova símbolos de moeda e use ponto (.) como separador decimal.
6.  Descrições: Capture a descrição mais completa e relevante da transação.
7.  Referências: Extraia números de documento, cheque, fatura, ou outros códigos de referência associados à transação.
8.  Se nenhuma transação for encontrada, o array correspondente (bankTransactions ou ledgerEntries) deve ser vazio: [].
9.  Evite duplicar transações. Cada linha ou entrada distinta no documento deve gerar uma única transação no JSON.
10. O campo 'id' para cada transação será gerado pelo sistema posteriormente, não precisa incluí-lo.
11. JSON Syntax: Siga rigorosamente as regras de sintaxe JSON (aspas duplas, vírgulas, etc.). Garanta que aspas duplas dentro de strings sejam escapadas (ex: "Pagamento \\"Fornecedor X\\"").
`;

const BANK_STATEMENT_JSON_STRUCTURE = `
"bankTransactions": [
  {
    "date": "DD/MM/AAAA_ou_null",
    "description": "string_completa_da_descrição",
    "amount": numero_decimal_ou_null, // NEGATIVO para débitos, POSITIVO para créditos
    "type": "debit_ou_credit_ou_unknown", // Inferir 'debit' ou 'credit' pelo valor ou palavras-chave
    "reference": "string_referencia_ou_null", // Nº do documento, cheque, etc.
    "balanceAfter": numero_decimal_ou_null // Saldo após a transação, se disponível
  }
]
`;

const INTERNAL_LEDGER_JSON_STRUCTURE = `
"ledgerEntries": [
  {
    "date": "DD/MM/AAAA_ou_null",
    "description": "string_completa_da_descrição",
    "amount": numero_decimal_ou_null, // Geralmente positivo
    "reference": "string_referencia_ou_null", // Nº da NF, pedido, ID interno
    "accountCode": "string_codigo_conta_ou_null",
    "costCenter": "string_centro_custo_ou_null"
  }
]
`;

const PROMPT_TEMPLATE_FINANCIAL_EXTRACTION = `
Você é um assistente de IA especializado em extrair dados financeiros de documentos para conciliação bancária.
Analise a IMAGEM ou o TEXTO fornecido do documento ({{DOCUMENT_TYPE_DESCRIPTION}}).

TAREFA PRINCIPAL:
1.  OCR PRECISO (se imagem): Extraia TODO o texto visível da IMAGEM com ALTA PRECISÃO, especialmente para datas, descrições, valores numéricos e referências. Diferencie caracteres ambíguos (0/O, 1/l, 5/S).
2.  ESTRUTURAR DADOS EM JSON: Com base no texto obtido (da imagem ou fornecido), crie um objeto JSON.

REGRAS ESTRITAS PARA A SAÍDA JSON:
${SHARED_FINANCIAL_JSON_RULES}

A ESTRUTURA EXATA DO OBJETO JSON DEVE SER:
{
  {{JSON_STRUCTURE_PLACEHOLDER}},
  "parseErrors": ["string_erro_1_ou_null", "string_erro_2_ou_null"] // Liste quaisquer problemas de parsing ou dados faltantes que você encontrar. Se tudo OK, use array vazio [].
}

{{USER_PROVIDED_TEXT_BLOCK_PLACEHOLDER}}

JSON Output:
`;


export async function extractFinancialTransactions(
  fileType: ReconciliationFileType,
  documentText?: string,
  imageBase64?: string,
  imageMimeType?: string,
  supplementaryUserText?: string // Not typically used for financial docs but kept for consistency
): Promise<ExtractedFinancialData> {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  if (!documentText && !imageBase64) {
    throw new Error("Nenhum documento (texto ou imagem) fornecido para processamento.");
  }

  let requestPayloadContents: string | Content;
  const modelConfig: GenerateContentParameters['config'] = {
      temperature: 0.05, // Low temperature for factual extraction
      topP: 0.95,
      topK: 10, // Adjusted topK for potentially more variability in financial docs
      // responseMimeType: "application/json", // Keep this disabled if prompt contains complex instructions and image. Will parse manually.
  };
  
  let finalPrompt: string;
  const documentTypeDescription = fileType === ReconciliationFileType.BankStatement ? "Extrato Bancário" : "Registro Interno da Empresa";
  const jsonStructure = fileType === ReconciliationFileType.BankStatement ? BANK_STATEMENT_JSON_STRUCTURE : INTERNAL_LEDGER_JSON_STRUCTURE;

  finalPrompt = PROMPT_TEMPLATE_FINANCIAL_EXTRACTION
    .replace("{{DOCUMENT_TYPE_DESCRIPTION}}", documentTypeDescription)
    .replace("{{JSON_STRUCTURE_PLACEHOLDER}}", jsonStructure);

  let userTextBlockContent = "";
  if (supplementaryUserText && supplementaryUserText.trim() !== "") {
    userTextBlockContent = `
  INFORMAÇÃO ADICIONAL DO USUÁRIO (considere como contexto secundário):
  ---
  ${supplementaryUserText.trim()}
  ---`;
  }
  finalPrompt = finalPrompt.replace("{{USER_PROVIDED_TEXT_BLOCK_PLACEHOLDER}}", userTextBlockContent);


  if (imageBase64 && imageMimeType) {
    const imagePart = { inlineData: { mimeType: imageMimeType, data: imageBase64 } };
    requestPayloadContents = { parts: [imagePart, { text: finalPrompt }] };
    modelConfig.temperature = 0.15; // Slightly higher for OCR variability
  } else if (documentText) {
    // If text is provided (e.g. from CSV, OFX parsing, or user copy-paste)
    // Add the document text into the prompt explicitly
    finalPrompt += `\n\nCONTEÚDO DO DOCUMENTO PARA ANÁLISE:\n---\n${documentText}\n---`;
    requestPayloadContents = finalPrompt;
    modelConfig.responseMimeType = "application/json"; // Can try to enforce if only text
  } else {
    throw new Error("Dados insuficientes para processamento.");
  }

  let rawResponseText = "";
  let jsonStrToParse = "";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: requestPayloadContents,
        config: modelConfig
    });

    rawResponseText = response.text ?? "";
    jsonStrToParse = rawResponseText.trim();

    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStrToParse.match(fenceRegex);
    if (match && match[2]) {
      jsonStrToParse = match[2].trim();
    }

    if (!jsonStrToParse.startsWith('{') || !jsonStrToParse.endsWith('}')) {
        const firstBrace = jsonStrToParse.indexOf('{');
        const lastBrace = jsonStrToParse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStrToParse = jsonStrToParse.substring(firstBrace, lastBrace + 1);
        } else if (jsonStrToParse === "") {
             console.warn("Gemini response was empty. Raw response:", rawResponseText);
             return { parseErrors: ["Resposta da IA vazia."] };
        } else {
            console.error("Gemini response is not a JSON object after cleaning. Raw response:", rawResponseText, "Attempted parse:", jsonStrToParse);
            throw new Error("Resposta da IA não está no formato JSON esperado.");
        }
    }
    
    const parsedJson = JSON.parse(jsonStrToParse) as Partial<ExtractedFinancialData>;

    // Normalize data
    const normalizedData: ExtractedFinancialData = {
        bankTransactions: parsedJson.bankTransactions?.map((t: Partial<BankTransaction>, index: number) => ({
            id: `bs-temp-${Date.now()}-${index}`, // Temporary ID
            date: t.date || null,
            description: t.description || "Descrição Ausente",
            amount: typeof t.amount === 'number' ? t.amount : null,
            type: t.type || (typeof t.amount === 'number' ? (t.amount < 0 ? 'debit' : 'credit') : 'unknown'),
            reference: t.reference || null,
            balanceAfter: typeof t.balanceAfter === 'number' ? t.balanceAfter : null,
            sourceDocumentId: '', // Will be filled by caller
        })) || [],
        ledgerEntries: parsedJson.ledgerEntries?.map((e: Partial<LedgerEntry>, index: number) => ({
            id: `le-temp-${Date.now()}-${index}`, // Temporary ID
            date: e.date || null,
            description: e.description || "Descrição Ausente",
            amount: typeof e.amount === 'number' ? e.amount : null,
            reference: e.reference || null,
            accountCode: e.accountCode || null,
            costCenter: e.costCenter || null,
            sourceDocumentId: '', // Will be filled by caller
        })) || [],
        parseErrors: parsedJson.parseErrors || []
    };
    
    if (normalizedData.bankTransactions?.length === 0 && normalizedData.ledgerEntries?.length === 0 && (!normalizedData.parseErrors || normalizedData.parseErrors.length === 0)) {
        normalizedData.parseErrors = ["Nenhuma transação ou lançamento foi extraído do documento."];
    }


    return normalizedData;

  } catch (error) {
    const requestPromptForLogging = typeof requestPayloadContents === 'string'
        ? requestPayloadContents
        : (requestPayloadContents as Content).parts.map(p => (p as {text: string}).text || "[image_part]").join("\n");

    console.error(
        "Error calling Gemini API or parsing financial response. FileType:", fileType,
        "Raw AI Response Text:", rawResponseText,
        "Attempted to parse:", jsonStrToParse,
        "Request Prompt Snippet:", requestPromptForLogging.substring(0, 800) // Increased snippet length for financial prompts
    );
    let errorMessage = "Falha ao comunicar com o serviço de IA ou processar a resposta financeira.";
    if (error instanceof Error) {
        errorMessage += ` Detalhes: ${error.message}. Resposta da IA (início): ${rawResponseText.substring(0,100)}`;
    }
    throw new Error(errorMessage);
  }
}

// Helper function to get sample data for testing UI without API calls
export function getSampleExtractedData(fileType: ReconciliationFileType, docId: string): ExtractedFinancialData {
    if (fileType === ReconciliationFileType.BankStatement) {
        return {
            bankTransactions: [
                { id: `bs-sample-1-${docId}`, date: "02/10/2023", description: "SAQUE ATM", amount: -100.00, type: 'debit', reference: "001001", balanceAfter: 10900.00, sourceDocumentId: docId },
                { id: `bs-sample-2-${docId}`, date: "03/10/2023", description: "DEP DINHEIRO", amount: 500.00, type: 'credit', reference: "001002", balanceAfter: 11400.00, sourceDocumentId: docId },
                { id: `bs-sample-3-${docId}`, date: "05/10/2023", description: "PAG FORNECEDOR XPTO", amount: -1250.75, type: 'debit', reference: "159753", balanceAfter: 10149.25, sourceDocumentId: docId },
            ],
            parseErrors: []
        };
    } else { // InternalLedger
        return {
            ledgerEntries: [
                { id: `le-sample-1-${docId}`, date: "03/10/2023", description: "Depósito em espécie na Tesouraria", amount: 500.00, reference: "DEP001", accountCode: "1.1.01", costCenter: "FINANCEIRO", sourceDocumentId: docId },
                { id: `le-sample-2-${docId}`, date: "05/10/2023", description: "Pagamento NF 301 - Fornecedor XPTO", amount: 1250.75, reference: "NF301", accountCode: "2.1.02", costCenter: "COMPRAS", sourceDocumentId: docId },
            ],
            parseErrors: []
        };
    }
}
