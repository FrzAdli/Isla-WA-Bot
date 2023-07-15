const { exec } = require('child_process');
const path = require('path');

function callPython(textToSpeak) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../python/tts.py');
    const command = `python ${pythonScriptPath} "${textToSpeak}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error}`);
        reject(error);
        return;
      }
      // console.log(stdout);
      resolve();
    });
  });
}

module.exports = { callPython };
