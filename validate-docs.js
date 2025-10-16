const fs = require("fs");
const path = require("path");
const https = require("https");

// Lê todos os arquivos .yaml em /services
const servicesDir = path.join(__dirname, "services");
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));
const serviceNames = serviceFiles.map(f => f.replace(/\.ya?ml$/, ""));

// Lê o docs.md
const docsContent = fs.readFileSync(path.join(__dirname, "docs.md"), "utf8");

// Extrai linhas de tabela Markdown
const tableRows = docsContent.split("\n").filter(line => /^\|/.test(line));

// Extrai pares (nome, link)
const entries = tableRows
  .map(line => line.split("|").map(s => s.trim()))
  .filter(cols => cols.length >= 3)
  .map(cols => ({ name: cols[1], link: cols[2] }));

let hasError = false;

// 1️⃣ Checar se cada serviço tem entrada
for (const service of serviceNames) {
  if (!entries.some(e => e.name === service)) {
    console.error(`❌ Serviço "${service}" não tem entrada no docs.md`);
    hasError = true;
  }
}

// 2️⃣ Checar se links são válidos (HTTP 200)
async function checkLink(link) {
  return new Promise(resolve => {
    https
      .get(link, res => resolve(res.statusCode))
      .on("error", () => resolve(null));
  });
}

(async () => {
  for (const { name, link } of entries) {
    const status = await checkLink(link);
    if (status !== 200) {
      console.error(`❌ Link inválido para "${name}": ${link} (status: ${status})`);
      hasError = true;
    } else {
      console.log(`✅ ${name} → ${link}`);
    }
  }

  if (hasError) {
    console.error("❌ Validação falhou.");
    process.exit(1);
  } else {
    console.log("✅ Tudo certo com as documentações!");
  }
})();
