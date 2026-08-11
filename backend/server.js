const express = require('express');
const cors = require('cors');
const path = require('path');
const ttsRoutes = require('./routes/tts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, '../audio-output')));
app.use('/api/tts', ttsRoutes);

app.listen(PORT, () =>{
    console.log(`The server started on PORT: ${PORT}`);
});