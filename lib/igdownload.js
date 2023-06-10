const { IgApiClient } = require('instagram-private-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const url = require('url');

async function downloadInstagramMedia(url) {
    // const parsedUrl = new URL(url);
    // const pathUrl = parsedUrl.pathname;
    // uri = pathUrl.slice(0, -1); // Menghapus tanda slash ganda di akhir uri

    // const ig = new IgApiClient();
  
    // // Masukkan informasi login Instagram di bawah ini
    // const username = 'adli_farizi';
    // const password = '@kayoi21';
  
    // // Login ke akun Instagram
    // ig.state.generateDevice(username);
    // await ig.account.login(username, password);
    // console.log("Debug: login")
  
    // // Mendapatkan informasi post berdasarkan URL
    // console.log(uri)
    // const { media }  = await ig.media.info(uri);
    // console.log("Debug: getpost")
  
    // // Mendownload media (gambar atau video)
    // const downloadUrl = media.videoUrl || media.urls[0];
    // const response = await axios.get(downloadUrl, { responseType: 'stream' });
    // console.log("Debug: download")
  
    // const filePath = path.join(path.dirname(__filename), filename);
    // const writer = fs.createWriteStream(filePath);
    // response.data.pipe(writer);
  
    // return new Promise((resolve, reject) => {
    //   writer.on('finish', resolve);
    //   writer.on('error', reject);
    // });


    const insta = (url) => new Promise((resolve, reject) => {
        console.log('Get metadata from =>', url)
        const uri = url.replace(/\?.*$/g, '')
        igGetInfo(uri, {})
            .then((result) => resolve(result))
            .catch((err) => {
                console.error(err)
                reject(err)
            })
    })
  }

  module.exports = downloadInstagramMedia;