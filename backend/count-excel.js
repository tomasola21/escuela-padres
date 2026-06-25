const XLSX = require('xlsx');
const wb = XLSX.readFile('C:\\Users\\Hp Core i7\\Downloads\\LISTAS 2026.xlsx');
const sheets = ['1','2','3','4','5','6','1ro','2do','3ro','4to','5to'];
let total = 0;
for (const sn of sheets) {
  const ws = wb.Sheets[sn];
  const data = XLSX.utils.sheet_to_json(ws, {header: 1});
  let count = 0, cur = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const hdr = row && row[1] ? String(row[1]).trim() : '';
    if (hdr && hdr.includes('"')) { if (cur > 0) count += cur; cur = 0; continue; }
    if (!row || !row[1]) continue;
    const n = String(row[1]).trim();
    if (!n) continue;
    cur++;
  }
  if (cur > 0) count += cur;
  console.log(sn + ': ' + count);
  total += count;
}
console.log('TOTAL: ' + total);
