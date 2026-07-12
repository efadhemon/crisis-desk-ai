import fs from 'fs';
import { glob } from 'glob';

const pattern = '**/*.ts';
const ignore = ['node_modules/**', 'dist/**'];
const keywords = ['startTransaction', 'commitTransaction', 'rollbackTransaction'];

const files = await glob(pattern, { ignore });

const result = {};
const returnIssues = {};

/**
 * Remove strings and comments from a line to avoid false positives
 */
function removeStringsAndComments(line) {
  // Remove single-line comments
  let cleaned = line.replace(/\/\/.*$/, '');
  // Remove string literals (both single and double quotes, handling escapes)
  cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, '""');
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // Remove template literals (basic handling)
  cleaned = cleaned.replace(/`(?:[^`\\]|\\.)*`/g, '""');
  return cleaned;
}

/**
 * Count braces in a line (excluding those in strings/comments)
 */
function countBraces(line) {
  const cleaned = removeStringsAndComments(line);
  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  return { open: openBraces, close: closeBraces };
}

/**
 * Check if a line starts a new function scope (arrow function or regular function)
 */
function startsNewFunctionScope(line) {
  const cleaned = removeStringsAndComments(line);
  // Arrow function patterns: () => { or param => { or async () => { etc.
  // Also matches: .forEach(async (item) => {, asyncForEach(..., async (...) => {
  const arrowFunctionPattern = /=>\s*\{/;
  // Regular function patterns: function name() { or function() {
  // Also handles TypeScript return type annotations: function name(): Type {
  const regularFunctionPattern = /\bfunction\s*\w*\s*\([^)]*\)[^{]*\{/;
  // Method pattern: async methodName() { or methodName() {
  // Also handles TypeScript return type annotations: async methodName(): Type {
  const methodPattern = /\basync\s+\w+\s*\([^)]*\)[^{]*\{/;

  return (
    arrowFunctionPattern.test(cleaned) ||
    regularFunctionPattern.test(cleaned) ||
    methodPattern.test(cleaned)
  );
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  const isFileWithTransaction = lines.some((line) => {
    return keywords.some((keyword) => line.includes(`await ${keyword}`));
  });

  // Skip files that do not contain any transaction keywords
  if (!isFileWithTransaction) continue;

  const counts = {
    startTransaction: 0,
    commitTransaction: 0,
    rollbackTransaction: 0,
  };

  const transactionBlocks = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip lines that are fully commented
    if (trimmedLine.startsWith('//')) continue;

    for (const keyword of keywords) {
      // Use a regex to match the keyword with 'await'
      const regex = new RegExp(`\\bawait\\s+${keyword}\\b`);
      if (regex.test(trimmedLine)) {
        counts[keyword]++;

        if (keyword === 'startTransaction') {
          currentBlock = {
            startLine: i + 1,
            endLine: null,
            hasReturnBeforeCommit: false,
            returnLines: [],
            baseBraceDepth: null, // Will track the brace depth at transaction start
          };
        } else if (keyword === 'commitTransaction' && currentBlock) {
          currentBlock.endLine = i + 1;
          transactionBlocks.push(currentBlock);
          currentBlock = null;
        }
      }
    }
  }

  // Check for return statements between startTransaction and commitTransaction
  // Now with proper function scope tracking
  for (const block of transactionBlocks) {
    // First pass: calculate brace depth at the start of the transaction
    let baseBraceDepth = 0;
    for (let i = 0; i < block.startLine - 1; i++) {
      const line = lines[i];
      const braces = countBraces(line);
      baseBraceDepth += braces.open - braces.close;
    }
    block.baseBraceDepth = baseBraceDepth;

    // Second pass: track function scopes and find problematic returns
    let currentBraceDepth = baseBraceDepth;
    // Stack to track nested function scopes: each entry is the brace depth when entering a new function
    let functionScopeStack = [];

    for (let i = block.startLine - 1; i < block.endLine; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip comments
      if (
        trimmedLine.startsWith('//') ||
        trimmedLine.startsWith('/*') ||
        trimmedLine.startsWith('*')
      ) {
        continue;
      }

      // Check if this line starts a new function scope BEFORE counting braces
      if (startsNewFunctionScope(line)) {
        // The new function scope starts at the current depth + 1 (after the opening brace)
        const braces = countBraces(line);
        currentBraceDepth += braces.open;
        functionScopeStack.push(currentBraceDepth);
        currentBraceDepth -= braces.close;
        continue;
      }

      // Count braces for tracking depth
      const braces = countBraces(line);
      currentBraceDepth += braces.open;

      // Check for closing braces that exit function scopes
      for (let j = 0; j < braces.close; j++) {
        if (
          functionScopeStack.length > 0 &&
          currentBraceDepth - j === functionScopeStack[functionScopeStack.length - 1]
        ) {
          functionScopeStack.pop();
        }
      }
      currentBraceDepth -= braces.close;

      // Check for return statements
      if (/\breturn\b/.test(trimmedLine) && !trimmedLine.includes('await commitTransaction')) {
        // Skip if it's a same-line arrow function return (e.g., arr.map(x => { return x; }))
        if (/=>.*\breturn\b/.test(trimmedLine)) {
          continue;
        }

        // Only flag return if we're NOT inside a nested function scope
        // (functionScopeStack is empty means we're in the main method body)
        if (functionScopeStack.length === 0) {
          block.hasReturnBeforeCommit = true;
          block.returnLines.push({
            lineNumber: i + 1,
            content: trimmedLine,
          });
        }
      }
    }

    if (block.hasReturnBeforeCommit) {
      if (!returnIssues[file]) {
        returnIssues[file] = [];
      }
      returnIssues[file].push(block);
    }
  }

  result[file] = counts;
}

// Print results
// console.log('--- Transaction Keyword Counts (with await, ignoring comments) ---\n');

// for (const [file, counts] of Object.entries(result)) {
//   const { startTransaction, commitTransaction, rollbackTransaction } = counts;
//   console.log(`${file} → start: ${startTransaction}, commit: ${commitTransaction}, rollback: ${rollbackTransaction}`);
// }

// Detect files with mismatched counts

console.warn('\n--- Files with unmatched transaction flow ---\n');
let mismatchedCounts = 0;

if (Object.keys(result).length === 0) {
  console.log('✅ No files with transaction keywords found');
} else {
  for (const [file, counts] of Object.entries(result)) {
    const { startTransaction, commitTransaction, rollbackTransaction } = counts;

    if (startTransaction !== commitTransaction || startTransaction !== rollbackTransaction) {
      mismatchedCounts++;
      console.info(
        `⚠️ ${file} → start: ${startTransaction}, commit: ${commitTransaction}, rollback: ${rollbackTransaction}`,
      );
    }
  }
}

if (mismatchedCounts === 0) {
  console.log('✅ All files have matched transaction flow counts');
}

// Detect files with return statements between startTransaction and commitTransaction
console.warn(
  '\n--- Files with return statements between startTransaction and commitTransaction ---\n',
);

let hasIssues = false;

if (Object.keys(returnIssues).length === 0) {
  console.log('✅ No return statements found between startTransaction and commitTransaction');
} else {
  hasIssues = true;
  for (const [file, blocks] of Object.entries(returnIssues)) {
    console.error(`\n🔴 ${file}:`);
    for (const block of blocks) {
      console.error(`   Transaction block (lines ${block.startLine}-${block.endLine}):`);
      for (const returnInfo of block.returnLines) {
        console.error(`      Line ${returnInfo.lineNumber}: ${returnInfo.content}`);
      }
    }
  }
}

// Exit with error code if issues found
if (mismatchedCounts > 0 || hasIssues) {
  console.error('\n❌ Transaction check failed! Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('\n✅ All transaction checks passed!\n');
  process.exit(0);
}
