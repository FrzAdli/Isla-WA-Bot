const translate = require('translate-google');

async function translator(text, from, to) {
    try {
        const translatedText = await translate(text, { from: from, to: to });
        return translatedText;
      } catch (error) {
        console.error('Terjadi kesalahan saat menerjemahkan:', error);
        return null;
      }
}

module.exports = translator;