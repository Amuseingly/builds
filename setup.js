const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, "files", "artists", "images"), {recursive: true});

fs.mkdirSync(path.join(__dirname, "files", "songs", "audio"), {recursive: true});

fs.mkdirSync(path.join(__dirname, "files", "songs", "images"), {recursive: true});