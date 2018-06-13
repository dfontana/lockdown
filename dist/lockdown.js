#!/usr/bin/env node --no-warnings
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const hiddenInput_1 = require("./hiddenInput");
const chalk_1 = require("chalk");
const encodeDir_1 = require("./encodeDir");
program
    .version('0.0.1')
    .description('Lockdown File Vault System');
program
    .command('encrypt <directory>')
    .alias('e')
    .option('-p, --passwd <passwd>', 'Debug usage only.')
    .description('AES256-Auth encrypts directory (or file)')
    .action((directory, options) => {
    if (options.passwd) {
        encodeDir_1.encryptDir(directory, options.passwd);
    }
    else {
        hiddenInput_1.default("   Password: ")
            .then(ans => {
            encodeDir_1.encryptDir(directory, ans);
        });
    }
});
program
    .command('decrypt <directory>')
    .alias('d')
    .option('-p, --passwd <passwd>', 'Debug usage only.')
    .description('Decrypts directory (or file)')
    .action((directory, options) => {
    if (options.passwd) {
        encodeDir_1.decryptDir(directory, options.passwd);
    }
    else {
        hiddenInput_1.default("   Password: ")
            .then(ans => {
            encodeDir_1.decryptDir(directory, ans);
        });
    }
});
program.on('command:*', function () {
    console.error(chalk_1.default.red.bold(`  Invalid command: ${program.args.join(' ')}`));
    program.outputHelp();
    process.exit(1);
});
if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
}
else {
    program.parse(process.argv);
}
