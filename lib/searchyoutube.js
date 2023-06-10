const Youtube = require('youtube-sr').default;

async function searchYouTube(query) {
  try {
    const searchResults = await Youtube.search(query, { limit: 1 }); // Jumlah hasil pencarian yang ingin Anda tampilkan
    const videos = searchResults.map((result) => ({
      id: result.id,
      title: result.title,
    }));

    return videos;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}


module.exports = searchYouTube;