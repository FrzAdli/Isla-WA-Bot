const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

function convertToOpus(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    const input = path.resolve(inputFilePath);
    const output = path.resolve(outputFilePath);

    ffmpeg.setFfmpegPath(ffmpegPath);

    ffmpeg(input)
      .toFormat('opus')
      .on('error', reject)
      .on('end', () => {
        resolve();
      })
      .save(output);
  });
}

module.exports = { convertToOpus };
