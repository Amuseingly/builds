const express = require('express');
const path = require("path");
const uuid = require("uuid");
const YoutubeMp3Downloader = require("./../bin/YoutubeMp3Downloader");
const getPhoto = require("../bin/getPhoto");
const fs = require("fs");
const {basePath} = require("../bin/utils");
const router = express.Router();
const outputPath = path.join(basePath, "audio");
const imagePath = path.join(basePath, "images");
const downloader = new YoutubeMp3Downloader({
    outputPath,
    queueParallelism: 1
});
const {dbPool} = require("./../bin/utils");

// https://alltomp3.org/

downloader.on("finished", async function(err, data) {
    if (!err) {
        try {
            await dbPool.query("UPDATE yt_downloads SET completed=1 WHERE video=?", [data.videoId]);

            let artistIds = [];
            for (let i = 0; i < data.artistArray.length; i++) {
                const [rows] = await dbPool.query("SELECT * FROM audio_artists WHERE name LIKE ?", [data.artistArray[i]]);
                if (rows.length >= 1) {
                    artistIds.push(rows[0]._id);
                } else if (rows.length === 0) {
                    await dbPool.query("INSERT INTO audio_artists (name) VALUES (?)", [data.artistArray[i]]);
                    const [newRow] = await dbPool.query("SELECT * FROM audio_artists WHERE name LIKE ? ORDER BY _id DESC", [data.artistArray[i]]);
                    artistIds.push(newRow[0]._id);
                }
            }

            let photoName = uuid.v4() + ".jpg";
            while (fs.existsSync(path.join(imagePath,photoName))) photoName = uuid.v4() + ".jpg";
            try {
                await getPhoto(data.thumbnail, path.join(imagePath, photoName));
            } catch (e) {
                photoName = null;
            }

            const [{insertId}] = await dbPool.query("INSERT INTO audio_songs (title, audioUrl, iconUrl, sourceId, sourceType) VALUES (?, ?, ?, ?, ?)" +
                "ON DUPLICATE KEY UPDATE audioUrl = ?, iconUrl = ?;", [
                data.title, data.file, photoName, data.videoId, "YouTube", data.file, photoName
            ]);

            let artistSong = [];
            for (let v = 0; v < artistIds.length; v++) {
                artistSong.push([insertId, artistIds[v]])
            }

            await dbPool.query("INSERT IGNORE INTO audio_song_artists VALUES ?", [artistSong]);

            await dbPool.query("UPDATE yt_downloads SET completed = 1 WHERE video = ? AND output = ?", [data.videoId, data.fileName]);
        } catch (e) {
        }
    }
});

downloader.on("error", console.log);

router.get('/download/:id', async function(req, res) {
    if ((await getStatus(req.params.id)).canDownload) {
        let downloadFileName = uuid.v4() + ".mp3";

        let [checkDownload] = await dbPool.query("SELECT * FROM yt_downloads WHERE output = ?", [downloadFileName]);
        // Safety Check
        while (checkDownload.length !== 0) {
            downloadFileName = uuid.v4() + ".mp3";
            [checkDownload] = await dbPool.query("SELECT * FROM yt_downloads WHERE output = ?", [downloadFileName]);
        }


        try {
            await dbPool.query("INSERT INTO yt_downloads (video, output) VALUES (?, ?) ON DUPLICATE KEY UPDATE output=?", [req.params.id, downloadFileName, downloadFileName]);

            downloader.download(req.params.id, downloadFileName);

            const queuePosition = downloader.downloadQueue.length();

            return res.json({status: "queued", position: queuePosition}).end();
        } catch (e) {
            return res.json({status: "error", error: "database_or_download"}).end();
        }
    } else {
        return res.status(303).location("../status/" + req.params.id).end();
    }
});

async function getStatus(videoId) {
    const queue = [...downloader.downloadQueue];
    const inProgress = [...downloader.downloadQueue.workersList()];

    // In Queue
    for (let i = 0; i < queue.length; i++) if (queue[i].videoId === videoId) return {status: "queued", position: i + 1, canDownload: false};

    // In Progress
    for (let p = 0; p < inProgress.length; p++) if (inProgress[p].data.videoId === videoId) return {status: "processing", canDownload: false};

    try {
        // In database, completed
        const [rows] = await dbPool.query("SELECT * FROM yt_downloads WHERE video = ?", [videoId]);
        if (rows.length === 1) {
            if (rows[0].completed === 1) {
                return {status: "completed", canDownload: false};
            } else {
                return {status: "error", error: "failed", canDownload: true};
            }
        } else {
            return {status: "error", error: "not_requested", canDownload: true};
        }
    } catch (e) {
        return {status: "error", error: "db_error", canDownload: true};
    }
}

router.get('/status/:id', async function(req, res) {
    return res.json(await getStatus(req.params.id)).end();
});

module.exports = router;
