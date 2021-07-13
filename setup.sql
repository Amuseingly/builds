CREATE DATABASE IF NOT EXISTS amuseing CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
USE amuseing;

CREATE TABLE IF NOT EXISTS `audio_artists` (
  `_id` int(11) NOT NULL,
  `name` tinytext COLLATE utf8mb4_bin NOT NULL,
  `iconUrl` tinytext COLLATE utf8mb4_bin
)  ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `audio_songs` (
  `_id` int(11) NOT NULL,
  `title` tinytext COLLATE utf8mb4_bin NOT NULL,
  `audioUrl` tinytext COLLATE utf8mb4_bin NOT NULL,
  `iconUrl` tinytext COLLATE utf8mb4_bin NOT NULL,
  `sourceId` tinytext COLLATE utf8mb4_bin NOT NULL,
  `sourceType` tinytext COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `audio_song_artists` (
  `song_id` int(11) NOT NULL,
  `artist_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `yt_downloads` (
  `video` varchar(11) COLLATE utf8mb4_bin NOT NULL,
  `output` tinytext COLLATE utf8mb4_bin NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

ALTER TABLE `audio_artists`
  ADD PRIMARY KEY (`_id`);

ALTER TABLE `audio_songs`
  ADD PRIMARY KEY (`_id`);

ALTER TABLE `audio_song_artists`
  ADD PRIMARY KEY (`song_id`,`artist_id`);

ALTER TABLE `yt_downloads`
  ADD PRIMARY KEY (`video`);

ALTER TABLE `audio_artists`
  MODIFY `_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `audio_songs`
  MODIFY `_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
