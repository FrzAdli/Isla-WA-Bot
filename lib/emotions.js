const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');
let setting = require("../key.json");

async function getMoods (text) {
  const options = {
    method: 'GET',
    url: 'https://googles-bert-sentiment-analysis.p.rapidapi.com/sentiment',
    params: {
      text: text,
      lang: 'en'
    },
    headers: {
      'X-RapidAPI-Key': setting.rapidApiKey,
      'X-RapidAPI-Host': 'googles-bert-sentiment-analysis.p.rapidapi.com'
    }
  };
  try {
    const response = await axios.request(options);
    const label = response.data.label;
    const { sentiment_probabilities } = response.data;
    const highestProbability = Math.max(...sentiment_probabilities);
    console.log('Label: ', label, ', Probability:', highestProbability);
    if ((label == "positive" && highestProbability > 0.99985) || (label == "negative" && highestProbability > 0.998)) {
      console.log("GETTING MOODS");
      const moods = await checkEmotion(text);
      const mood = moods.maxEmotion;
      const score = moods.maxScore;
      const emo = moods.emo
      const prob = moods.prob
      let result;
      if (mood && score) {
        result = await checkMood(mood, score);
      } else if (emo && prob) {
        result = await checkMood(emo, prob);
      }
      return result;
    }
  } catch (error) {
    // console.error(error);
  }
}

async function checkEmotion (sentence) {
  const options = {
    method: 'POST',
      url: 'https://emodex-emotions-analysis.p.rapidapi.com/rapidapi/emotions',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': setting.rapidApiKey,
        'X-RapidAPI-Host': 'emodex-emotions-analysis.p.rapidapi.com'
      },
      data: {
        sentence: sentence
      }
    };
      
  try {
    const response = await axios.request(options);
    const emotionScores = response.data.sentence;
    delete emotionScores.text;
    const maxScore = Math.max(...Object.values(emotionScores));
    const maxEmotion = Object.keys(emotionScores).find(
    (key) => emotionScores[key] === maxScore
    );
    console.log("Emotion: ", maxEmotion, ", Score: ", maxScore);
    return { maxScore, maxEmotion };
  } catch {
    console.log("ERROR, RECHECK EMOTION");
    const reEmo = await reCheckEmotion(sentence);
    return reEmo;
  }
}

async function reCheckEmotion(text) {
  const options = {
    method: 'POST',
    url: 'https://ekman-emotion-analysis.p.rapidapi.com/ekman-emotion',
    headers: {
      'content-type': 'application/json',
      Accept: 'application/json',
      'X-RapidAPI-Key': setting.rapidApiKey,
      'X-RapidAPI-Host': 'ekman-emotion-analysis.p.rapidapi.com'
    },
    data: [
      {
        id: '1',
        language: 'en',
        text: text
      }
    ]
  };
  
  try {
    const response = await axios.request(options);
    const emo = response.data[0].predictions[0].prediction;
    const prob = response.data[0].predictions[0]. probability;
    console.log("Emotion: ", emo, ", Score: ", prob);
    if (prob > 0.87) {
      return { emo, prob };
    }
  } catch (error) {
    console.error(error);
  }
}

async function checkMood (mood, score) {
  try {
    let folderPath;
    if (mood == "joy" && score > 0.43) {
      folderPath = path.join(__dirname, '..', 'emotions', 'joy');
    } else if (mood == "love" && score > 0.5) {
      folderPath = path.join(__dirname, '..', 'emotions', 'love');
    } else if (mood == "sadness" && score > 0.43) {
      folderPath = path.join(__dirname, '..', 'emotions', 'sad');
    } else if (mood == "anger") {
      folderPath = path.join(__dirname, '..', 'emotions', 'angry');
    }
    if (folderPath) {
      const files = fs.readdirSync(folderPath);
      const randomFileName = files[Math.floor(Math.random() * files.length)];
      const filePath = path.join(folderPath, randomFileName);
      const media = MessageMedia.fromFilePath(filePath);
      return media;
    }
  } catch (error) {
    console.log(error);
  }
}
module.exports= { getMoods };
