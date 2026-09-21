
const fs = require("fs");
const ts = require("typescript");

const code = fs.readFileSync("App.tsx", "utf8");
const sourceFile = ts.createSourceFile("App.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function reportDiagnostics(diagnostics) {
  diagnostics.forEach(diagnostic => {
    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    console.log(`${line + 1}:${character + 1} - ${message}`);
  });
}

const result = ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
});

const program = ts.createProgram(["App.tsx"], { jsx: ts.JsxEmit.React });
const syntaxDiagnostics = program.getSyntacticDiagnostics();
reportDiagnostics(syntaxDiagnostics);
