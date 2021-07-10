var express = require('express');
const path = require("path");
const {artistUrl, audioUrl, artUrl} = require("../bin/utils");
var router = express.Router();
const {dbPool} = require("../bin/utils");

router.use("/files", express.static(path.join(__dirname, "..", "files", "songs")));

router.get('/:platform/:id/details', async function (req, res) {
    try {
        const [rows] = await dbPool.query("SELECT * FROM audio_songs WHERE sourceType = ? AND sourceId = ?", [req.params.platform, req.params.id]);

        if (rows.length > 0) {
            const [details] = rows;
            delete details.sourceId;
            delete details.sourceType;

            const [artists] = await dbPool.query("SELECT audio_artists.* FROM `audio_song_artists` LEFT JOIN audio_artists ON artist_id = _id WHERE `song_id` = ?;", [details._id]);

            details.audioUrl = audioUrl + details.audioUrl;
            if (details.iconUrl !== null) details.iconUrl = artUrl + details.iconUrl;

            for (let i = 0; i < artists.length; i++) if (artists[i].iconUrl !== null) artists[i].iconUrl = artistUrl + artists[i].iconUrl;

            details.artists = artists;

            return res.json(details).end();
        } else {
            return res.json({"error": "not_found"}).end();
        }
    } catch (e) {
        return res.json({"error": "database_error"}).end();
    }
});

router.get('/:id/details', async function (req, res) {
    try {
        const [rows] = await dbPool.query("SELECT * FROM audio_songs WHERE _id=?", [req.params.id]);

        if (rows.length > 0) {
            const [details] = rows;
            delete details.sourceId;
            delete details.sourceType;

            details.audioUrl = audioUrl + details.audioUrl;
            if (details.iconUrl !== null) details.iconUrl = artUrl + details.iconUrl;

            const [artists] = await dbPool.query("SELECT audio_artists.* FROM `audio_song_artists` LEFT JOIN audio_artists ON artist_id = _id WHERE `song_id` = ?;", [details._id]);

            for (let i = 0; i < artists.length; i++) if (artists[i].iconUrl !== null) artists[i].iconUrl = artistUrl + artists[i].iconUrl;

            details.artists = artists;

            return res.json(details).end();
        } else {
            return res.json({"error": "not_found"}).end();
        }
    } catch (e) {
        return res.json({"error": "database_error"}).end();
    }
});

module.exports = router;
