#!/usr/bin/env node --no-warnings

const program = require('commander');
const chalk = require('chalk')
const { encryptDir, decryptDir } = require('./encodeDir');

program
  .version('0.0.1')
  .description('Lockdown File Valut System');

program
  .command('encrypt <directory> <password>')
  .alias('e')
  .description('AES256-Auth encrypts directory (or file) with password')
  .action((directory, password) => {
    encryptDir(directory, password);
  });

program
  .command('decrypt <directory> <password>')
  .alias('d')
  .description('Decrypts directory (or file) with password.')
  .action((directory, password) => {
    decryptDir(directory, password);
  });

program.on('command:*', function () {
  console.error(chalk.red.bold(`  Invalid command: ${program.args.join(' ')}`));
  program.outputHelp();
  process.exit(1);
});

if (!process.argv.slice(2).length) {
  program.outputHelp();
}else{
  program.parse(process.argv);
}
