const fs = require("fs");
const agent = require("../bin/getProxyAgent")(process.env.PROXY);
const axios = require("axios");

async function getPhoto(url, imagePath) {
    const writer = fs.createWriteStream(imagePath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        httpsAgent: agent,
        httpAgent: agent
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    })
}

module.exports = getPhoto;