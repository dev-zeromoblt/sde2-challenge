#!/usr/bin/env node
/**
 * Parses vitest JSON output and computes the challenge score.
 * Writes score-output.json with { score, markdown }.
 */
const fs = require('fs');

// ─── Config ──────────────────────────────────────────────────────────────────

const POINTS = {
  BUG:  3,   // 8 tests × 3  = 24 pts
  FEAT: 3,   // 8 tests × 3  = 24 pts
  EDGE: 4,   // 5 tests × 4  = 20 pts (max 5 counted)
  REG:  2,   // 5 tests × 2  = 10 pts
};
const MAX = { BUG: 24, FEAT: 24, EDGE: 20, REG: 10 };
const SUBMISSION_PTS = 5;
const MANUAL_PTS = 17;

// ─── Parse results ───────────────────────────────────────────────────────────

let raw;
try {
  raw = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
} catch {
  console.error('test-results.json not found or invalid — defaulting to 0 scores');
  raw = { testResults: [] };
}

const passed = { BUG: 0, FEAT: 0, EDGE: 0, REG: 0 };
const total  = { BUG: 0, FEAT: 0, EDGE: 0, REG: 0 };
let edgeTestsWritten = 0;

// vitest --reporter=json produces { testResults: [ { assertionResults: [...] } ] }
for (const suite of (raw.testResults ?? [])) {
  const isEdgeFile = (suite.testFilePath ?? '').includes('edge-cases');
  for (const t of (suite.assertionResults ?? [])) {
    const tag = (['BUG', 'FEAT', 'EDGE', 'REG'].find(tag =>
      (t.ancestorTitles?.[0] ?? '').startsWith(`[${tag}]`)
    )) ?? (isEdgeFile ? 'EDGE' : null);

    if (!tag) continue;

    total[tag]++;
    if (tag === 'EDGE') edgeTestsWritten++;
    if (t.status === 'passed') passed[tag]++;
  }
}

// ─── Compute scores ──────────────────────────────────────────────────────────

// Edge: cap at 5 tests for scoring purposes
const edgeCounted  = Math.min(edgeTestsWritten, 5);
const edgePassedCapped = Math.min(passed.EDGE, 5);

const scores = {
  BUG:  Math.round(Math.min(passed.BUG  * POINTS.BUG,  MAX.BUG)),
  FEAT: Math.round(Math.min(passed.FEAT * POINTS.FEAT, MAX.FEAT)),
  EDGE: Math.round(edgePassedCapped * POINTS.EDGE),
  REG:  Math.round(Math.min(passed.REG  * POINTS.REG,  MAX.REG)),
};

// Check SUBMISSION.md is non-empty and modified
let submissionFilled = false;
try {
  const sub = fs.readFileSync('SUBMISSION.md', 'utf8');
  submissionFilled = sub.includes('<!-- fill') === false && sub.trim().length > 200;
} catch { /* ignore */ }

const autoTotal = scores.BUG + scores.FEAT + scores.EDGE + scores.REG + (submissionFilled ? SUBMISSION_PTS : 0);
const grandTotal = autoTotal; // manual 17pts added by reviewer

// ─── Build markdown ──────────────────────────────────────────────────────────

function bar(score, max) {
  const filled = Math.round((score / max) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

const md = `## 🤖 Automated Score: ${autoTotal}/83

> The remaining **17 points** are awarded manually by the hiring team (code quality, commit history, edge case choices).

| Category | Score | Max | Progress | Detail |
|---|---|---|---|---|
| Bug fixes | ${scores.BUG} | 24 | \`${bar(scores.BUG, 24)}\` | ${passed.BUG}/${total.BUG} tests passing |
| Feature implementation | ${scores.FEAT} | 24 | \`${bar(scores.FEAT, 24)}\` | ${passed.FEAT}/${total.FEAT} tests passing |
| Edge case tests | ${scores.EDGE} | 20 | \`${bar(scores.EDGE, 20)}\` | ${edgeTestsWritten} written, ${passed.EDGE} passing (max 5 scored) |
| No regressions | ${scores.REG} | 10 | \`${bar(scores.REG, 10)}\` | ${passed.REG}/${total.REG} originally-passing tests intact |
| SUBMISSION.md | ${submissionFilled ? SUBMISSION_PTS : 0} | 5 | \`${bar(submissionFilled ? 5 : 0, 5)}\` | ${submissionFilled ? 'Completed ✅' : 'Not filled in ❌'} |

**Next step**: A member of the hiring team will review your code and add up to 17 more points based on code quality, commit history, and the edge cases you chose to cover.

---
*Scores update automatically on each push.*`;

// ─── Write output ─────────────────────────────────────────────────────────────

fs.writeFileSync('score-output.json', JSON.stringify({ score: autoTotal, markdown: md }, null, 2));
console.log(`Score: ${autoTotal}/83 (automated)`);
console.log(`Bug: ${scores.BUG}/24, Feat: ${scores.FEAT}/24, Edge: ${scores.EDGE}/20, Reg: ${scores.REG}/10, Submission: ${submissionFilled ? SUBMISSION_PTS : 0}/5`);
