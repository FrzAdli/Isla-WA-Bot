const axios = require('axios');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { MessageMedia } = require('whatsapp-web.js');
const { promisify } = require('util');
const { searchYouTube } = require('./searcher');
const { convertToOpus } = require('../utils/converter');
let setting = require("../key.json");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

function getFileExtension(url) {
  const queryStringIndex = url.indexOf('?');
  if (queryStringIndex !== -1) {
    url = url.substring(0, queryStringIndex); // Menghapus parameter tambahan jika ada
  }
  const lastDotIndex = url.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    return url.substring(lastDotIndex + 1); // Mengambil ekstensi file setelah tanda titik terakhir
  }
  return null;
}

async function play_song(query) {
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
        const outputFilePath = `./temp/${Date.now()}.opus`;
        await convertToOpus(filePath, outputFilePath);
        fs.unlinkSync(filePath);
        const audioBuffer = fs.readFileSync(outputFilePath);
        const base64Audio = audioBuffer.toString('base64');
        const media = new MessageMedia('audio/ogg', base64Audio);
        fs.unlinkSync(outputFilePath);
        resolve(media);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

async function download_song(query) {
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
        const media = MessageMedia.fromFilePath(filePath);
        media.filename = info.videoDetails.title;
        fs.unlinkSync(filePath);
        resolve(media);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

async function ytMP4(query) {
  try {
    const searchResults = await searchYouTube(query);
      if (searchResults.length === 0) {
        return null;
      }
    const videoId = searchResults[0].id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    const maxDurationInSeconds = 1800;
    const filteredFormats = info.formats.filter(format => format.approxDurationMs <= maxDurationInSeconds * 1000);
    const videoFormat = ytdl.chooseFormat(filteredFormats, { filter: "videoandaudio", quality: "highestvideo" });
    if (!videoFormat) {
      return null;
    }
    const videoStream = ytdl(videoUrl, { quality: videoFormat.itag });
    const filename = `${info.videoDetails.title.replace(/[^\w\s]/gi, "")}.mp4`;
    const filePath = `./temp/${filename}`;

    const pipeline = promisify(require('stream').pipeline);
    await pipeline(videoStream, fs.createWriteStream(filePath));
    const media = MessageMedia.fromFilePath(filePath);
    fs.unlinkSync(filePath);
    return media;
  } catch (error) {
    // console.log(error)
    return null;
  }
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
            const fileUrl = response.data[key];
            const fileExtension = getFileExtension(fileUrl);
            console.log(fileExtension)
            let filePath;  
            if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
              filePath = `temp/igimage${Date.now()}_${key}.jpg`;
            } else if (fileExtension === 'mp4') {
              filePath = `temp/igvideo${Date.now()}_${key}.${fileExtension}`;
            } else {
              console.log(`Unsupported file type: ${fileExtension}`);
              continue;
            }
            const filePromise = downloadFile(fileUrl, filePath);
            filePromises.push(filePromise);
            filePaths.push(filePath);
          }
        }
  
        await Promise.all(filePromises);
        return { filePaths, remainingRequests };
      } else {
        // No video, image, or unsupported file found
        return null;
      }
    } catch (error) {
      // ... (kode sebelumnya tetap sama)
    }
  }

async function igMP3(url) {
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
      const filePath = `temp/igaudio${Date.now()}.mp3`;
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
          const fileUrl = response.data[key];
          const fileExtension = getFileExtension(fileUrl);
          let filePath;  
          if (fileExtension === 'mp4') {
            filePath = `temp/igaudio${Date.now()}_${key}.mp3`;
          } else {
            continue;
          }   
          const filePromise = downloadFile(fileUrl, filePath);
          filePromises.push(filePromise);
          filePaths.push(filePath);
        }
      }

      await Promise.all(filePromises);
      return { filePaths, remainingRequests };
    } else {
      // No video, image, or unsupported file found
      return null;
    }
  } catch (error) {
    // ... (kode sebelumnya tetap sama)
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

async function fbDownloader(url) {
  try {
    const options = {
      method: 'GET',
      url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
      params: {
        url: url
      },
      headers: {
        'X-RapidAPI-Key': setting.rapidApiKey,
        'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
      }
    };
    
    try {
      const response = await axios.request(options);
      const result = response.data.links['Download High Quality'];
      const media = MessageMedia.fromUrl(result);
      return media;
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.log(error);
    return null;
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

async function downloadVoice(media) {
  const filePath = `temp/voiceAudio${Date.now()}.mp3`; // Path tempat kamu ingin menyimpan file

  fs.writeFileSync(filePath, media, 'base64');

  const outputFilePath = `temp/voiceResult_${Date.now()}.mp3`;
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg(filePath)
    .output(outputFilePath)
    .format('mp3')
    .on('end', () => {
      // console.log('Voice record berhasil didownload dan dikonversi:', outputFilePath);
      fs.unlinkSync(filePath);
    })
    .on('error', err => {
      // console.error('Terjadi kesalahan saat konversi:', err);
      fs.unlinkSync(filePath);
    })
    .run();

  return outputFilePath;
}

module.exports = {igdownloader, twitterScrape, downloadFile, ytMP4, play_song, fbDownloader, download_song, downloadVoice, igMP3}
 
