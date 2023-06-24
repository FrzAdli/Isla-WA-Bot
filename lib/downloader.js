const axios = require('axios');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { MessageMedia } = require('whatsapp-web.js');
const { promisify } = require('util');
const { searchYouTube } = require('./searcher');
const { convertToOpus } = require('../utils/converter');
let setting = require("../key.json");

async function playlagu(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const searchResults = await searchYouTube(query);
      if (searchResults.length === 0) {
        resolve(null);
      }
      const videoId = searchResults[0].id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(videoUrl);

      const maxDurationInSeconds = 600; // Durasi maksimum 10 menit (600 detik)
      const filteredFormats = info.formats.filter(format => format.approxDurationMs <= maxDurationInSeconds * 1000);
      const audioFormat = ytdl.chooseFormat(filteredFormats, { filter: "audioonly", quality: "highestaudio" });
      if (!audioFormat) {
        resolve(null);
      }

      const audioStream = ytdl(videoUrl, { quality: audioFormat.itag });
      const filePath = `./temp/${videoId}.mp3`; // Simpan dengan nama berdasarkan ID video
      audioStream
      .pipe(fs.createWriteStream(filePath))
      .on("finish", async () => {
        try {
          const outputFilePath = `./temp/${videoId}.opus`; // Path untuk file audio hasil konversi
          await convertToOpus(filePath, outputFilePath); // Fungsi konversi ke format Ogg Opus
          fs.unlinkSync(filePath);
          const audioBuffer = fs.readFileSync(outputFilePath);
          const base64Audio = audioBuffer.toString('base64');
          const media = new MessageMedia('audio/ogg', base64Audio);
          fs.unlinkSync(outputFilePath);
          resolve(media);
        } catch (error) {
          resolve(null);
        }
      });
    } catch (error) {
      resolve(null);
    }
  });
}

async function ytMP3(link) {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await ytdl.getInfo(link);
      const maxDurationInSeconds = 1800;
      const filteredFormats = info.formats.filter(format => format.approxDurationMs <= maxDurationInSeconds * 1000);
      const audioFormat = ytdl.chooseFormat(filteredFormats, { filter: "audioonly", quality: "highestaudio" });
      if (!audioFormat) {
        resolve(null);
      }
      const audioStream = ytdl(link, { quality: audioFormat.itag });
      const filename = `${info.videoDetails.title.replace(/[^\w\s]/gi, "")}.mp3`;
      const filePath = `./temp/${filename}`;

      audioStream
        .pipe(fs.createWriteStream(filePath))
        .on("finish", () => {
          try {
            const media = MessageMedia.fromFilePath(filePath);
            fs.unlinkSync(filePath);
            resolve(media);
          } catch (error) {
            resolve(null);
          }
        });
    } catch (error) {
      resolve(null);
    }
  });
}

async function ytMP4(link) {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await ytdl.getInfo(link);
      const maxDurationInSeconds = 1800;
      const filteredFormats = info.formats.filter(format => format.approxDurationMs <= maxDurationInSeconds * 1000);
      const videoFormat = ytdl.chooseFormat(filteredFormats, { filter: "videoandaudio", quality: "highestvideo" });
      if (!videoFormat) {
        resolve(null);
      }
      const videoStream = ytdl(link, { quality: videoFormat.itag });
      const filename = `${info.videoDetails.title.replace(/[^\w\s]/gi, "")}.mp4`;
      const filePath = `./temp/${filename}`;

      const pipeline = promisify(require('stream').pipeline);
      await pipeline(videoStream, fs.createWriteStream(filePath));
      resolve(filePath)
      } catch (error) {
        resolve(null);
    }
  });
}

async function igdownloader(url) {
    const options = {
    method: 'GET',
    url: 'https://instagram-media-downloader.p.rapidapi.com/rapid/post.php',
    params: {
        url: url
      },
      headers: {
        'X-RapidAPI-Key': setting.rapidApiKey,
        'X-RapidAPI-Host': 'instagram-media-downloader.p.rapidapi.com'
      }
    };
  
    try {
      const response = await axios.request(options);
      // console.log(response.data)
  
      if (response.data.video) {
        // Download video
        const filePaths = [];
        const videoUrl = response.data.video;
        const filePath = `temp/igvideo${Date.now()}.mp4`;
        const remainingRequests = response.headers['x-ratelimit-requests-remaining'];
        await downloadFile(videoUrl, filePath);
        filePaths.push(filePath);
        return { filePaths, remainingRequests };
      } else if (response.data.image) {
        // Download single image
        const filePaths = [];
        const imageUrl = response.data.image;
        const filePath = `temp/igimage${Date.now()}.jpg`;
        const remainingRequests = response.headers['x-ratelimit-requests-remaining'];
        await downloadFile(imageUrl, filePath);
        filePaths.push(filePath);
        return { filePaths, remainingRequests };
      } else if (Object.keys(response.data).length > 0) {
        // Download multiple images in slide
        const filePromises = [];
        const filePaths = [];
        const remainingRequests = response.headers['x-ratelimit-requests-remaining'];
  
        for (const key in response.data) {
          if (typeof response.data[key] === 'string' && response.data[key].startsWith('http')) {
            const imageUrl = response.data[key];
            const filePath = `temp/igimage${Date.now()}_${key}.jpg`;
            const filePromise = downloadFile(imageUrl, filePath);
            filePromises.push(filePromise);
            filePaths.push(filePath);
          }
        }
  
        await Promise.all(filePromises);
        return { filePaths, remainingRequests };
      } else {
        // No video or image found
        return null;
      }
    } catch (error) {
    //   console.error(error);
    }
}

async function twitterScrape(userInput) {
  try {
    if (!userInput.match(new RegExp(/(twitter).(com)/,'ig'))) {
      throw new Error('url_err');
    }
    const url = `https://twdown.app/api/twitter?url=${userInput}`
    const result = await axios.get(url);
    if (result.data.data.videos) {
      // Download video
      const filePaths = [];
      const videoUrl = result.data.data.videos;
      const filePath = `temp/twitvideo${Date.now()}.mp4`;
      await downloadFile(videoUrl, filePath);
      filePaths.push(filePath);
      return filePaths;
    } else {
      return null;
    }
  } catch (error) {
  //   console.error(error);
  }
}

async function downloadFile(url, filePath) {
  const response = await axios.get(url, { responseType: 'stream' });
  const writer = fs.createWriteStream(filePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

module.exports = {igdownloader, twitterScrape, downloadFile, ytMP3, ytMP4, playlagu}
