const { link, statSync } = require('fs');
const { Client, LocalAuth, MessageMedia, mimetype } = require('whatsapp-web.js');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');

// import tools from lib
const { convertToGrayscale, remini, restore, removeBackground, createStickerWithText } = require('./lib/imgtools');
const { generateDALLEImage, generateAnime, imageToAnime } = require('./lib/aitools')
const { searchYouTube, searchImage  } = require('./lib/searcher');
const { igdownloader, twitterScrape, downloadFile, ytMP3, ytMP4, playlagu, fbDownloader } = require('./lib/downloader');
const uploadImage = require('./lib/uploader');

const textColor = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  BGred: "\x1b[41m",
  BGblue: "\x1b[44m",
};

const configuration = new Configuration({
  apiKey: setting.keyopenai,
  });
const openai = new OpenAIApi(configuration);
const userConversations = {};
const aboutAI = fs.readFileSync("aboutai.txt", "utf-8");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    } 
});

// const client = new Client({
//   authStrategy: new LocalAuth()
// });
 
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});
 
client.on('ready', () => {
    console.log('Isla Active!');
});
 
const prefix = ".";
 
client.on('message', async msg => {
 
    if (msg.body[0] == prefix){
        var [cmd, ...args] = msg.body.slice(1).split(" ");
        args = args.join(" ");

        const fromGroup = await client.getChatById(msg.from);
        let senderName = '';
        if (fromGroup.isGroup) {
            const contact = await msg.getContact();
            senderName = contact.pushname || contact.name || msg.from;
            const groupName = fromGroup.name;
            const message = msg.body.length > 30 ? msg.body.substring(0, 30) + "..." : msg.body;

            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const second = now.getSeconds();
            console.log('\n'+ textColor.BGred+'[LOGS]'+textColor.reset, message, textColor.green + 'FROM'  + textColor.reset, senderName, `[ ${msg.from.replace("@s.whatsapp.net", "")} ]`, 'IN',textColor.red + groupName + textColor.reset, `AT ${hour}:${minute}:${second}`);
        } else {
            const contact = await msg.getContact();
            senderName = contact.pushname || contact.name || msg.from;
            const message = msg.body.length > 30 ? msg.body.substring(0, 30) + "..." : msg.body;

            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const second = now.getSeconds();
            console.log('\n'+ textColor.BGblue+'[LOGS]'+textColor.reset, message, textColor.green + 'FROM' + textColor.reset, senderName, `[ ${msg.from.replace("@s.whatsapp.net", "")} ]`, `AT ${hour}:${minute}:${second}`);
        }
 
        if (cmd == "menu"){
            const menuOptions = `*Command Isla*
*_Isla_*
‣ .menu
‣ .say ...
‣ .delete *reply pesan Isla*

*_Group Command_*
‣ .join *linkgroup*
‣ .leave
‣ .tagall / .everyone

*_AI Command_*
‣ .ask ...
‣ .dalle *deskripsi gambar*

*_Image Command_*
‣ .sticker *gambar/replygambar*
‣ .stickertext *gambar/replygambar* 'text'
‣ .enhance *gambar/replygambar*
‣ .restore *gambar/replygambar*
‣ .grayscale *gambar/replygambar*
‣ .carigambar ...
‣ .removebg *gambar/replygambar* *Khusus pengguna tertentu

*_Downloader_*
‣ .playlagu *judul lagu*
‣ .ytmp3 *linkyoutube*
‣ .ytmp4 *linkyoutube*
‣ .ig *linkinstagram*
‣ .twmp4 *linktwitter*
‣ .fbmp4 *linkfacebook*

*_Fun Command_*
‣ .waifu
`;

            client.sendMessage(msg.from, menuOptions);
        }

        // GROUP COMMAND
        if (cmd == "join") {
          const link = args;
          const url = new URL(link);
          const inviteCode = url.pathname.substr(1);        
          try {
            const groupInvite = await client.acceptInvite(inviteCode);
            msg.reply("_Berhasil bergabung ke grup._")
          } catch (error) {
            msg.reply("_Gagal bergabung ke grup._")
          }
        }

        if (cmd == "leave") {
          if (fromGroup.isGroup) {
            msg.reply("_Isla akan segera meninggalkan grup._");
            setTimeout(() => {
              fromGroup.leave()
                .then(() => {
                })
                .catch((error) => {
                });
            }, 3000);
          } else {
            msg.reply("_Perintah ini hanya bisa digunakan di dalam grup._");
          }
        }

        if (cmd == "tagall" || cmd == "everyone") {
          const fromGroup = await client.getChatById(msg.from);
          if (fromGroup.isGroup) {
            try {
              const chat = await msg.getChat();
              let text = "";
              let mentions = [];

              for(let participant of chat.participants) {
                  const contact = await client.getContactById(participant.id._serialized);
                  
                  mentions.push(contact);
                  text += `@${participant.id.user} `;
              }
              await chat.sendMessage(text, { mentions });
              }
            catch (error) {
              msg.reply("_Terjadi kesalahan saat tag semua member grup._")
            }
          } else {
            msg.reply("_Command ini hanya bisa digunakan di dalam grup._")
          }
        }  

        //ISLA COMMAND
        if (cmd == "delete") {
          if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.fromMe) {
                quotedMsg.delete(true);
            } else {
                msg.reply('Saya hanya bisa menghapus pesan yang saya kirim.');
            }
          }
        }

        if (cmd == "say"){
            client.sendMessage(msg.from, args);
        }  
        
        //AI COMMAND
        if (cmd == "ask") {
          try {
            const userId = msg.from;
            if (!userConversations[userId]) {
              userConversations[userId] = {
                conversation: [{ role: "system", content: aboutAI }],
              };
            }
            const userConversation = userConversations[userId].conversation;
      
            let totalCharacters = userConversation.reduce((total, d) => total + d.content.length, 0);
            if (totalCharacters > 4000 && userConversation.length > 1) {
              userConversation.splice(1, 1);
            }

            let currentmsg;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                  msg.reply("Saya tidak paham jika kamu mereply media ketika bertanya.");
                  return;
                }
                currentmsg = [...userConversation, { role: "assistant", content: quotedMsg.body }, { role: "user", content: args }];
              } else {
                currentmsg = [...userConversation, { role: "user", content: args }];
              }

            const response = await openai.createChatCompletion({
              model: "gpt-3.5-turbo",
              messages: currentmsg,
              max_tokens: 300,
              temperature: 0.8,
              top_p: 1,
              frequency_penalty: 1,
              presence_penalty: 1,
            });
        
            const replyContent = response.data.choices[0].message.content;
            userConversation.push({ role: "assistant", content: replyContent });
            msg.reply(replyContent);
          } catch (error) {
            if (error.response) {
              msg.reply('_Terjadi kesalahan, mohon coba beberapa saat lagi._');
            } else {
              console.log(error);
              msg.reply('_Terjadi kesalahan, mohon coba beberapa saat lagi._');
            }
          }
        }

        if (cmd == 'dalle') {
          try {
            const query = args;
            msg.reply('_Mohon tunggu sebentar..._')
            const imageUrl = await generateDALLEImage(query);
            try {
              const media = MessageMedia.fromFilePath(imageUrl);
              await msg.reply(media);
            } catch {
            }
            fs.unlinkSync(imageUrl);
          } catch (error) {
            msg.reply('_Terjadi kesalahan saat generate gambar DALL-E._');
          }
        } 

        if (cmd == "generateanime") {
          const allowedUsers = JSON.parse(fs.readFileSync('user.json', 'utf-8'));
          const senderId = msg.author;
          const senderNumber = msg.from.replace("@s.whatsapp.net", "");
          try{
              if (allowedUsers.includes(senderNumber) || allowedUsers.includes(senderId)) {
                if (args.length > 0) {
                    try {    
                      msg.reply('_Mohon tunggu sebentar..._')
                      const animeData = await generateAnime(args);
                      const pathanimeData = 'temp/' + animeData;
                      if (animeData) {
                          const media = MessageMedia.fromFilePath(pathanimeData);
                          await client.sendMessage(msg.from, media);
                          fs.unlinkSync(pathanimeData);
                      } else {
                          msg.reply('_Gagal generate gambar._');
                      }
                  } catch {
                      msg.reply('_Terjadi kesalahan dalam generate gambar._');
                  }  
                } else {
                    msg.reply('_Mohon berikan prompt/keterangan gambar._')
                }
              } else {
                msg.reply('_Anda tidak diizinkan untuk menggunakan perintah ini._');
            }
          } catch {
            msg.reply("_Mohon maaf, sepertinya terjadi masalah._")
          }
        }

        if (cmd == "jadianime") {
          const allowedUsers = JSON.parse(fs.readFileSync('user.json', 'utf-8'));
          const senderId = msg.author;
          const senderNumber = msg.from.replace("@s.whatsapp.net", "");
          try {
            if (allowedUsers.includes(senderNumber) || allowedUsers.includes(senderId)) {
              try {
                msg.reply('_Mohon tunggu sebentar..._');
                let media;
                if (msg.hasQuotedMsg) {
                  const quotedMsg = await msg.getQuotedMessage();
                  if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                  } else {
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                  }
                } else {
                  if (msg.hasMedia) {
                    media = await msg.downloadMedia();
                  } else {
                    msg.reply("_Mohon kirimkan gambar untuk diubah menjadi sticker._");
                    return;
                  }
                }
                const tempPath = `temp/imgraw_${Date.now()}.png`;
                await fs.promises.writeFile(tempPath, media.data, 'base64');
                const imageUrl = await uploadImage(tempPath);           
                try {
                  const animeData = await imageToAnime(imageUrl);
                  if (animeData) {
                    const media = await MessageMedia.fromUrl(animeData);
                    await client.sendMessage(msg.from, media);
                    fs.unlinkSync(tempPath);
                  } else {
                    msg.reply('_Gagal generate gambar._');
                  }
                } catch (error) {
                  // console.error('Failed to process image:', error.message);
                }
              } catch (err) {
                // console.error(err);
                msg.reply('_Terjadi kesalahan dalam generate gambar._');
              }
            } else {
              msg.reply('_Anda tidak diizinkan untuk menggunakan perintah ini._');
            }
          } catch {
            msg.reply("_Mohon maaf, sepertinya terjadi masalah._");
          }
        } 

        //STICKER COMMAND
        if (cmd == "sticker") {
            let attachmentData;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    attachmentData = await quotedMsg.downloadMedia();
                } else {
                    // Respon jika pesan yang direspon bukan gambar
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                }
            } else {
                if (msg.hasMedia) {
                    attachmentData = await msg.downloadMedia();
                } else {
                    // Respon jika pengguna tidak mengirimkan gambar
                    msg.reply("_Mohon maaf, kirimkan gambar untuk membuat stiker._");
                    return;
                }
            }
            try {
              client.sendMessage(msg.from, attachmentData, { sendMediaAsSticker: true });
            } catch{
              msg.reply("_Mohon maaf, sepertinya terjadi masalah._")
            } 
        }

        if (cmd == "stickertext") {
          let media;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                } else {
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                }
            } else {
                if (msg.hasMedia) {
                    media = await msg.downloadMedia();
                } else {
                    msg.reply("_Mohon kirimkan gambar untuk diubah menjadi sticker._");
                    return;
                }
            }
            const tempPath = `temp/temp_${Date.now()}.jpg`;
            try {
                await fs.promises.writeFile(tempPath, media.data, 'base64');
                const result = await createStickerWithText(tempPath, args);          
                if (result) {
                    await client.sendMessage(msg.from, result, {sendMediaAsSticker: true});
                } else {
                    msg.reply('_Gagal membuat sticker._');
                }
            } catch (error) {
              console.log(error)
                msg.reply('_Terjadi kesalahan dalam membuat sticker._');
            } finally {
                fs.unlinkSync(tempPath);
            }
        }    
        
        //DOWNLOADER COMMAND
        if (cmd == "playlagu") {
          const query = args;
          if (query.length > 0) {
            try {
              msg.reply("_Mohon tunggu sebentar..._")
              const result = await playlagu(query);
              if (result) {
                await client.sendMessage(msg.from, result, { sendAudioAsVoice: true });
              } else {
                msg.reply("_Gagal memutar lagu._");
              }
            } catch {
              msg.reply('_Gagal memutar lagu._');
            }
          } else {
            msg.reply("_Mohon berikan judul lagu._")
          }
        }

        if (cmd == "ytmp3") {
          const link = args;
          if (link.includes("youtube.com") || link.includes("youtu.be")) {
            try {
              msg.reply("_Mohon tunggu sebentar..._")
              const result = await ytMP3(link);
              if (result) {
                client.sendMessage(msg.from, result, {sendMediaAsDocument:true});
              } else {
                msg.reply("_Gagal mengunduh audio._");
              }
            } catch {
              msg.reply('_Gagal mengunduh audio._');
            }
          } else {
            msg.reply("_URL Youtube tidak valid. Mohon kirimkan tautan Youtube yang benar._")
          }
        }

        if (cmd == "ytmp4") {
          const link = args;
          if (link.includes("youtube.com") || link.includes("youtu.be")) {
            try {
              msg.reply("_Mohon tunggu sebentar..._")
              const result = await ytMP4(link);
              if (result) {
                const media = await MessageMedia.fromFilePath(result.path);
                media.filename = result.title
                const fileSizeInBytes = statSync(result.path).size;
                const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
                if (fileSizeInMB < 15) {
                  await client.sendMessage(msg.from, media);
                } else {
                  await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
                }
              } else {
                msg.reply("_Gagal mengunduh video._");
              }
              fs.unlinkSync(result.path);
            } catch {
              msg.reply('_Gagal mengunduh video._');
            }
          } else {
            msg.reply("_URL Youtube tidak valid. Mohon kirimkan tautan Youtube yang benar._")
          }
        } 

        if (cmd == "ig") {
          const url = args;
          if (url.includes("instagram.com")) {
            try {
              msg.reply("_Mohon tunggu sebentar..._");
              const result = await igdownloader(url);
              if (result) {
                const { filePaths, remainingRequests } = result;
                for (const filePath of filePaths) {
                  const media = await MessageMedia.fromFilePath(filePath);      
                  if (filePath.endsWith('.jpg')) {
                    media.filename = `ImageIG${Date.now()}.jpg`;
                    await client.sendMessage(msg.from, media);
                  } else if (filePath.endsWith('.mp4')) {
                    media.filename = `VideoIG${Date.now()}.mp4`;
                    const fileSizeInBytes = statSync(filePath).size;
                    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
                    if (fileSizeInMB < 15) {
                      await client.sendMessage(msg.from, result);
                    } else if (fileSizeInMB > 50) {
                      msg.reply("_Ukuran file yang ingin anda unduh terlalu besar untuk dikirim._");
                    } else {
                      await client.sendMessage(msg.from, result, {sendMediaAsDocument:true});
                    }
                  } else {
                    msg.reply("_Format file tidak didukung._");
                  }
                  fs.unlinkSync(filePath);
                }
                msg.reply("Karena keterbatasan Isla, command ini memiliki sisa batas penggunaan sebanyak *" + remainingRequests + "* kali lagi, dan direset setiap bulan.");
              } else {
                msg.reply("_Terjadi kesalahan saat mengunduh._");
              }
            } catch (error) {
              msg.reply("_Terjadi kesalahan saat mengunduh data._");
            }
          } else {
            msg.reply("_URL Instagram tidak valid._");
          }
        }

        if (cmd == "twmp4") {
          const url = args;
          if (url.includes("twitter.com")) {
            try {
              msg.reply("_Mohon tunggu sebentar..._");
              const result = await twitterScrape(url);
              if (result) {
                const filePaths = result;
                for (const filePath of filePaths) { 
                  const media = await MessageMedia.fromFilePath(filePath);
                  if (filePath.endsWith('.mp4')) {
                  media.filename = `VideoTW${Date.now()}.mp4`;
                  const fileSizeInBytes = statSync(filePath).size;
                  const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
                  if (fileSizeInMB < 15) {
                    await client.sendMessage(msg.from, media);
                  } else if (fileSizeInMB > 50) {
                    msg.reply("_Ukuran file yang ingin anda unduh terlalu besar untuk dikirim._");
                  } else {
                    await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
                  }
                  } else {
                    msg.reply("_Format file tidak didukung._");
                  }
                  fs.unlinkSync(filePath);
                }
              } else {
                msg.reply("_Command ini hanya bisa digunakan untuk mengunduh video._");
              }
            } catch (error) {
              // console.log(error);
              msg.reply("_Terjadi kesalahan saat mengunduh data._");
            }
          } else {
            msg.reply("_URL Twitter tidak valid._");
          }
        }

        if (cmd == "fbmp4") {
          const url = args;
          if (url.includes("fb.watch") || url.includes("facebook.com")) {
            try {
              msg.reply("_Mohon tunggu sebentar..._");
              const result = await fbDownloader(url);
              if (result) {
                result.filename = `VideoFB${Date.now()}.mp4`;
                const fileSizeInMB = result.filesize / (1024 * 1024);
                if (fileSizeInMB < 15) {
                  await client.sendMessage(msg.from, result);
                } else if (fileSizeInMB > 50) {
                  msg.reply("_Ukuran file yang ingin anda unduh terlalu besar untuk dikirim._");
                } else {
                  await client.sendMessage(msg.from, result, {sendMediaAsDocument:true});
                }
              } else {
                msg.reply("_Terjadi kesalahan saat mengunduh media._");
              }
            } catch (error) {
              msg.reply("_Terjadi kesalahan saat mengunduh data._");
            }
          } else {
            msg.reply("_URL Facebook tidak valid._");
          }
        }
 
        // IMAGE COMMAND
        if (cmd == "removebg") {
            let media;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                } else {
                    // Respon jika pesan yang direspon bukan gambar
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                }
            } else {
                if (msg.hasMedia) {
                    media = await msg.downloadMedia();
                } else {
                    msg.reply("_Mohon maaf, kirimkan gambar untuk menghapus latar belakang._");
                    return;
                }
            }
            const allowedUsers = JSON.parse(fs.readFileSync('user.json', 'utf-8'));
            const senderId = msg.author;
            const senderNumber = msg.from.replace("@s.whatsapp.net", "");
            try{
                if (allowedUsers.includes(senderNumber) || allowedUsers.includes(senderId)) {
                  const attachmentData = await removeBackground(media);
                  if (attachmentData) {
                      client.sendMessage(msg.from, attachmentData);
                      client.sendMessage(msg.from, attachmentData, { sendMediaAsDocument: true });
                  } else {
                      msg.reply('_Gagal menghapus latar belakang gambar._');
                  }
              } else {
                  msg.reply('_Anda tidak diizinkan untuk menggunakan perintah ini._');
              }
            } catch {
              msg.reply("_Mohon maaf, sepertinya terjadi masalah._")
            } 
        }

        if (cmd == "grayscale") {
            let media;
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                } else {
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                }
            } else {
                if (msg.hasMedia) {
                    media = await msg.downloadMedia();
                } else {
                    // Respon jika pengguna tidak mengirimkan gambar
                    msg.reply("_Mohon kirimkan gambar untuk diubah menjadi grayscale._");
                    return;
                }
            }
            const tempPath = `temp/grayscale_${Date.now()}.jpg`;
            try {
                await fs.promises.writeFile(tempPath, media.data, 'base64');
                const lineartData = await convertToGrayscale(tempPath);
                if (lineartData) {
                    const imageBuffer = Buffer.from(lineartData.split(',')[1], 'base64');
                    const filename = `temp/resultgrayscale_${Date.now()}.png`;
                    fs.writeFileSync(filename, imageBuffer);
                    const media = MessageMedia.fromFilePath(filename);
                    await client.sendMessage(msg.from, media);
                    fs.unlinkSync(filename);
                } else {
                    client.sendMessage(msg.from, 'Gagal mengubah gambar menjadi lineart.');
                }
            } catch (error) {
                console.error(error);
                client.sendMessage(msg.from, 'Terjadi kesalahan dalam mengubah gambar menjadi lineart.');
            } finally {
                fs.unlinkSync(tempPath);
            }
        }    

        if (cmd == "enhance") {
            let media; 
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                } else {
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                }
            } else {
                if (msg.hasMedia) {
                    media = await msg.downloadMedia();
                } else {
                    msg.reply("_Mohon kirimkan gambar untuk dienhance._");
                    return;
                }
            }
            const tempPath = `temp/remini_${Date.now()}.jpg`;
            const outputPath = `temp/reminiout_${Date.now()}.jpg`;
            try {
                await fs.promises.writeFile(tempPath, media.data, 'base64');
                const imageUrl = await uploadImage(tempPath)             
                const result = await remini(imageUrl);
                if (result) {
                    await downloadFile(result, outputPath)
                    const media = await MessageMedia.fromFilePath(outputPath);          
                    await client.sendMessage(msg.from, media);
                } else {
                    client.sendMessage(msg.from, 'Gagal enhance gambar.');
                }
                fs.unlinkSync(outputPath);
            } catch (error) {
                console.error(error);
                client.sendMessage(msg.from, 'Terjadi kesalahan dalam enchance gambar.');
            } finally {
                fs.unlinkSync(tempPath);
            }
        }   
        
        if (cmd == "restore") {
            let media; 
            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                } else {
                    msg.reply("_Mohon maaf, reply harus berupa gambar._");
                    return;
                }
            } else {
                if (msg.hasMedia) {
                    media = await msg.downloadMedia();
                } else {
                    msg.reply("_Mohon kirimkan gambar untuk direstorasi._");
                    return;
                }
            }
            const tempPath = `temp/restore_${Date.now()}.jpg`;
            const outputPath = `temp/restoreout_${Date.now()}.jpg`;
            try {
                await fs.promises.writeFile(tempPath, media.data, 'base64');
                const imageUrl = await uploadImage(tempPath)
                const result = await restore(imageUrl);
                if (result) {
                    await downloadFile(result, outputPath)
                    const media = await MessageMedia.fromFilePath(outputPath);          
                    await client.sendMessage(msg.from, media);
                } else {
                    client.sendMessage(msg.from, 'Gagal restorasi gambar.');
                }
                fs.unlinkSync(outputPath);
            } catch (error) {
                console.error(error);
                client.sendMessage(msg.from, 'Terjadi kesalahan dalam restorasi gambar.');
            } finally {
                fs.unlinkSync(tempPath);
            }
        } 

        if (cmd == "carigambar") {
          const searchQuery = args;
          searchImage(searchQuery)
            .then(result => {
              if (result) {
                client.sendMessage(msg.from, result.media);
                msg.reply("Sumber: " + result.imageUrl);
              } else {
                msg.reply('_Tidak dapat menemukan gambar yang sesuai dengan query tersebut._');
              }
            })
            .catch(() => {
              msg.reply('_Terjadi kesalahan saat mencari gambar._');
            });
        }

        if (cmd == 'pixiv') {
          try {
            msg.reply("_Mohon tunggu sebentar._")
            const searchQuery = args;
            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();
            await page.goto(`https://www.pixiv.net/search.php?s_mode=s_tag_full&word=${searchQuery}`);
            await page.waitForSelector('a[href*="/artworks/"]');
            
            const imageLinks = await page.evaluate(() => {
              const linkElements = Array.from(document.querySelectorAll('a[href*="/artworks/"]'));
              const uniqueLinks = [...new Set(linkElements)].slice(0, 3).map((element) => element.href);
              return uniqueLinks;
            });
            for (const imageLink of imageLinks) {
              msg.reply(imageLink);
            }
            await browser.close();
          } catch (error) {
            await msg.reply('_Terjadi kesalahan saat mencari gambar di Pixiv._');
          }
        }  

        // FUN COMMAND
        if (cmd == 'waifu') {
          try {
            const response = await axios.get('https://api.waifu.pics/sfw/waifu');
            const imageUrl = response.data.url;
            const waifupath = `./temp/waifu/waifu${Date.now()}.jpg`;
            await downloadFile(imageUrl, waifupath);        
            const media = await MessageMedia.fromFilePath(waifupath);
            await client.sendMessage(msg.from, media);
            fs.unlinkSync(waifupath);
          } catch (error) {
            // console.log(error);
            msg.reply('_Terjadi kesalahan saat mengirim gambar waifu._');
          }
        }
     
    }    
});

let rejectCalls = true;
client.on('call', async (call) => {
  if (rejectCalls) await call.reject();
  if (!call.isGroup){
    client.sendMessage(call.from, "Anda melakukan panggilan. Panggilan ini ditolak otomatis oleh Isla.");
  }
});

client.initialize()

