const { link, statSync } = require('fs');
const { Client, LocalAuth, MessageMedia, mimetype } = require('whatsapp-web.js');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const qr = require('qrcode');

// import
const { convertToGrayscale, remini, restore, removeBackground, createStickerWithText } = require('./lib/imgtools');
const { generateDALLEImage, generateAnime, imageToAnime, transcribeAudio, getVector } = require('./lib/aitools')
const { searchYouTube, searchImage  } = require('./lib/searcher');
const { igdownloader, twitterScrape, downloadFile, ytMP3, ytMP4, playlagu, fbDownloader, download_music, downloadVoice, igMP3 } = require('./lib/downloader');
const uploadImage = require('./lib/uploader');
const { callPython } = require('./lib/pythonhandler');
const { convertToOpus } = require('./utils/converter');
const { getMoods } = require('./lib/emotions');
const translator = require('./utils/translator');
const islaAnswer = require('./lib/openai');
const pineconeHelper = require('./lib/pinecone')

const textColor = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  BGred: "\x1b[41m",
  BGblue: "\x1b[44m",
  BGgreen: "\x1b[42m",
};

const configuration = new Configuration({
  apiKey: setting.keyopenai,
  });
const openai = new OpenAIApi(configuration);
const userConversations = {};
const aboutAI = fs.readFileSync("about.txt", "utf-8");

let enableNSFW = false;
let enablegacha = true;
const isOwner = "628179123238@c.us";

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    } 
});

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // Ganti 'index.html' dengan halaman web Anda
});
 
// client.on('qr', qr => {
//   console.log("generating qr");
//   // console.log(qr);
//   io.on('connection', (socket) => {
//     socket.on('requestQRCode', () => {
//       qrcode.generate(qr, { small: true }, (qrCode) => {
//         io.emit('sendQRCode', qrCode);
//       });
//     });
//   });
// });

client.on('qr', qrData => {
  console.log("generating qr");
  // console.log(qrData);

  // Fungsi untuk menghasilkan gambar QR code
  function generateQRCode(qrData) {
    qr.toFile('qrcode.png', qrData, {
      type: 'png',
      errorCorrectionLevel: 'H',
      scale: 5,
    }, (err) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }

      console.log('QR code image has been saved.');

      // Membaca gambar QR code dalam bentuk base64
      fs.readFile('qrcode.png', { encoding: 'base64' }, (err, data) => {
        if (err) {
          console.error('Error reading QR code image:', err);
          return;
        }

        // Mengirimkan gambar QR code ke klien melalui Socket.IO
        io.emit('sendQRCode', data);
      });
    });
  }

  io.on('connection', (socket) => {
    socket.on('requestQRCode', () => {
      // Memanggil fungsi untuk menghasilkan gambar QR code
      generateQRCode(qrData);
    });
  });
});

server.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
 
client.on('ready', () => {
    console.log('Isla Active!');
});
 
const prefix = ".";
 
