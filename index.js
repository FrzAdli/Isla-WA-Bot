//Isla v2

const { statSync } = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const puppeteer = require('puppeteer');

// import
const { remini, restore, removeBackground, createStickerWithText } = require('./lib/imgtools');
const { transcribeAudio, getVector } = require('./lib/aitools')
const { searchYouTube, searchImage  } = require('./lib/searcher');
const { igdownloader, twitterScrape, downloadFile, ytMP4, fbDownloader, downloadVoice, igMP3, play_song, download_song } = require('./lib/downloader');
const uploadImage = require('./lib/uploader');
const { convertToOpus } = require('./utils/converter');
const translator = require('./utils/translator');
const pineconeHelper = require('./lib/pinecone');
const { prodia, prodia2img } = require('./lib/prodia');

const functions = [
  {
      "name": "play_music",
      "description": "play a music if user ask to play music and user give the music title/a youtube URL",
      "parameters": {
          "type": "object",
          "properties": {
              "title": {
                  "type": "string",
                  "description": "The title or URL of music"
              },
              "respond": {
                  "type": "string",
                  "description": "your response to ask the user to wait for the download result"
              },
              "result": {
                  "type": "string",
                  "description": "your response when the result is complete is sent to the user"
              },
              "error": {
                  "type": "string",
                  "description": "your response if error play the music"
              }
          },
          "required": ["title", "respond", "result", "error"]
      }
  },
  {
      "name": "download_music",
      "description": "download a music if user ask to download music and user give the music title/a youtube URL",
      "parameters": {
          "type": "object",
          "properties": {
              "title": {
                  "type": "string",
                  "description": "The title or URL of music"
              },
              "respond": {
                  "type": "string",
                  "description": "your response to ask the user to wait for the download result"
              },
              "result": {
                  "type": "string",
                  "description": "your response when the result is complete sent to the user"
              },
              "error": {
                  "type": "string",
                  "description": "your response if error download the music"
              }
          },
          "required": ["title", "respond", "result", "error"]
      }
  },
  {
      "name": "download_video",
      "description": "download a video if user ask to download video and user give the title/a youtube URL",
      "parameters": {
          "type": "object",
          "properties": {
              "title": {
                  "type": "string",
                  "description": "The title or URL of video"
              },
              "respond": {
                  "type": "string",
                  "description": "your response to ask the user to wait for the download result"
              },
              "result": {
                  "type": "string",
                  "description": "your response when the result is complete sent to the user"
              },
              "error": {
                  "type": "string",
                  "description": "your response if error download the video"
              }
          },
          "required": ["title", "respond", "result", "error"]
      }
  },
  {
      "name": "search_image",
      "description": "search an image in a given title or description by user",
      "parameters": {
          "type": "object",
          "properties": {
              "title": {
                  "type": "string",
                  "description": "The title or description of the image"
              }
          },
          "required": ["title"]
      }
  },
]

function logMessage(type, message, senderName, senderId, ...extra) {
  const truncatedMessage = message.length > 30 ? message.substring(0, 30) + '...' : message;
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  let logString = `\n${type} ${truncatedMessage} FROM ${senderName} [${senderId.replace('@s.whatsapp.net', '')}]`;
  if (extra.length > 0) {
    logString += ` ${extra.join(' ')}`;
  }
  logString += ` AT ${hour}:${minute}:${second}`;
  console.log(logString);
}

const configuration1 = new Configuration({
  apiKey: setting.openaiApi_1,
  });

const openai1 = new OpenAIApi(configuration1);

const userConversations = {};
const aboutAI = fs.readFileSync("about.txt", "utf-8");
const rule = [{ role: "system", content: aboutAI }]

const isOwner = "628179123238@c.us";

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    } 
});
 
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});
 
client.on('ready', () => {
    console.log('Isla Active!');
});
 
