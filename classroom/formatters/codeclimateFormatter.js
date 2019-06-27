//#!/usr/bin/env node
const crypto = require('crypto');

let inputChunks = [];
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  inputChunks.push(chunk);
});

process.stdin.on('end', () => {
  let errors = []
  inputChunks.map(chunk => {
    if (chunk.trim()) {
      let failures = JSON.parse(chunk);
      failures.map(
        (failure) =>
          errors.push({
            "type": "issue",
            check_name: failure.ruleName,
            description: failure.failure,
            categories: ["Style"],
            fingerprint: crypto.createHash('md5').update(JSON.stringify(failure)).digest('hex'),
            severity: failure.ruleSeverity==='ERROR'?'major':'minor',
            location: {
              path: failure.name,
              lines: {
                begin: failure.startPosition.line,
                end: failure.endPosition.line
              }
            }
          }))
    }
  });
  process.stdout.write(JSON.stringify(errors));
});
