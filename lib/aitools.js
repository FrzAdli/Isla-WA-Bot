const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
let setting = require("../key.json");

const configuration = new Configuration({
  apiKey: setting.openaiApi_1,
});
const openai = new OpenAIApi(configuration);

//Embedding Vector
async function getVector(text) {
  const response = await openai.createEmbedding({
      'model': 'text-embedding-ada-002',
      'input': text,
  });
  return response.data.data[0].embedding;
}

//Transcribe audio to text with whisper
async function transcribeAudio(media) {
  try {
    const filePath = `temp/voiceAudio${Date.now()}.mp3`; // Path tempat kamu ingin menyimpan file
    fs.writeFileSync(filePath, media, 'base64');
    const outputFilePath = `temp/voiceResult_${Date.now()}.mp3`;

    await new Promise((resolve, reject) => {
      ffmpeg.setFfmpegPath(ffmpegPath);

      ffmpeg(filePath)
        .output(outputFilePath)
        .format('mp3')
        .on('end', () => {
          fs.unlinkSync(filePath);
          resolve(); // Resolve promise setelah konversi selesai
        })
        .on('error', err => {
          console.error('Terjadi kesalahan saat konversi:', err);
          fs.unlinkSync(filePath);
          reject(err); // Reject promise jika terjadi kesalahan pada konversi
        })
        .run();
    });

    const transcript = await openai.createTranscription(
      fs.createReadStream(outputFilePath),
      "whisper-1"
    );

    fs.unlinkSync(outputFilePath);
    const audioText = transcript.data.text;
    return audioText;
  } catch (error) {
    console.log(error);
    return null;
  }
}


module.exports = { transcribeAudio, getVector };
