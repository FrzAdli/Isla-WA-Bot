const ffmpeg = require('fluent-ffmpeg');

async function convertToH264(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .output(outputFilePath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset medium',
        '-crf 23',
        '-b:a 128k'
      ])
      .on('end', () => {
        // console.log('Video converted successfully!');
        resolve();
      })
      .on('error', (err) => {
        // console.error('Error converting video:', err.message);
        reject(err);
      })
      .run();
  });
}

function convertToOpus(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .toFormat('opus')
      .on('error', reject)
      .on('end', resolve)
      .save(outputFilePath);
  });
}

module.exports = { convertToH264, convertToOpus };
