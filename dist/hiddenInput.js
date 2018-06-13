"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl._writeToOutput = function _writeToOutput(stringToWrite) {
    rl.output.write(`\x1B[2K\x1B[200D${rl.query}${(rl.line.length % 2 == 1) ? "□" : "■"}`);
};
function default_1(prompt) {
    rl.query = prompt || "Input: ";
    return new Promise((res, rej) => {
        rl.question(rl.query, (passwd) => {
            rl.output.write('\n');
            rl.close();
            res(passwd);
        });
    });
}
exports.default = default_1;
;
