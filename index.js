const { link } = require('fs');
const { Client, LocalAuth, MessageMedia, mimetype } = require('whatsapp-web.js');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");
const ytdl = require('ytdl-core');
const qrcode = require('qrcode-terminal');

const removeBackground = require('./lib/removebg');
const checkBadWords = require('./lib/katakasar');
const searchYouTube = require('./lib/searchyoutube');
const convertToOpus = require('./lib/cvOpus');

const textColor = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    BGred: "\x1b[41m",
    BGblue: "\x1b[44m",
  };
 
// Fungsi untuk menambahkan pengguna ke file user.json
// function addUserToAllowedList(user) {
//     try {
//       const allowedUsers = JSON.parse(fs.readFileSync('user.json', 'utf-8'));
//       allowedUsers.push(user);
//       fs.writeFileSync('user.json', JSON.stringify(allowedUsers));
//       console.log('User added:', user);
//     } catch (error) {
//       console.error('Error adding user:', error);
//     }
//   }

// addUserToAllowedList("628179123238");


// Read about.txt file
const about = fs.readFileSync("aboutai.txt", "utf-8");
const conversation = [{ role: "system", content: about }];

// const client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: {    headless: false,
//             executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
//     
 
// });

const client = new Client({
  authStrategy: new LocalAuth()
});
 
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});
 
client.on('ready', () => {
    console.log('Bot Active!');
});
 
const prefix = ".";
 
