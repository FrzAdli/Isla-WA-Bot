const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
const request = require('request');
const fs = require("fs");
let setting = require("../key.json");
const { downloadFile } = require('./downloader')

async function generateDALLEImage(query) {
  try {
    const configuration = new Configuration({
      apiKey: setting.keyopenai,
    });
    const openai = new OpenAIApi(configuration);
    const response = await openai.createImage({
      prompt: query,
      n: 1,
      size: "512x512",
    });
    const imageUrl = response.data.data[0].url;
    const filePath = `temp/dalle${Date.now()}.jpg`;

    const imageResponse = await axios.get(imageUrl, {
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    imageResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filePath));
      writer.on("error", reject);
    });
  } catch{
  }
}

async function generateAnime(prompt) {
    const apiKey = setting.stablediffApiKey;
    const modelId = 'anything-v4';
    const negative_prompt = "extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs";
    const width = '512';
    const height = '512';
    const samples = '1';
    const numInferenceSteps = '30';
    const guidanceScale = 7.5;
  
    try {
      const bodyInfo = JSON.stringify({
        key: apiKey,
        model_id: modelId,
        prompt: prompt,
        negative_prompt: negative_prompt,
        width: width,
        height: height,
        samples: samples,
        num_inference_steps: numInferenceSteps,
        seed: null,
        guidance_scale: guidanceScale,
        webhook: null,
        track_id: null
      });
  
      const options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await axios.post('https://stablediffusionapi.com/api/v3/dreambooth', bodyInfo, options);
      const filename = `temp_anime${Date.now()}.jpg`;
  
      await downloadFile(response.data.output, filename);
      return filename;
    } catch (error) {
      console.log('Terjadi kesalahan:', error);
      return null;
    }
  }

async function imageToAnime(imagePath) {
    const apiKey = setting.stablediffApiKey;
    const modelId = 'anything-v4';
    const width = '512';
    const height = '512';
    const samples = '1';
    const numInferenceSteps = '30';
    const guidanceScale = 7.5;
  
    try {
      const options = {
        'method': 'POST',
        'url': 'https://stablediffusionapi.com/api/v3/dreambooth/img2img',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "key": apiKey,
          "model_id": modelId,
          "prompt": "classic drawn 2D anime style",
          "negative_prompt": "realistic, painting , extra arms, extra hand, bad anatomy, glitchy, bad proportion, blur, ugly face",
          "init_image": imagePath,
          "width": "512",
          "height": "512",
          "samples": "1",
          "num_inference_steps": "21",
          "seed": null,
          "guidance_scale": 7,
          "strength": 0.85,
          "scheduler": "UniPCMultistepScheduler",
          "webhook": null,
          "track_id": null
        })
      };
  
      return new Promise((resolve, reject) => {
        request(options, function (error, response) {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            let outputUrl;
            try {
              const result = response.body;
              const jsonResponse = JSON.parse(result);
              const output = jsonResponse.output;
              const url = output[0];
              outputUrl = url.toString();
              resolve(outputUrl);
            } catch (error) {
              console.error(error);
              reject(error);
            }
          }
        });
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
}

module.exports = { generateDALLEImage, generateAnime, imageToAnime };
