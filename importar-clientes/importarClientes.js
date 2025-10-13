// importarClientes.js
const XLSX = require("xlsx");
const admin = require("firebase-admin");
const fs = require("fs");

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importarClientes() {
  try {
    const filePath = "./Politica_Comercial.xlsx";
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Planilha1"];

    if (!sheet) {
      console.error("❌ Aba 'Planilha1' não encontrada!");
      return;
    }

    // Ler dados a partir da linha 3 (índice 2)
    const data = XLSX.utils.sheet_to_json(sheet, { range: 2 });
    console.log(`📄 Total de linhas: ${data.length}`);

    let importados = 0;
    let erros = 0;

    // Processar em lotes para melhor performance
    const batch = db.batch();
    
    for (const row of data) {
      const cnpj = row["CNPJ"];
      const regiao = row["REGIÃO"];
      const nome = row["RAZÃO SOCIAL"];
      const email = row["EMAIL"];

      // Validar campos obrigatórios
      if (!cnpj || !nome) {
        console.warn(`⚠️ Linha ignorada - CNPJ ou Nome faltando`);
        erros++;
        continue;
      }

      // Criar documento
      const docRef = db.collection("clientes").doc();
      batch.set(docRef, {
        cnpj: String(cnpj).trim(),
        regiao: regiao ? String(regiao).trim() : "",
        nome: String(nome).trim(),
        email: email ? String(email).trim() : "",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });

      importados++;

      // Commit a cada 500 documentos (limite do Firestore)
      if (importados % 500 === 0) {
        await batch.commit();
        console.log(`✅ ${importados} clientes processados...`);
      }
    }

    // Commit final
    if (importados % 500 !== 0) {
      await batch.commit();
    }

    console.log(`\n🎉 Importação concluída!`);
    console.log(`✅ ${importados} clientes importados`);
    console.log(`⚠️ ${erros} linhas com erro`);

  } catch (error) {
    console.error("❌ Erro na importação:", error);
  } finally {
    process.exit();
  }
}

// Executar
importarClientes();