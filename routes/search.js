const express = require('express');
const router = express.Router();
const search = require("../bin/YoutubeSearch");
const {dbPool, audioUrl, artUrl} = require("../bin/utils");

const processRows = (rows) => {
    if (rows.length > 0) {
        let newRows = [];
        let seenBefore = [];
        for (let i = 0; i < rows.length; i++) {
            if (!seenBefore.includes(rows[i]._id)) {
                rows[i].audioUrl = audioUrl + rows[i].audioUrl;
                if (rows[i].iconUrl !== null) rows[i].iconUrl = artUrl + rows[i].iconUrl;
                newRows.push(rows[i]);
                seenBefore.push(rows[i]._id);
            }
        }
        return newRows;
    } else {
        return [];
    }
}

router.get('/query', async function(req, res) {
    if(req.query.q) {
        try {
            let searchProcessed = ".*" + req.query.q.toLowerCase().replace(/ /g, ".*") + ".*";

            const [rows] = await dbPool.query("SELECT audio_songs._id, sourceId, (SELECT COALESCE(GROUP_CONCAT(name),\"\") FROM audio_song_artists LEFT JOIN audio_artists ON audio_song_artists.artist_id = audio_artists._id WHERE audio_song_artists.song_id = audio_songs._id ) as all_artists, title, COALESCE(name,\"\") as name, audioUrl, audio_songs.iconUrl FROM audio_songs LEFT JOIN audio_song_artists ON audio_song_artists.song_id = audio_songs._id LEFT JOIN audio_artists ON audio_song_artists.artist_id = audio_artists._id WHERE LOWER(CONCAT(title, \" \", name, \" \" , sourceId)) REGEXP ?", [searchProcessed]);

            res.json(processRows(rows)).end();
        } catch (e) {
            res.json({error: "database"}).end();
        }
    } else if (req.query.random) {
        const [rows] = await dbPool.query("SELECT audio_songs._id, sourceId, (SELECT COALESCE(GROUP_CONCAT(name),\"\") FROM audio_song_artists LEFT JOIN audio_artists ON audio_song_artists.artist_id = audio_artists._id WHERE audio_song_artists.song_id = audio_songs._id ) as all_artists, title, COALESCE(name,\"\") as name, audioUrl, audio_songs.iconUrl FROM audio_songs LEFT JOIN audio_song_artists ON audio_song_artists.song_id = audio_songs._id LEFT JOIN audio_artists ON audio_song_artists.artist_id = audio_artists._id ORDER BY RAND();");
        res.json(processRows(rows)).end();
    } else {
        res.json({error: "no_query"}).end();
    }
});

router.get("/yt", async function(req, res) {
    if (req.query.q) {
        try {
            const results = await search(req.query.q, {key: process.env.YT_SEARCH_APIKEY, type: "video"});
            res.json(results).end();
        } catch (e) {
            res.json({error: "quota_or_youtube"}).end();
        }
    } else {
        res.json({error: "no_query"}).end();
    }
});

module.exports = router;