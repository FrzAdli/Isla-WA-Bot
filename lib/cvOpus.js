const ffmpeg = require('fluent-ffmpeg');

function convertToOpus(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .toFormat('opus')
        .on('error', reject)
        .on('end', resolve)
        .save(outputFilePath);
    });
  }

  module.exports = convertToOpus;