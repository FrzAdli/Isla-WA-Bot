const axios = require('axios');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const Youtube = require('youtube-sr').default;
let setting = require("../key.json");

async function searchYouTube(query) {
  try {
    const searchResults = await Youtube.search(query, { limit: 1 }); // Jumlah hasil pencarian yang ingin Anda tampilkan
    const videos = searchResults.map((result) => ({
      id: result.id,
      title: result.title,
    }));

    return videos;
  } catch (error) {
    // console.error('Error searching YouTube:', error);
    return [];
  }
}

async function searchImage(query) {
  try {
    const apiKey = setting.googleapisApi;
    const searchEngineId = setting.SearchEngineID;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&searchType=image&q=${query}`;
    const response = await axios.get(url);

    if (response.data.items && response.data.items.length > 0) {
      const fetch = await import('node-fetch').then((m) => m.default);
      const imageUrl = response.data.items[0].link;
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      const tempFilePath = `temp/searchimage${Date.now()}.jpg`;
      await fs.writeFileSync(tempFilePath, Buffer.from(buffer));
      const media = await MessageMedia.fromFilePath(tempFilePath);
      fs.unlinkSync(tempFilePath);

      return {
        media,
        imageUrl
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { searchYouTube, searchImage };