const prefix = ".";
client.on('message', async msg => {
  const senderNumber = msg.author; //senderNumber when message from group only
  const senderId = msg.from; //senderId if personal chat and groupId if group chat
  const contact = await msg.getContact();
  let senderName = contact.pushname || contact.name || msg.from;
  let cmd, args;
  
  if (msg.body[0] == prefix || (senderNumber == isOwner || senderId == isOwner)){
    if (senderNumber == isOwner || senderId == isOwner) {
      senderName = 'Kayoi'
      if (msg.hasMedia && msg.type == 'ptt') {
        const audio = await msg.downloadMedia();
        const transcribe = await transcribeAudio(audio.data);
        cmd = "ask";
        args = transcribe;

        const message = args.length > 30 ? args.substring(0, 30) + '...' : args;
        logMessage('[OWNER]', message, senderName, msg.from);
      } else {
        [cmd, ...args] = msg.body.slice(1).split(" ");
        args = args.join(" ");
      }
    } else if (msg.body[0] == prefix) {
      [cmd, ...args] = msg.body.slice(1).split(" ");
      args = args.join(" ");
    }

      const fromGroup = await client.getChatById(msg.from);
      if (fromGroup.isGroup && msg.body[0] == prefix) {
        const groupName = fromGroup.name;
        logMessage('[LOGS]', msg.body, senderName, msg.from, 'IN', groupName);
      } else if (!fromGroup.isGroup && msg.body[0] == prefix) {
        logMessage('[LOGS]', msg.body, senderName, msg.from);
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

*_Image Command_*
‣ .sticker *gambar/replygambar*
‣ .stickertext *gambar/replygambar* 'text'
‣ .enhance *gambar/replygambar*
‣ .restore *gambar/replygambar*
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

      if (cmd == "ask") {
        try {
          const chat = await msg.getChat();
          const now = new Date();
          const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'};
          const timestamp = now.toLocaleDateString('id-ID', options);
          const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const currentDayIndex = now.getDay();
          const dayName = daysOfWeek[currentDayIndex];
          const embedQuestion = await getVector(args);

          let context;
          let contextScore;
          const requestContent = await pineconeHelper.query(embedQuestion, senderId);
          if (requestContent.data.matches.length > 0) {
            context = requestContent.data.matches[0].metadata;
            contextScore = requestContent.data.matches[0].score;
          } else {
            const firstRespond = await getVector("Namaku Isla")
            await pineconeHelper.upsert({
              namespace: senderId,
              timeStamp: timestamp,
              content: "Namaku Isla",
              embedding: firstRespond
            })
            const secondRequestContent = await pineconeHelper.query(embedQuestion, senderId);
            if (secondRequestContent.data.matches.length > 0 ) {
              context = secondRequestContent.data.matches[0].metadata;
              contextScore = secondRequestContent.data.matches[0].score;
            }
          }

          if (!userConversations[senderId]) {
            userConversations[senderId] = {
              conversation: rule,
            };
          }
          const userConversation = userConversations[senderId].conversation;
    
          //Check userConversation length. Cut if more than 4000 words (limit openai)
          let totalCharacters = userConversation.reduce((total, d) => total + d.content.length, 0);
          if (totalCharacters > 4000 && userConversation.length > 1) {
            userConversation.splice(1, 1);
          }

          //Add additional memory to userConversation if there is related topic from pinecone
          const assistantIndex = userConversation.length - 1; 
          let currentmsg;
          const normalAsk = `Current time: ${dayName}, ${timestamp}.\nQuestion: ${senderName} said ${args}`;
          if (msg.hasQuotedMsg) {
              const quotedMsg = await msg.getQuotedMessage();
              const senderQuoted = (await quotedMsg.getContact()).pushname
              const quotedAsk = `${senderQuoted} said ${quotedMsg.body}.\nCurrent time: ${dayName}, ${timestamp}.\nQuestion: ${senderName} said ${args}`;
             
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
                      { role: "user", content: normalAsk }
                  ];
              } else if (contextScore > 0.8) {
                  currentmsg = [
                      ...userConversation.slice(0, assistantIndex),
                      { role: "assistant", content: context.content },
                      ...userConversation.slice(assistantIndex),
                      { role: "user", content: normalAsk }
                  ];
              } else {
                currentmsg = [...userConversation, { role: "user", content: normalAsk }];
              }    
          }

          //Getting answer from openai
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const response1 = await openai1.createChatCompletion({
                model: "gpt-3.5-turbo-0613",
                messages: currentmsg,
                functions: functions,
                function_call: "auto",
                max_tokens: 300,
                temperature: 0.8,
                top_p: 1,
                frequency_penalty: 1,
                presence_penalty: 1,
              });

            const response_message = response1.data.choices[0].message;
            const replyContent = response_message.content;

            if (response_message.function_call) {
              try {
                const function_name = response_message.function_call.name;
                const function_args = JSON.parse(response_message.function_call.arguments);
                if (function_name == "play_music") {
                  console.log("Putar musik: ", function_args.title);
                  msg.reply(function_args.respond);
                  const media = await play_song(function_args.title);
                  if (media) {
                    await client.sendMessage(msg.from, media, {sendAudioAsVoice:true});
                    client.sendMessage(msg.from, function_args.result);
                    userConversation.push({ role: "assistant", content: function_args.result });
                  } else {
                    msg.reply(function_args.error);
                    userConversation.push({ role: "assistant", content: function_args.error });
                  }
                } else if (function_name == "download_music") {
                  console.log("Download musik: ", function_args.title);
                  msg.reply(function_args.respond);
                  const media = await download_song(function_args.title);
                  if (media) {
                    await client.sendMessage(msg.from, media, {sendMediaAsDocument:true});
                    client.sendMessage(msg.from, function_args.result);
                    userConversation.push({ role: "assistant", content: function_args.result });
                  } else {
                    msg.reply(function_args.error);
                    userConversation.push({ role: "assistant", content: function_args.error });
                  }
                } else if (function_name == "download_video") {
                  console.log("Download video: ", function_args.title);
                  msg.reply(function_args.respond);
                  const media = await ytMP4(function_args.title)
                  if (media) {
                    await client.sendMessage(msg.from, media, {sendMediaAsDocument:true});
                    client.sendMessage(msg.from, function_args.result);
                    userConversation.push({ role: "assistant", content: function_args.result });
                  } else {
                    msg.reply(function_args.error);
                    userConversation.push({ role: "assistant", content: function_args.error });
                  }
                } else if (function_name == "search_image") {
                  console.log("Judul gambar: ", function_args.title);
                  const media = await searchImage(function_args.title);
                  if (media) {
                    await client.sendMessage(msg.from, media.media);
                  } else {
                    msg.reply("gagal mencari gambar.");
                  }
                } 
              } catch (error) {
                console.log(error);
              }
            } else {
              await new Promise(resolve => setTimeout(resolve, 3000));
              msg.reply(replyContent);
              userConversation.push({ role: "assistant", content: replyContent });

              //Add new memory to pinecone
              if (contextScore > 0.84) {
                const islaRespond = await getVector(replyContent);
                await pineconeHelper.upsert({
                  namespace: senderId,
                  timeStamp: timestamp,
                  content: replyContent,
                  embedding: islaRespond
                })
              }
            }
          } catch (error) {
            console.log(error);
          }
        } catch (error) {
          msg.reply('_Terjadi kesalahan, mohon coba beberapa saat lagi._');
        }
      }

      if (cmd == "prodia") {
        let attachmentData;
        let url;
        let prompt;
        let model;
        let media;
        let result;
        const regex = /\[([\d]+)\]/g;
        const matches = args.match(regex);
        if (matches) {
          const splitPrompt = args.split(/\[([\d]+)\]/).filter(Boolean);
          model = splitPrompt[0];
          prompt = splitPrompt[1];
          if (model == 0 || model > 8) {
            msg.reply('Angka model tidak valid');
            return;
          }
        } else {
          model = '0'
          prompt = args;
        }
        try {
          if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                attachmentData = await quotedMsg.downloadMedia();
                const Path = `temp/prodia${Date.now()}.jpg`;
                await fs.promises.writeFile(Path, attachmentData.data, 'base64');
                url = await uploadImage(Path);
                result = await prodia2img(url, prompt, model);
                media = MessageMedia.fromFilePath(result);
                client.sendMessage(msg.from, media);
                fs.unlinkSync(result);
                fs.unlinkSync(Path);
            } else {
                msg.reply("_Mohon maaf, reply harus berupa gambar untuk menggunakan prodia._");
                return;
            }
          } else {
            if (msg.hasMedia) {
              attachmentData = await msg.downloadMedia();
              const Path = `temp/prodia${Date.now()}.jpg`;
              await fs.promises.writeFile(Path, attachmentData.data, 'base64');
              url = await uploadImage(Path);
              result = await prodia2img(url, prompt, model);
              media = MessageMedia.fromFilePath(result);
              client.sendMessage(msg.from, media);
              fs.unlinkSync(result);
              fs.unlinkSync(Path);
            } else {
              result = await prodia(prompt, model);
              media = MessageMedia.fromFilePath(result);
              client.sendMessage(msg.from, media);
              fs.unlinkSync(result);
            }
          }
        } catch (error) {
          msg.reply("Terjadi kesalahan");
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
                  msg.reply("_Mohon maaf, reply harus berupa gambar._");
                  return;
              }
          } else {
              if (msg.hasMedia) {
                  attachmentData = await msg.downloadMedia();
              } else {
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
            const result = await play_song(query);
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
            const result = await download_song(link);
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

    }
});

let rejectCalls = true;
client.on('call', async (call) => {
  if (rejectCalls) await call.reject();
  if (!call.isGroup){
    client.sendMessage(call.from, "Anda melakukan sebuah panggilan. Panggilan ini ditolak otomatis oleh Bot.");
  }
});

client.initialize();