client.on('message', async msg => {
 
    if (msg.body[0] == prefix){
        
        var [cmd, ...args] = msg.body.slice(1).split(" ");
        args = args.join(" ");

        const fromGroup = await client.getChatById(msg.from);
        let senderName = '';

        // Mendapatkan nama pengirim
        if (fromGroup.isGroup) {
            // Pesan berasal dari grup
            const contact = await msg.getContact();
            senderName = contact.pushname || contact.name || msg.from;
            const groupName = fromGroup.name;
            const message = msg.body.length > 30 ? msg.body.substring(0, 30) + "..." : msg.body;
            console.log('\n'+ textColor.BGred+'[LOGS]'+textColor.reset, message, textColor.green + 'FROM'  + textColor.reset, senderName, `[ ${msg.from.replace("@s.whatsapp.net", "")} ]`, 'IN',textColor.red + groupName + textColor.reset);
        } else {
            // Pesan bukan berasal dari grup (chat pribadi)
            const contact = await msg.getContact();
            senderName = contact.pushname || contact.name || msg.from;
            const message = msg.body.length > 30 ? msg.body.substring(0, 30) + "..." : msg.body;
            console.log('\n'+ textColor.BGblue+'[LOGS]'+textColor.reset, message, textColor.green + 'FROM' + textColor.reset, senderName, `[ ${msg.from.replace("@s.whatsapp.net", "")} ]`);
        }
 
        if (cmd == "menu"){
            const menuOptions = `*Command*
*_Bantuan_*
~ .menu => tampilkan menu

*_Stella_*
~ .say ... => minta Stella mengatakan sesuatu
~ .ask ... => tanyakan sesuatu kepada Stella

*_Gambar_*
~ .sticker *gambar* => image to sticker
~ .removebg *gambar* => remove background image (Khusus pengguna tertentu dikarenakan ada limit)

*_Youtube_*
~ .playlagu *judul lagu* => mainkan lagu
~ .ytmp3 *linkyoutube* => download youtube menjadi mp3`;
            client.sendMessage(msg.from, menuOptions);
        }

        // Tanpa filter
        // if (cmd == "say"){
        //     client.sendMessage(msg.from, args);
        // }

        if (cmd == "say") {
            if (checkBadWords(args)) {
                msg.reply("Mohon maaf, tolong jangan gunakan kata-kata kasar.");
            } else {
                client.sendMessage(msg.from, args);
            }
        }
        
        if (cmd == "ask"){
            try{
                const configuration = new Configuration({
                apiKey: setting.keyopenai,
                });
                const openai = new OpenAIApi(configuration);
                const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [...conversation, { role: "user", content: args }],
                });
                const replyContent = response.data.choices[0].message.content;
                msg.reply(replyContent);
            } catch (error) {
                if (error.response) {
                    client.sendMessage(msg.from, 'Maaf, sepertinya ada yang error, mohon coba lagi beberapa saat.')
                  } else {
                    console.log(error);
                    client.sendMessage(msg.from, 'Maaf, sepertinya ada yang error, mohon coba lagi beberapa saat.')
                  }
            }
        }
        

        if (cmd === "sticker") {
            const attachmentData = await msg.downloadMedia();
            client.sendMessage(msg.from, attachmentData, {sendMediaAsSticker: true});
        }
        
        if (cmd === "playlagu") {
          const query = args;
        
          try {
            const searchResults = await searchYouTube(query);
        
            if (searchResults.length === 0) {
              client.sendMessage(msg.from, 'Tidak dapat menemukan lagu yang sesuai dengan judul tersebut.');
              return;
            }
        
            const videoId = searchResults[0].id;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
            const info = await ytdl.getInfo(videoUrl);

            const maxDurationInSeconds = 600; // Durasi maksimum 10 menit (600 detik)
            const filteredFormats = info.formats.filter(format => format.approxDurationMs <= maxDurationInSeconds * 1000);

            const audioFormat = ytdl.chooseFormat(filteredFormats, { filter: "audioonly", quality: "highestaudio" });

            if (!audioFormat) {
              client.sendMessage(msg.from, 'Tidak dapat memilih audio yang terlalu panjang.');
              return;
            }

            msg.reply("Mohon tunggu sebentar...");
            const audioStream = ytdl(videoUrl, { quality: audioFormat.itag });
            const filePath = `./temp/${videoId}.mp3`; // Simpan dengan nama berdasarkan ID video
        
            audioStream
            .pipe(fs.createWriteStream(filePath))
            .on("finish", async () => {
              try {
                const outputFilePath = `./temp/${videoId}.opus`; // Path untuk file audio hasil konversi
                await convertToOpus(filePath, outputFilePath); // Fungsi konversi ke format Ogg Opus

                try {
                  const audioBuffer = fs.readFileSync(outputFilePath);
                  const base64Audio = audioBuffer.toString('base64');
                  const media = new MessageMedia('audio/ogg', base64Audio);
                  await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
                } catch (error) {
                  console.log("Terjadi kesalahan saat membaca/konversi file:", error)
                }

                fs.unlinkSync(filePath); // Hapus file MP3
                fs.unlinkSync(outputFilePath); // Hapus file Ogg Opus setelah dikirim
              } catch (error) {
                client.sendMessage(msg.from, 'Gagal memutar lagu.');
              }
            });
          } catch (error) {
            console.log('Error:', error.message);
            client.sendMessage(msg.from, 'Gagal memutar lagu.');
          }
        }

        if (cmd == "ytmp3"){
            const link = args
            try {
                const info = await ytdl.getInfo(link);
                const audioFormat = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio"});
        
                if (!audioFormat) {
                  client.sendMessage(msg.from, 'Tidak dapat memilih format audio dari tautan Youtube.');
                }

                msg.reply("Mohon tunggu sebentar...");
                const audioStream = ytdl(link, { quality: audioFormat.itag });
                const filename = `${info.videoDetails.title.replace(/[^\w\s]/gi, "")}.mp3`;
                const filePath = `./temp/${filename}`; // Temporary storage path
        
                audioStream
                .pipe(fs.createWriteStream(filePath))
                .on("finish", () => {
                    try {
                  const media = MessageMedia.fromFilePath(filePath);
                  client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
                  fs.unlinkSync(filePath); // Remove the audio file after sendiri
                } catch (error){
                    console.error("Terjadi kesalahan saat membaca file:", error);
                    client.sendMessage(msg.from, 'Gagal melakukan konversi Youtube ke audio.');
                }
                });
            } catch (error) {
            console.log('Error:', error.message);
            client.sendMessage(msg.from, 'Gagal melakukan konversi Youtube ke audio.');
          }
        }
 
        if (cmd == "removebg") {
            const media = await msg.downloadMedia();
            
            // Periksa apakah pengirim pesan ada dalam daftar pengguna yang diizinkan
            const allowedUsers = JSON.parse(fs.readFileSync('user.json', 'utf-8'));
            const senderId = msg.author;
            const senderNumber = msg.from.replace("@s.whatsapp.net", "");
            
            if (allowedUsers.includes(senderNumber) || allowedUsers.includes(senderId)) {
              const attachmentData = await removeBackground(media);
              if (attachmentData) {
                client.sendMessage(msg.from, attachmentData, { sendMediaAsDocument: true });
              } else {
                client.sendMessage(msg.from, 'Gagal menghapus latar belakang gambar.');
              }
            } else {
              client.sendMessage(msg.from, 'Anda tidak diizinkan untuk menggunakan perintah ini.');
            }
          }
 
    }
        
});
 

client.initialize();

