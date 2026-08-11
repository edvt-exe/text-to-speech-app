const gtts = require('node-gtts');
const path = require('path');

// to generate an mp3 file from text and save it to disk
function generateAudioFile(text, language = 'ro') {
    return new Promise((resolve, reject) => {
        const tts = gtts(language);
        const fileName = `speech_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, '../../audio-output', fileName);

        tts.save(filePath, text, (ret) => {
            if (ret) return reject(ret);
            resolve(fileName);
        })
    })
}

module.exports = {generateAudioFile};