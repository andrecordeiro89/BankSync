# BankSync 🚀

**Aplicação web para conciliação bancária inteligente, utilizando Inteligência Artificial para extração, análise e reconciliação de dados financeiros.**

---

## ✨ Funcionalidades Principais

- 📂 **Upload de Documentos**
  - Suporte a extratos bancários (PDF, CSV, OFX) e registros internos (CSV, Excel, PDF).
  - Upload múltiplo e interface intuitiva para seleção e gerenciamento de arquivos.

- 🤖 **Extração Automática com IA (Google Gemini)**
  - Utiliza o modelo Gemini da Google para extrair dados financeiros de documentos, tanto em texto quanto em imagem.
  - Realiza OCR preciso em imagens e estrutura os dados em JSON, identificando datas, descrições, valores, referências, contas e centros de custo.
  - Normaliza e valida os dados extraídos, identificando possíveis erros de parsing.

- 🔄 **Conciliação Bancária Inteligente**
  - Algoritmo de matching automático entre transações bancárias e lançamentos internos.
  - Identificação de itens conciliados, divergências (valores, datas, referências, descrições) e pendências.
  - Interface visual para revisão, edição e confirmação dos matches sugeridos pela IA.

- 📊 **Resumo e Relatórios**
  - Geração de resumo da conciliação: totais, valores, divergências e pendências.
  - Download de relatório em PDF detalhado, com seções para itens conciliados, divergentes e pendentes.
  - Relatório inclui disclaimer sobre o uso de IA e recomenda validação manual.

- 🕓 **Histórico de Conciliações**
  - Armazena sessões anteriores de conciliação no navegador para consulta futura (em desenvolvimento).

---

## 🛠️ Tecnologias e Ferramentas

- **Frontend:** React + TypeScript + Vite ⚛️
- **IA:** Google Gemini (via @google/genai) 🤖
- **PDF:** jsPDF + jsPDF-AutoTable 📄
- **Outros:** LocalStorage para histórico, interface responsiva e moderna 💻

---

## 🤖 Como Funciona a IA no BankSync

- Ao fazer upload de um documento, o BankSync utiliza o serviço Gemini da Google para:
  - 🖼️ Realizar OCR (caso o documento seja imagem/PDF).
  - 📝 Extrair e estruturar todas as transações encontradas, seguindo regras rígidas de formatação e validação.
  - 📦 Retornar os dados em formato JSON, prontos para conciliação automática.

- O modelo Gemini é configurado para:
  - 🔒 Baixa temperatura (respostas factuais e consistentes).
  - 🏷️ Extração de campos essenciais: data, descrição, valor, tipo (débito/crédito), referência, saldo, conta, centro de custo.
  - ⚠️ Identificação e reporte de erros de parsing.

---

## 🧭 Fluxo de Uso

1. **Upload dos arquivos** (extrato bancário e/ou registros internos) 📂
2. **Processamento automático com IA** para extração dos dados 🤖
3. **Visualização dos dados extraídos** e início da conciliação 👀
4. **Revisão dos matches sugeridos**, edição manual e marcação de divergências 📝
5. **Geração de relatório PDF** com todos os resultados 📄
6. **Consulta ao histórico** de conciliações (em desenvolvimento) 🕓

---

## ⚙️ Como Rodar Localmente

```bash
# Pré-requisitos: Node.js instalado

# 1. Instale as dependências
npm install

# 2. Configure a variável de ambiente com sua chave Gemini
# Crie um arquivo .env.local e adicione:
GEMINI_API_KEY=SuaChaveAqui

# 3. Rode o app
npm run dev
```

---

## ℹ️ Observações

- Para uso da IA Gemini, é necessário configurar a variável de ambiente `GEMINI_API_KEY`.
- O sistema foi projetado para máxima flexibilidade e precisão, mas recomenda-se sempre a revisão manual dos resultados.
- O relatório PDF gerado inclui um aviso sobre a necessidade de validação humana.
- Projeto em constante evolução! Novas funcionalidades e melhorias estão a caminho. 🚧
