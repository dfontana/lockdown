const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.query = "Input: "
rl.stdoutMuted = true;
rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted)
    rl.output.write(`\x1B[2K\x1B[200D${rl.query}${(rl.line.length%2==1)?"□":"■"}`);
  else
    rl.output.write(stringToWrite);
};

module.exports = function(prompt) {
  rl.query = prompt
  return new Promise((res, rej) => {
    rl.question(rl.query, (passwd) => {
      rl.output.write('\n')
      rl.close()
      res(passwd)
    });
  });
};
