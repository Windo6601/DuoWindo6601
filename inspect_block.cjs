const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');

// Line 7477 starts ) : (
// Let's print lines 7477 to 7520
console.log(lines.slice(7476, 7520).join('\n'));
