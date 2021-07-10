const mysql = require("mysql2");
const path = require("path");
const basePath = path.join(__dirname, "..", "files", "songs");

// database pool
const dbPool = mysql.createPool({
    connectionLimit: parseInt(process.env.DB_CONNLIMIT),
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: "utf8mb4"
});

const baseUrl = '/songs/files/';
const artUrl = baseUrl + "images/";
const audioUrl = baseUrl + "audio/";
const artistUrl = '/artists/files/images/';

module.exports = {dbPool: dbPool.promise(), dbPoolSync: dbPool, basePath, baseUrl, artistUrl, artUrl, audioUrl};