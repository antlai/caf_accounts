var cli = require('caf_cli');
var urlParser = require('url');
var AppActions = require('../actions/AppActions');

var stripURL = function()  {
    var url = urlParser.parse(window.location.href);
    delete url.hash;
    return urlParser.format(url);
};

exports.connect = function(ctx, options) {
    return new Promise((resolve, reject) => {
        var nobodyCA = 'NOBODY-' + options.caOwner.substring(0, 2);
        var session = new cli.Session(stripURL(), nobodyCA, {
            disableBackchannel: true,
            from: nobodyCA
        });

        session.onopen = async function() {
            console.log('open session');
            try {
                resolve(await AppActions.init(ctx, options));
            } catch (err) {
                reject(err);
            }
        };

        session.onmessage = function(msg) {
            console.log('message:' + JSON.stringify(msg));
            AppActions.message(ctx, msg);
        };

        session.onclose = function(err) {
            console.log('Closing:' + JSON.stringify(err));
            AppActions.closing(ctx, err);
            err && reject(err); // no-op if session already opened
        };

        ctx.session = session;
    });
};