client.on('message', async msg => {
  const senderId = msg.author;
  const senderNumber = msg.from.replace("@s.whatsapp.net", "");
  var cmd, args;

  if (msg.body[0] == prefix || (senderId == isOwner || senderNumber == isOwner)){
    if (senderId == isOwner || senderNumber == isOwner) {
        if (msg.hasMedia && msg.type == 'ptt') {
        const audio = await msg.downloadMedia();
        const transcribe = await transcribeAudio(audio.data);
        cmd = "ask";
        args = transcribe;

        let senderName = '';
        const contact = await msg.getContact();
        senderName = contact.pushname || contact.name || msg.from;
        const message = args.length > 30 ? args.substring(0, 30) + "..." : args
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();
        console.log('\n'+ textColor.BGgreen+'[OWNER]'+textColor.reset, message, textColor.green + 'FROM' + textColor.reset, senderName, `[ ${msg.from.replace("@s.whatsapp.net", "")} ]`, `AT ${hour}:${minute}:${second}`);
      } else {
        [cmd, ...args] = msg.body.slice(1).split(" ");
        args = args.join(" ");
      }
    } else if (msg.body[0] == prefix) {
      [cmd, ...args] = msg.body.slice(1).split(" ");
      args = args.join(" ");
    }

      const fromGroup = await client.getChatById(msg.from);
      let senderName = '';
      if (fromGroup.isGroup && msg.body[0] == prefix) {
          const contact = await msg.getContact();
          senderName = contact.pushname || contact.name || msg.from;
          const groupName = fromGroup.name;
          const message = msg.body.length > 30 ? msg.body.substring(0, 30) + "..." : msg.body;
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();
          const second = now.getSeconds();
          console.log('\n'+ textColor.BGred+'[LOGS]'+textColor.reset, message, textColor.green + 'FROM'  + textColor.reset, senderName, `[ ${msg.from.replace("@s.whatsapp.net", "")} ]`, 'IN',textColor.red + groupName + textColor.reset, `AT ${hour}:${minute}:${second}`);
      } else if (!fromGroup.isGroup && msg.body[0] == prefix) {
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
‣ .resetmemory
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

*_Gacha Command_*
‣ .waifu
`;

          client.sendMessage(msg.from, menuOptions);
      }

      // OWNER COMMAND
      if (cmd == "enablensfw") {
        if (isOwner == senderId || isOwner == senderNumber) {
          enableNSFW = true;
          msg.reply("_NSFW diaktifkan._");
        } else {
          msg.reply("_Hanya owner saya yang bisa menggunakan command ini._")
        }
      }

      if (cmd == "disablensfw") {
        if (isOwner == senderId || isOwner == senderNumber) {
          enableNSFW = false;
          msg.reply("_NSFW dinonaktifkan._");
        } else {
          msg.reply("_Hanya owner saya yang bisa menggunakan command ini._")
        }
      }

      if (cmd == "enablegacha") {
        if (isOwner == senderId || isOwner == senderNumber) {
          enablegacha = true;
          msg.reply("_Fitur gacha diaktifkan._");
        } else {
          msg.reply("_Hanya owner saya yang bisa menggunakan command ini._")
        }
      }

      if (cmd == "disablegacha") {
        if (isOwner == senderId || isOwner == senderNumber) {
          enablegacha = false;
          msg.reply("_Fitur gacha dinonaktifkan._");
        } else {
          msg.reply("_Hanya owner saya yang bisa menggunakan command ini._")
        }
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
      if (cmd == "resetmemory") {
        try {
          const userId = msg.from;
          if (!userConversations[userId]) {
            userConversations[userId] = {
              conversation: [{ role: "system", content: aboutAI }],
            };
          } else {
            userConversations[userId].conversation.splice(0);
            userConversations[userId].conversation.push({ role: "system", content: aboutAI });
          }
          await pineconeHelper.deleteAll(userId);
          if (fromGroup.isGroup) {
            msg.reply("_Memory Isla berhasil direset untuk pesan grup ini. Seluruh riwayat percakapan telah dihapus._");
          } else {
            msg.reply("_Memory Isla berhasil direset untuk pesan pribadi ini. Seluruh riwayat percakapan telah dihapus_");
          }
        } catch {
          msg.reply("_Gagal mereset memory Isla._");
        }
      }
      
      // if (cmd == "ask") {
      //   try {
      //     const userId = msg.from;
      //     if (!userConversations[userId]) {
      //       userConversations[userId] = {
      //         conversation: [{ role: "system", content: aboutAI }],
      //       };
      //     }
      //     const userConversation = userConversations[userId].conversation;
    
      //     let totalCharacters = userConversation.reduce((total, d) => total + d.content.length, 0);
      //     if (totalCharacters > 4000 && userConversation.length > 1) {
      //       userConversation.splice(1, 1);
      //     }

      //     let currentmsg;
      //     if (msg.hasQuotedMsg) {
      //         const quotedMsg = await msg.getQuotedMessage();
      //         if (quotedMsg.hasMedia) {
      //           msg.reply("Saya tidak paham jika kamu mereply media ketika bertanya.");
      //           return;
      //         }
      //         currentmsg = [...userConversation, { role: "assistant", content: quotedMsg.body }, { role: "user", content: args }];
      //       } else {
      //         currentmsg = [...userConversation, { role: "user", content: args }];
      //       }

      //     const response = await openai.createChatCompletion({
      //       model: "gpt-3.5-turbo",
      //       messages: currentmsg,
      //       max_tokens: 300,
      //       temperature: 0.8,
      //       top_p: 1,
      //       frequency_penalty: 1,
      //       presence_penalty: 1,
      //     });
      
      //     const replyContent = response.data.choices[0].message.content;
      //     userConversation.push({ role: "assistant", content: replyContent });
      //     // const enRespon = await translator(replyContent, 'id', 'en');
      //     // const mood = await getMoods(enRespon);
      //     msg.reply(replyContent);
      //     // if (mood) {
      //     //   client.sendMessage(msg.from, mood, {sendMediaAsSticker:true});
      //     // }
      //   } catch (error) {
      //     const now = new Date();
      //     const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      //     const timestamp = now.toLocaleDateString('id-ID', options);
      //     console.log(error);
      //     const errorMessage = error.stack;
        
      //     fs.appendFile('error.log', "[" + timestamp + "]" + errorMessage + '\n', (err) => {
      //       if (err) {
      //         console.error('Terjadi kesalahan saat menulis file:', err);
      //       } else {
      //         console.log('Error berhasil ditambahkan ke file: error.log');
      //       }
      //     });
      //     msg.reply('_Terjadi kesalahan, mohon coba beberapa saat lagi._');
      //   }
      // }

      if (cmd == "ask") {
        try {
          const userId = msg.from;
          const now = new Date()
          const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
          const timestamp = now.toLocaleDateString('id-ID', options);
          const question = args;

          const embedQuestion = await getVector(question);

          let context;
          let contextScore;
          const requestContent = await pineconeHelper.query(embedQuestion, userId);
          if (requestContent.data.matches.length > 0) {
            context = requestContent.data.matches[0].metadata;
            contextScore = requestContent.data.matches[0].score;
          } else {
            const firstRespond = await getVector("Namaku Isla")
            await pineconeHelper.upsert({
              namespace: userId,
              timeStamp: timestamp,
              content: "Namaku Isla",
              embedding: firstRespond
            })
            const secondRequestContent = await pineconeHelper.query(embedQuestion, userId);
            if (secondRequestContent.data.matches.length > 0 ) {
              context = secondRequestContent.data.matches[0].metadata;
              contextScore = secondRequestContent.data.matches[0].score;
            }
          }

          console.log(context);
          console.log(contextScore);

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

          const assistantIndex = userConversation.length - 1; 
          let currentmsg;
          if (msg.hasQuotedMsg) {
              const quotedMsg = await msg.getQuotedMessage();
              const quotedAsk = `${quotedMsg.body}\n${args}`
              if (quotedMsg.hasMedia) {
                  msg.reply("Saya tidak paham jika kamu mereply media ketika bertanya.");
                  return;
              }
              if (contextScore > 0.8) {
                currentmsg = [
                    ...userConversation,
                    { role: "assistant", content: context.content },
                    { role: "user", content: quotedAsk }
                ];
              } else if (contextScore > 0.75) {
                currentmsg = [
                    ...userConversation.slice(0, assistantIndex),
                    { role: "assistant", content: context.content },
                    ...userConversation.slice(assistantIndex),
                    { role: "user", content: quotedAsk }
                ];
              } else {
                currentmsg = [...userConversation, { role: "user", content: quotedAsk }];
              }
          } else {
              if (contextScore > 0.87) {
                  currentmsg = [
                      ...userConversation,
                      { role: "assistant", content: context.content },
                      { role: "user", content: args }
                  ];
              } else if (contextScore > 0.8) {
                  currentmsg = [
                      ...userConversation.slice(0, assistantIndex),
                      { role: "assistant", content: context.content },
                      ...userConversation.slice(assistantIndex),
                      { role: "user", content: args }
                  ];
              } else {
                currentmsg = [...userConversation, { role: "user", content: args }];
              }    
          }

          const respond = await islaAnswer(currentmsg);
          // let enRespond;
          // let mood;
          if (typeof respond == 'string') {
            // enRespond = await translator(respond, 'id', 'en');
            // mood = await getMoods(enRespond);
            msg.reply(respond);
            // if (mood) {
            //   client.sendMessage(msg.from, mood, {sendMediaAsSticker:true});
            // }
            userConversation.push({ role: "assistant", content: respond });
            if (contextScore > 0.8) {
              const islaRespond = await getVector(respond);
              await pineconeHelper.upsert({
                namespace: userId,
                timeStamp: timestamp,
                content: respond,
                embedding: islaRespond
              })
            }

          } else if (respond.function_name == "play_music") {
            msg.reply(respond.respond);
            const media = await playlagu(respond.title)
            if (media) {
              await client.sendMessage(msg.from, media, {sendAudioAsVoice:true});
              client.sendMessage(msg.from, respond.result);
              userConversation.push({ role: "assistant", content: respond.result });
            } else {
              msg.reply(respond.error);
              userConversation.push({ role: "assistant", content: respond.error });
            }
            
          } else if (respond.function_name == "download_music") {
            msg.reply(respond.respond);
            const media = await download_music(respond.title)
            if (media) {
              await client.sendMessage(msg.from, media, {sendMediaAsDocument:true});
              client.sendMessage(msg.from, respond.result);
              userConversation.push({ role: "assistant", content: respond.result });
            } else {
              msg.reply(respond.error);
              userConversation.push({ role: "assistant", content: respond.error });
            }

          } else if (respond.function_name == "download_video") {
            msg.reply(respond.respond);
            const media = await ytMP4(respond.title)
            if (media) {
              await client.sendMessage(msg.from, media, {sendMediaAsDocument:true});
              client.sendMessage(msg.from, respond.result);
              userConversation.push({ role: "assistant", content: respond.result });
            } else {
              msg.reply(respond.error);
              userConversation.push({ role: "assistant", content: respond.error });
            }

          } else if (respond.function_name == "search_image") {
            const media = await searchImage(respond.title)
            if (media) {
              await client.sendMessage(msg.from, media.media);
              msg.reply("Sumber: " + media.imageUrl)
            } else {
              msg.reply("gagal mencari gambar.");
            }

          } else if (respond.function_name == "situation_description") {
            console.log(respond.desc);
          }
          else {
            msg.reply('_Terjadi kesalahan, mohon coba beberapa saat lagi._');
          }
        } catch {
          msg.reply('_Terjadi kesalahan, mohon coba beberapa saat lagi._');
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

      if (cmd == "tryvoice") {
        const query = args;
        try {
          await callPython(query);
          const inputFilePath = 'test2.wav';
          const timestamp = Date.now()
          // const result = await manipulateAudio(inputFilePath, timestamp);
          const outputFilePath = `./temp/${Date.now()}.opus`; // Path untuk file audio hasil konversi
          await convertToOpus(inputFilePath, outputFilePath); // Fungsi konversi ke format Ogg Opus
          const audioBuffer = fs.readFileSync(outputFilePath);
          const base64Audio = audioBuffer.toString('base64');
          const media = new MessageMedia('audio/ogg', base64Audio);
          client.sendMessage(msg.from, media, {sendAudioAsVoice:true});
          // fs.unlinkSync(result);
          fs.unlinkSync(outputFilePath);  
          console.log("Success");
        } catch (error) {
          console.log(error);
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
              if (quotedMsg.hasMedia){
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
            const result = await download_music(link);
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
              const fileSizeInBytes = result.filesize;
              const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
              if (fileSizeInMB < 15) {
                await client.sendMessage(msg.from, result);
              } else {
                await client.sendMessage(msg.from, result, { sendMediaAsDocument: true });
              }
            } else {
              msg.reply("_Gagal mengunduh video._");
            }
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

      if (cmd == "igmp3") {
        const url = args;
        if (url.includes("instagram.com")) {
          try {
            msg.reply("_Mohon tunggu sebentar..._");
            const result = await igMP3(url);
            if (result) {
              const { filePaths, remainingRequests } = result;
              for (const filePath of filePaths) {
                const media = await MessageMedia.fromFilePath(filePath);      
                if (filePath.endsWith('.mp3')) {
                  await client.sendMessage(msg.from, media, {sendMediaAsDocument:true});
                  msg.reply("Karena keterbatasan Isla, command ini memiliki sisa batas penggunaan sebanyak *" + remainingRequests + "* kali lagi, dan direset setiap bulan.");
                } else {
                  msg.reply("_Terjadi kesalahan, pastikan URL mengandung video untuk diunduh audionya._")
                }
                fs.unlinkSync(filePath);
              }
            } else {
              msg.reply("_Terjadi kesalahan saat mengunduh._");
            }
          } catch (error) {
            msg.reply("_Terjadi kesalahan saat mengunduh. Pastikan link mengandung sebuah video_");
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
          try{
              if (allowedUsers.includes(senderNumber) || allowedUsers.includes(senderId)) {
                msg.reply("_Mohon tunggu sebentar..._");
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
              msg.reply("_Mohon tunggu sebentar..._");
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
              msg.reply("_Mohon tunggu sebentar..._");
              await fs.promises.writeFile(tempPath, media.data, 'base64');
              const imageUrl = await uploadImage(tempPath)             
              const result = await remini(imageUrl);
              if (result) {
                  await downloadFile(result, outputPath)
                  const media = await MessageMedia.fromFilePath(outputPath);          
                  await client.sendMessage(msg.from, media);
                  client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
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
              msg.reply("_Mohon tunggu sebentar..._");
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
        msg.reply("_Mohon tunggu sebentar..._");
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
        if (enablegacha) {
          try {
            let type;
            if (enableNSFW) {
              type = "nsfw";
            } else {
              type = "sfw";
            }
            const response = await axios.get(`https://api.waifu.pics/${type}/waifu`);
            const imageUrl = response.data.url;
            const waifupath = `./temp/waifu/waifu${Date.now()}.jpg`;
            await downloadFile(imageUrl, waifupath);   
            const media = await MessageMedia.fromFilePath(waifupath);
            if (fromGroup.isGroup) {
              const contact = await msg.getContact();
              senderName = contact.pushname || contact.name || msg.from;
              await client.sendMessage(msg.from, media, {caption: "Ini gacha waifu kamu, " + senderName});
            } else {
              await client.sendMessage(msg.from, media);
            }
            fs.unlinkSync(waifupath);
          } catch (error) {
            // console.log(error);
            msg.reply('_Terjadi kesalahan saat mengirim gambar waifu._');
          }
        } else {
          msg.reply("_Command ini sedang dinonaktifkan oleh owner saya untuk menghindari spam._")
        }
        
      }

    }
});

let rejectCalls = true;
client.on('call', async (call) => {
  if (rejectCalls) await call.reject();
  if (!call.isGroup){
    client.sendMessage(call.from, "Anda melakukan panggilan. Panggilan ini ditolak otomatis oleh Bot.");
  }
});

client.initialize()

