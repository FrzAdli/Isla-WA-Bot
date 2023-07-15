const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
let setting = require("../key.json");
const { playlagu, download_music } = require("./downloader");
const { MessageMedia } = require('whatsapp-web.js');
const { convertToOpus } = require("../utils/converter");
const getTime = require("./timetools");

const configuration = new Configuration({apiKey: setting.keyopenai,});
const openai = new OpenAIApi(configuration);
const userConversations = {};
const aboutAI = fs.readFileSync("about.txt", "utf-8");

const functions = [
    {
        "name": "get_current_time",
        "description": "Get the current time or date if user ask",
        "parameters": {
            "type": "object",
            "properties": {
            },
            "required": []
        }
    },
    {
        "name": "play_music",
        "description": "play a music in a given title",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The title of music"
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
        "description": "download a music in a given title or youtube URL",
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
        "description": "download a video in a given title or youtube URL",
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
    }
]


async function islaAnswer(prompt) {  
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo-0613",
            messages: prompt,
            functions:functions,
            function_call: "auto",
            max_tokens: 300,
            temperature: 0.8,
            top_p: 1,
            frequency_penalty: 1,
            presence_penalty: 1,
          });
        const response_message = response.data.choices[0].message;
        // console.log(response_message)
        const replyContent = response_message.content;

        if (response_message.function_call) {
            try {
                const function_name = response_message.function_call.name;
                // console.log(function_name);
                const function_args = JSON.parse(response_message.function_call.arguments);
                if (function_name == "get_current_time") {
                    const currentTime = await getTime();
                    console.log(currentTime);
                    prompt.push({role: "assistant", content:currentTime});
                    const second_response = await openai.createChatCompletion({
                        model: "gpt-3.5-turbo",
                        messages: prompt,
                        max_tokens: 50,
                        temperature: 0.8,
                        top_p: 1,
                        frequency_penalty: 1,
                        presence_penalty: 1,
                    });
                    const secondReply = second_response.data.choices[0].message.content;
                    return secondReply;
                } else if (function_name == "play_music") {
                    const title = function_args.title;
                    const respond = function_args.respond;
                    const result = function_args.result;
                    const error = function_args.error;
                    return { function_name, respond, title, result, error };
                } else if (function_name == "download_music") {
                    const title = function_args.title;
                    const respond = function_args.respond;
                    const result = function_args.result;
                    const error = function_args.error;
                    return { function_name, respond, title, result, error };
                } else if (function_name == "download_video") {
                    const title = function_args.title;
                    const respond = function_args.respond;
                    const result = function_args.result;
                    const error = function_args.error;
                    return { function_name, respond, title, result, error };
                } else if (function_name == "search_image") {
                    const title = function_args.title;
                    return { function_name, title};
                }
            } catch (error) {
                console.log(error);
                return null;
            }
        } else {
        return replyContent;
        }
    } catch (error) {
        // console.log(error);
        return null;
    }  
      
}
 
module.exports = islaAnswer;