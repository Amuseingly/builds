const {SocksProxyAgent} = require("socks-proxy-agent");

module.exports = function getProxyAgent(proxyString) {
    if (proxyString.toLowerCase().startsWith("socks")) {
        return (new SocksProxyAgent(proxyString));
    }

    return false;
}