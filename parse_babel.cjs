const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('App.tsx', 'utf8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  console.log("PARSED SUCCESSFULLY!");
} catch (err) {
  console.log("PARSE ERROR:", err.message, "at line", err.loc);
}
