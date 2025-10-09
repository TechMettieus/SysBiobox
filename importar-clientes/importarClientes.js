// importarClientesCJS.js
const XLSX = require("xlsx");
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importarClientes() {
  const filePath = "./Politica_Comercial.xlsx"; // evite acentos
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["Planilha1"];

  if (!sheet) {
    console.error("❌ Aba 'Planilha1' não encontrada no Excel!");
    return;
  }

  const data = XLSX.utils.sheet_to_json(sheet, { range: 2 });
  console.log(`📄 Linhas lidas: ${data.length}`);

  let count = 0;

  for (const row of data) {
    const razao = row["RAZÃO SOCIAL"];
    const email = row["EMAIL"];
    const cnpj = row["CNPJ"];
    const regiao = row["REGIÃO"];

    if (razao && cnpj) {
      await db.collection("clientes").add({
        razaoSocial: String(razao).trim(),
        email: email ? String(email).trim() : "",
        cnpj: String(cnpj).trim(),
        regiao: regiao ? String(regiao).trim() : "",
        criadoEm: new Date(),
      });
      count++;
    }
  }

  console.log(`✅ ${count} clientes importados com sucesso!`);
}

importarClientes().catch((err) => {
  console.error("❌ Erro ao importar clientes:", err);
});
