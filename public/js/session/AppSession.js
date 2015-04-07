var cli = require('caf_cli');
var urlParser = require('url');

var stripURL = function()  {
    var url = urlParser.parse(window.location.href);
    delete url.hash;
    return urlParser.format(url);
};

module.exports = new cli.Session(stripURL(), 'NOBODY-UNKNOWN', {
                                     disableBackchannel: true
                                 });
