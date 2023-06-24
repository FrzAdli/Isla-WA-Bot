const { removeBackgroundFromImageBase64, RemoveBgResult } = require('remove.bg');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
let setting = require("../key.json");
registerFont('font/impact.ttf', { family: 'Impact' })

async function removeBackground(media) {
  const removeBgApiKey = setting.removeBgApiKey;
  const apiUrl = 'https://api.remove.bg/v1.0/removebg';

  try {
      const result = await removeBackgroundFromImageBase64({
          base64img: media.data,
          apiKey: removeBgApiKey,
          size: 'preview',
          type: 'auto',
          format: 'jpg'
      });

      const base64Image = result.base64img;
      const attachmentData = new MessageMedia('image/jpeg', base64Image);
      return attachmentData;
  } catch (error) {
      console.error('Failed to remove background:', error);
      return null;
  }
}

async function convertToGrayscale(imagePath) {
  try {
    // Menggunakan modul canvas untuk membuat canvas dan memuat gambar
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');


    // Menggambar gambar asli ke dalam canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Mengonversi gambar ke lineart
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const avg = (r + g + b) / 3;

      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    ctx.putImageData(imageData, 0, 0);

    // Mengembalikan data gambar dalam bentuk base64
    return canvas.toDataURL();
  } catch (error) {
    console.error('Terjadi kesalahan saat mengonversi gambar ke lineart:', error);
    return null;
  }
}

async function remini(path) {
  const options = {
      method: 'POST',
      url: 'https://appyhigh-ai.p.rapidapi.com/rapidapi/enhancer/2k',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': setting.rapidApiKey,
        'X-RapidAPI-Host': 'appyhigh-ai.p.rapidapi.com'
      },
      data: {
        source_url: path,
        filename: 'test.jpg'
      }
    };
    try {
        const response = await axios.request(options);
      //   console.log(response.data.data['2k'].url);
        return response.data.data['2k'].url;
    } catch (error) {
        console.error(error);
    }
}

async function restore(path) {
  const options = {
  method: 'POST',
  url: 'https://appyhigh-ai.p.rapidapi.com/rapidapi/color-restoration/2k',
  headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': setting.rapidApiKey,
      'X-RapidAPI-Host': 'appyhigh-ai.p.rapidapi.com'
  },
  data: {
      source_url: path,
      filename: 'test.jpg'
  }
  };
  try {
      const response = await axios.request(options);
      //   console.log(response.data.data['2k'].url);
      return response.data.data['2k'].url;
  } catch (error) {
      console.error(error);
  }
}

async function createStickerWithText(imagePath, text) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  const maxTextWidth = image.width
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const fontSize = canvas.height * 0.15;
  ctx.font = `${fontSize}px Impact`;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black'; // Warna stroke hitam
  ctx.lineWidth = 10; // Lebar stroke
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom'; // Mengatur teks di bagian bawah

  const textWidth = ctx.measureText(text).width;
  if (textWidth >= maxTextWidth) {
    const scaleFactor = maxTextWidth / textWidth;
    ctx.font = `${fontSize * scaleFactor}px Impact`;
  }

  const textX = canvas.width / 2;
  const textY = canvas.height - fontSize * 0.1; // Membuat sedikit jarak dari bawah
  ctx.strokeText(text, textX, textY); // Menggambar stroke hitam
  ctx.fillText(text, textX, textY); // Menggambar teks

  const outputImagePath = `./temp/resultstickertext${Date.now()}.png`;
  const out = fs.createWriteStream(outputImagePath);
  const stream = canvas.createPNGStream();
  const writePromise = new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });
  await writePromise;

  const output = await MessageMedia.fromFilePath(outputImagePath);
  fs.unlinkSync(outputImagePath);
  return output;
}

module.exports = { remini, restore, convertToGrayscale, removeBackground, createStickerWithText };
