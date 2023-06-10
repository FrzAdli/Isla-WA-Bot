const badWords = ['anjing',
    'anjg',
    'tolol',
    'kontol',
    'memek',
    'bangsat',
    'bgst',
    'jembut',
    'gay',
    'lesbi'
    //Tambahin Sendiri
    ];
 
function checkBadWords(message) {
  const words = message.toLowerCase().split(' ');
  
  for (let i = 0; i < words.length; i++) {
    if (badWords.includes(words[i])) {
      return true; // Kata kasar ditemukan
    }
  }
  
  return false; // Tidak ada kata kasar
}

module.exports = checkBadWords;