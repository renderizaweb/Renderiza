// Os campos de um modelo de contrato (os mesmos de src/modulos/contratos/logica.js, CAMPOS; o teste
// test/assistente-leitura.test.mjs confere que são iguais): a leitura de um contrato troca o que muda a cada cliente
// por eles. A função não importa de src/ (o pacote dela é só esta pasta).
export const CAMPOS_DO_CONTRATO = [
  { id: "cliente", nome: "Nome do cliente" },
  { id: "data", nome: "Data (31/10/2026)" },
  { id: "data_extenso", nome: "Data por extenso" },
  { id: "horario", nome: "Horário (19h às 3h)" },
  { id: "tipo", nome: "Tipo (festa ou ensaio)" },
  { id: "pacote", nome: "Pacote ou ensaio" },
  { id: "convidados", nome: "Convidados" },
  { id: "adicionais", nome: "Adicionais" },
  { id: "valor", nome: "Valor total" },
  { id: "sinal", nome: "Sinal" },
  { id: "desconto", nome: "Desconto" },
  { id: "endereco", nome: "Endereço do cliente" },
  { id: "cpf", nome: "CPF do cliente" },
  { id: "negocio", nome: "Nome do seu negócio" },
  { id: "hoje", nome: "Data de hoje" },
];
