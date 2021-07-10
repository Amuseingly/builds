/*
Code adapted from https://www.npmjs.com/package/youtube-search to add Proxy Support

Copyright 2021 Max Gfeller

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const axios = require('axios');
const agent = require("./getProxyAgent")(process.env.PROXY);

if (process.env.USE_PROXY.toLowerCase() === "true" && agent === false) {
    throw new Error("Use proxy is true, but you haven't provided a valid proxy URL");
}

const allowedProperties = [
    'fields',
    'channelId',
    'channelType',
    'eventType',
    'forContentOwner',
    'forDeveloper',
    'forMine',
    'location',
    'locationRadius',
    'onBehalfOfContentOwner',
    'order',
    'pageToken',
    'publishedAfter',
    'publishedBefore',
    'regionCode',
    'relatedToVideoId',
    'relevanceLanguage',
    'safeSearch',
    'topicId',
    'type',
    'videoCaption',
    'videoCategoryId',
    'videoDefinition',
    'videoDimension',
    'videoDuration',
    'videoEmbeddable',
    'videoLicense',
    'videoSyndicated',
    'videoType',
    'key'
]

module.exports = function search (term, opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }

    if (!opts) opts = {};

    if (!cb) {
        return new Promise(function (resolve, reject) {
            search(term, opts, function (err, results, pageInfo) {
                if (err) return reject(err);
                resolve({results: results, pageInfo: pageInfo});
            })
        })
    }

    var params = {
        q: term,
        part: opts.part || 'snippet',
        maxResults: opts.maxResults || 30
    }

    Object.keys(opts).map(function (k) {
        if (allowedProperties.indexOf(k) > -1) params[k] = opts[k];
    })

    const agents = agent !== false ? {httpAgent: agent, httpsAgent: agent} : {};
    axios.get('https://www.googleapis.com/youtube/v3/search', {params, ...agents})
        .then(function (response) {
            const result = response.data;

            const pageInfo = {
                totalResults: result.pageInfo.totalResults,
                resultsPerPage: result.pageInfo.resultsPerPage,
                nextPageToken: result.nextPageToken,
                prevPageToken: result.prevPageToken
            };

            const findings = result.items.map(function (item) {
                let link;
                let id;
                switch (item.id.kind) {
                    case 'youtube#channel':
                        link = 'https://www.youtube.com/channel/' + item.id.channelId;
                        id = item.id.channelId;
                        break
                    case 'youtube#playlist':
                        link = 'https://www.youtube.com/playlist?list=' + item.id.playlistId;
                        id = item.id.playlistId;
                        break
                    default:
                        link = 'https://www.youtube.com/watch?v=' + item.id.videoId;
                        id = item.id.videoId;
                        break
                }

                return {
                    id: id,
                    link: link,
                    kind: item.id.kind,
                    publishedAt: item.snippet.publishedAt,
                    channelId: item.snippet.channelId,
                    channelTitle: item.snippet.channelTitle,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnails: item.snippet.thumbnails
                }
            })

            return cb(null, findings, pageInfo);
        })
        .catch(function (err) {
            return cb(err);
        })
}