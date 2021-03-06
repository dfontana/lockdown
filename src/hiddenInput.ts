const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl._writeToOutput = function _writeToOutput(stringToWrite: string): void {
  rl.output.write(`\x1B[2K\x1B[200D${rl.query}${(rl.line.length%2==1)?"□":"■"}`);
};

export default function(prompt: string): Promise<string> {
  rl.query = prompt || "Input: "
  return new Promise((res, rej) => {
    rl.question(rl.query, (passwd) => {
      rl.output.write('\n')
      rl.close()
      res(passwd)
    });
  });
};
