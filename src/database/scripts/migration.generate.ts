import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { getIgnoredMigrationTokens } from '../decorators/ignoredColumn.decorator';

const execAsync = promisify(exec);

let migrationName = process.argv[2];

if (!migrationName) {
  migrationName = 'schema-update';
  console.info('\nNo migration name provided. Using default name: schema-update\n');
}

const command = `yarn typeorm migration:generate ./src/database/migrations/${migrationName} -d ./src/database/data-source.ts`;

function findEntityFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'migrations') {
        continue;
      }
      results.push(...findEntityFiles(full));
    } else if (entry.name.endsWith('.entity.ts')) {
      results.push(full);
    }
  }
  return results;
}

/** Load entity modules so `@IgnoredColumn` registrations are available. */
async function loadEntityModules(): Promise<void> {
  const srcRoot = path.join(__dirname, '../..');
  await Promise.all(findEntityFiles(srcRoot).map((file) => import(file)));
}

/**
 * Remove `queryRunner.query(...)` calls whose SQL mentions an ignored column/index.
 * TypeORM treats virtual-property columns as absent and will emit DROP COLUMN/INDEX.
 */
function stripIgnoredQueries(
  source: string,
  tokens: string[],
): { source: string; removed: number } {
  if (tokens.length === 0) return { source, removed: 0 };

  const queryCall = /[ \t]*await queryRunner\.query\(\s*`[\s\S]*?`\s*(?:,\s*[\s\S]*?)?\);?\r?\n?/g;

  let removed = 0;
  const next = source.replace(queryCall, (match) => {
    const haystack = match.toLowerCase();
    const hit = tokens.some((token) => haystack.includes(token.toLowerCase()));
    if (hit) {
      removed += 1;
      return '';
    }
    return match;
  });

  return { source: next, removed };
}

function hasQueryCalls(source: string): boolean {
  return /await queryRunner\.query\(/.test(source);
}

async function stripAndFormatMigration(migrationPath: string): Promise<void> {
  await loadEntityModules();
  const tokens = getIgnoredMigrationTokens();

  let content = fs.readFileSync(migrationPath, 'utf8');
  const { source, removed } = stripIgnoredQueries(content, tokens);
  content = source;

  if (removed > 0) {
    console.info(
      `Stripped ${removed} query(ies) for @IgnoredColumn tokens: ${tokens.join(', ') || '(none)'}`,
    );
  }

  if (!hasQueryCalls(content)) {
    fs.unlinkSync(migrationPath);
    console.info(
      `\nNo schema changes left after stripping @IgnoredColumn diffs. Deleted: ${migrationPath}\n`,
    );
    return;
  }

  fs.writeFileSync(migrationPath, content, 'utf8');

  try {
    await execAsync(`yarn prettier --write ${migrationPath}`);
    console.info(`Formatting migration: ${migrationPath}\n`);
  } catch (err) {
    console.error(`Error To Format: ${(err as Error).message}`);
  }
}

exec(command, async (error, stdout, stderr) => {
  let geneRatedMigration: string | undefined;

  const lines = stdout.split('\n');
  lines.forEach((line, index) => {
    if (!error && line.includes(`${migrationName}.ts`)) {
      const parts = line.split(' ');
      geneRatedMigration = parts.find((x) => x.includes(`${migrationName}.ts`));
      geneRatedMigration = geneRatedMigration?.replace(/\x1B\[\d+m/g, '');
    }

    if (index === 0) {
      console.info('\x1b[90m%s\x1b[0m', line);
    } else if (index === 1) {
      if (error) console.warn(line);
      else console.info('\x1b[32m%s\x1b[0m', line);
    } else {
      console.info(line);
    }
  });

  if (stderr) {
    console.error(stderr);
  }

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (geneRatedMigration) {
    await stripAndFormatMigration(geneRatedMigration);
  }
});
