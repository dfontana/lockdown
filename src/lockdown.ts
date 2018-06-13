#!/usr/bin/env node --no-warnings

import * as program from 'commander'
import prompt from './hiddenInput'
import chalk from 'chalk'
import { encryptDir, decryptDir } from './encodeDir'

program
  .version('0.0.1')
  .description('Lockdown File Vault System');

program
  .command('encrypt <directory>')
  .alias('e')
  .option('-p, --passwd <passwd>', 'Debug usage only.')
  .description('AES256-Auth encrypts directory (or file)')
  .action((directory, options) => {
    if(options.passwd) {
      encryptDir(directory, options.passwd);
    } else {
      prompt("   Password: ")
      .then(ans => {
        encryptDir(directory, ans);
      })
    }
  });

program
  .command('decrypt <directory>')
  .alias('d')
  .option('-p, --passwd <passwd>', 'Debug usage only.')
  .description('Decrypts directory (or file)')
  .action((directory, options) => {
    if(options.passwd) {
      decryptDir(directory, options.passwd);
    } else {
      prompt("   Password: ")
      .then(ans => {
        decryptDir(directory, ans);
      })
    }
  });

program.on('command:*', function () {
  console.error(chalk.red.bold(`  Invalid command: ${program.args.join(' ')}`));
  program.outputHelp();
  process.exit(1);
});

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}else{
  program.parse(process.argv);
}
