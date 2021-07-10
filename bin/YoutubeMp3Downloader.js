/*
Code adapted from https://github.com/ytb2mp3/youtube-mp3-downloader
Licenced under the MIT Licence

The MIT License (MIT)

Copyright (c) 2015 TobiLG

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';
const os = require('os');
const EventEmitter = require('events').EventEmitter;
const ffmpeg = require('fluent-ffmpeg');
const YTDownloader = require('ytdl-core');
const async = require('async');
const progress = require('progress-stream');
const sanitize = require('sanitize-filename');
const getProxyAgent = require("./getProxyAgent");
const path = require("path");
const agent = getProxyAgent(process.env.PROXY);

// Safety Check - This is done in this file so we can't accidentally forget the proxy when calling it.
// Since if you're using a proxy, you probably don't want to make these requests over your own internet
// Connection.
if (process.env.USE_PROXY.toLowerCase() === "true" && agent === false) {
    throw new Error("Use proxy is true, but you haven't provided a valid proxy URL");
}

class YoutubeMp3Downloader extends EventEmitter {

    constructor(options) {
        super();
        this.youtubeBaseUrl = 'http://www.youtube.com/watch?v=';
        this.youtubeVideoQuality = (options && options.youtubeVideoQuality ? options.youtubeVideoQuality : 'highestaudio');
        this.outputPath = options && options.outputPath ? options.outputPath : os.homedir();
        this.queueParallelism = (options && options.queueParallelism ? options.queueParallelism : 1);
        this.progressTimeout = (options && options.progressTimeout ? options.progressTimeout : 1000);
        this.fileNameReplacements = [[/'/g, ''], [/\|/g, ''], [/\\/g, ''], [/'/g, ''], [/\//g, ''], [/\?/g, ''], [/:/g, ''], [/;/g, '']];
        this.requestOptions = (options && options.requestOptions ? options.requestOptions : { maxRedirects: 5, });
        if (agent !== false) this.requestOptions.agent = agent;
        this.outputOptions = (options && options.outputOptions ? options.outputOptions : []);
        this.allowWebm = (options && options.allowWebm ? options.allowWebm : false);

        if (options && options.ffmpegPath) {
            ffmpeg.setFfmpegPath(options.ffmpegPath);
        }

        this.setupQueue();
    }

    setupQueue() {
        let self = this;
        //Async download/transcode queue
        this.downloadQueue = async.queue(function (task, callback) {
            self.emit('queueSize', self.downloadQueue.running() + self.downloadQueue.length());

            self.performDownload(task, function(err, result) {
                callback(err, result);
            });

        }, self.queueParallelism);
    }

    cleanFileName (fileName) {
        this.fileNameReplacements.forEach(function(replacement) {
            fileName = fileName.replace(replacement[0], replacement[1]);
        });
        return fileName;
    };

    download (videoId, fileName) {
        let self = this;
        const task = {
            videoId: videoId,
            fileName: fileName
        };

        this.downloadQueue.push(task, function (err, data) {

            self.emit('queueSize', self.downloadQueue.running() + self.downloadQueue.length());

            if (err) {
                self.emit('error', err, data);
            } else {
                self.emit('finished', err, data);
            }
        });

    };

    async performDownload(task, callback) {
        let self = this;
        let info;
        const videoUrl = this.youtubeBaseUrl+task.videoId;
        let resultObj = {
            videoId: task.videoId
        };

        let shortFileName = task.fileName;

        try {
            info = await YTDownloader.getInfo(videoUrl, { quality: this.youtubeVideoQuality, requestOptions: self.requestOptions })
        } catch (err){
            callback(err);
        }

        const videoTitle = this.cleanFileName(info.videoDetails.title);
        let artist = 'Unknown';
        let artistArray = [];
        let title = 'Unknown';
        const thumbnail = info.videoDetails.thumbnails ?
            info.videoDetails.thumbnails[0].url
            : info.videoDetails.thumbnail || null;

        if (videoTitle.indexOf('-') > -1) {
            var temp = videoTitle.split('-');
            if (temp.length >= 2) {

                title = temp[1].trim();
                title = title.replace(/ ?([(\[])?(Lyric|Official|Music).*(Video|\))([)\]])?/gi, '');
                title = title.replace(/ ?\[.* Edition]/, ''); // Country version videos

                let potentialFeatures = title.match(/\(?(?:feat.|Ft.|Featuring) .*\)?/i);
                if (potentialFeatures !== null) {
                    potentialFeatures = potentialFeatures[0];
                    potentialFeatures = potentialFeatures.replace("(", "");
                    potentialFeatures = potentialFeatures.replace(")", "");
                    potentialFeatures = potentialFeatures.replace(/(?:feat\.|Ft\.|Featuring)?/gi, "");
                    potentialFeatures = potentialFeatures.trim();
                    potentialFeatures = potentialFeatures.split(/(?: ?& ?| ?and ?)/gi);
                    let featureString;
                    if (potentialFeatures.length > 0) {
                        if (potentialFeatures.length > 2) {
                            let last = potentialFeatures.slice(-1);
                            featureString = "(feat. " + potentialFeatures.join(", ") + " & " + last + ")";
                        } else {
                            featureString = "(feat. " + potentialFeatures.join(" & ") + ")";
                        }
                        title = title.replace(/\(?(?:feat\.|Ft\.|Featuring) .*\)?/gi, featureString);
                        artistArray = [...potentialFeatures];
                    }
                }


                artist = temp[0].trim();
                // Fix Feat. in the artist section
                artist = artist.replace(/(?:feat\.|Ft\.|Featuring)/gi, "&");
                artistArray = [...artist.split(/(?: ?, ?| ? and ?| ?& ?)/gi), ...artistArray];
                if (artistArray.length > 1) {
                    artist = artistArray.join("; ");
                }
            }
        } else {
            title = videoTitle;
            artistArray = [info.videoDetails.ownerChannelName];
            artist = artistArray.join("; ");
        }

        //Derive file name, if given, use it, if not, from video title
        const fileName = (task.fileName ? path.join(self.outputPath, task.fileName) : path.join(self.outputPath, (sanitize(videoTitle) || info.videoId) + '.mp3'));

        //Stream setup

        const streamOptions =  {
            quality: self.youtubeVideoQuality,
            requestOptions: self.requestOptions
        };

        if (!self.allowWebm) {
            streamOptions.filter = format => format.container === 'mp4';
        }

        const stream = YTDownloader.downloadFromInfo(info, streamOptions);

        stream.on('error', function(err){
            callback(err, null);
        });

        stream.on('response', function(httpResponse) {

            //Setup of progress module
            const str = progress({
                length: parseInt(httpResponse.headers['content-length']),
                time: self.progressTimeout
            });

            //Add progress event listener
            str.on('progress', function(progress) {
                if (progress.percentage === 100) {
                    resultObj.stats= {
                        transferredBytes: progress.transferred,
                        runtime: progress.runtime,
                        averageSpeed: parseFloat(progress.speed.toFixed(2))
                    }
                }
                self.emit('progress', {videoId: task.videoId, progress: progress})
            });
            let outputOptions = [
                '-id3v2_version', '4',
                '-metadata', 'title=' + title,
                '-metadata', 'artist=' + artist,
            ];
            if (self.outputOptions) {
                outputOptions = outputOptions.concat(self.outputOptions);
            }

            const audioBitrate =
                info.formats.find(format => !!format.audioBitrate).audioBitrate

            //Start encoding
            new ffmpeg({
                source: stream.pipe(str)
            })
                .audioBitrate(audioBitrate || 192)
                .withAudioCodec('libmp3lame')
                .toFormat('mp3')
                .outputOptions(...outputOptions)
                .on('error', function(err) {
                    callback(err.message, null);
                })
                .on('end', function() {
                    resultObj.file =  shortFileName;
                    resultObj.youtubeUrl = videoUrl;
                    resultObj.videoTitle = videoTitle;
                    resultObj.artist = artist;
                    resultObj.title = title;
                    resultObj.thumbnail = thumbnail;
                    resultObj.artistArray = artistArray;
                    callback(null, resultObj);
                })
                .saveToFile(fileName);
        });

    };

}

module.exports = YoutubeMp3Downloader;