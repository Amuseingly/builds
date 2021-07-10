const express = require('express');
const path = require("path");
const router = express.Router();

router.use("/files", express.static(path.join(__dirname, "..", "files", "artists")));

module.exports = router;