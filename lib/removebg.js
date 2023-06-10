const axios = require("axios");
const { MessageMedia } = require('whatsapp-web.js');
const { removeBackgroundFromImageBase64, RemoveBgResult } = require('remove.bg');

let setting = require("../key.json");

async function removeBackground(media) {
    const removeBgApiKey = setting.removeBgApiKey;
    const apiUrl = 'https://api.remove.bg/v1.0/removebg';

    try {
        console.log('Removing image background...');
        const result = await removeBackgroundFromImageBase64({
            base64img: media.data,
            apiKey: removeBgApiKey,
            size: 'preview',
            type: 'auto',
            format: 'jpg'
        });

        const base64Image = result.base64img;
        const attachmentData = new MessageMedia('image/jpeg', base64Image);
        return attachmentData;
    } catch (error) {
        console.error('Failed to remove background:', error);
        return null;
    }
}

module.exports = removeBackground;
