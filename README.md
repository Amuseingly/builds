# Amuseing
A web player for your music. Supports importing manually to the database and automatically via YouTube.

**Live Demo: http://amusefrym5snmpoaewubzwnor3r3nt3jjmru3rcmg64affbwzehamhid.onion/ (Requires [Tor Browser](https://www.torproject.org/download/)) - For obvious reasons, on this instance, youtube downloading has been disabled, so that people can't download infringing material.**

## Requirements:

The **text in bold** specifies the versions of the software this build was tested with.

- [Node **>14.17.3** + npm](https://nodejs.org/en/)
- [ffmpeg **Latest**](https://ffmpeg.org/download.html) - This will need to be in your system path / globally available.
- [MySQL/**MariaDB** Server](https://mariadb.org/)

## Setup:

First `git clone` this repository and then `cd amuseing-builds`

First, run `npm i` to install all the requirements for this project.

If ytdl complains about being out of date, use `npm i ytdl-core@latest`.

Next, if you do not have pm2 installed, run `npm i -g pm2` to install pm2. PM2 is used to run your process in the background.

Then, run `setup.sql` in your database to create the required structure for this application to work.

Next, run `node setup.js` to create all the required empty directories.

Then, copy .example.env to .env and edit it with the information for your socks proxy (if you want to use one, else set use_proxy to false) and add your database information. If you wish to enable YouTube search within your application, please [get a YouTube Data API v3 Key Here](https://developers.google.com/youtube/v3/getting-started) and add it to your .env file.

Finally, run the application with `pm2 start bin/www --name amuseing` or, if using node in screen or similar `node bin/www`.

The application will be available at `localhost:3000`

To stop it, use `pm2 stop amuseing`.

## Disclaimer:

Please abide by the YouTube terms of service when downloading audio from YouTube. Only do it on videos you have created or own or otherwise have rights to do so.
