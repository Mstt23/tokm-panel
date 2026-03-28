import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = "c:\\Users\\Mesut\\Downloads\\student_list.xlsx";
const outputPath = path.join(__dirname, "..", "src", "data", "students.json");

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

if (!data.length) {
  console.error("Excel dosyası boş görünüyor.");
  process.exit(1);
}

const headers = data[0].map((h, i) => String(h ?? "").trim() || `col_${i}`);
const rows = data.slice(1).filter((row) => row.some((cell) => cell != null && String(cell).trim() !== ""));

const students = rows.map((row) => {
  const obj = {};
  headers.forEach((h, i) => {
    const val = row[i];
    obj[h] = val != null ? (typeof val === "number" ? String(val) : String(val).trim()) : "";
  });
  return obj;
});

const output = {
  öğrenciler: students
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
console.log(`${students.length} öğrenci ${outputPath} dosyasına aktarıldı.`);
console.log("Sütunlar:", headers.join(", "));
