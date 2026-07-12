import { exec } from 'child_process';

// Get the migration name from the command line arguments
let migrationName = process.argv[2];

if (!migrationName) {
  migrationName = 'schema-update';
  console.info('\nNo migration name provided. Using default name: schema-update\n');
}

// Build the command
const command = `yarn typeorm migration:create ./src/database/migrations/${migrationName}`;

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
  }

  let geneRatedMigration: string;

  const lines = stdout.split('\n');
  lines.forEach((line, index) => {
    // Get the generated migration name
    if (!error && line.includes(`${migrationName}.ts`)) {
      const parts = line.split(' ');
      geneRatedMigration = parts.find((x) => x.includes(`${migrationName}.ts`));
      geneRatedMigration = geneRatedMigration?.replace(/\x1B\[\d+m/g, ''); // Remove ANSI escape codes
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

  // Format the generated migration
  if (geneRatedMigration) {
    exec(`yarn prettier --write ${geneRatedMigration}`, (err) => {
      if (err) {
        console.error(`Error To Format: ${err.message}`);
      } else {
        console.info(`Formatting migration: ${geneRatedMigration}\n`);
      }
    });
  }
});
