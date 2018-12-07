var AppConstants = require('../constants/AppConstants');
var cli = require('caf_cli');
var url = require('url');
var querystring = require('querystring');
var srpClient = require('caf_srp').client;
var json_rpc = require('caf_transport').json_rpc;

var updateF = function(store, state) {
    var d = {
        type: AppConstants.APP_UPDATE,
        state: state
    };
    store.dispatch(d);
};

var errorF =  function(store, err) {
    var d = {
        type: AppConstants.APP_ERROR,
        error: err
    };
    store.dispatch(d);
};

var notifyF = function(store, message) {
    var getNotifData = function(msg) {
        return json_rpc.getMethodArgs(msg)[0];
    };
    var d = {
        type: AppConstants.APP_NOTIFICATION,
        state: getNotifData(message)
    };
    store.dispatch(d);
};

var wsStatusF =  function(store, isClosed) {
    var d = {
        type: AppConstants.WS_STATUS,
        isClosed: isClosed
    };
    store.dispatch(d);
};


var stripURL = function(x) {
    var accountsURL = url.parse(window.location.href);
    delete accountsURL.hash;
    delete accountsURL.search;
    return url.format(accountsURL);
};

var redirect = function(token) {
    var parsedURL = url.parse(window.location.href);
    var options = querystring.parse(parsedURL.hash.slice(1));
    var parsedGoTo = url.parse(options.goTo);
    delete options.goTo;
    delete options.unrestrictedToken;
    delete options.newAccount;
    options.token = token;
    parsedGoTo.hash = '#' +  querystring.stringify(options);
    parsedGoTo.protocol = (parsedGoTo.protocol === 'ws:' ?
                          'http:': parsedGoTo.protocol);
    parsedGoTo.protocol = (parsedGoTo.protocol === 'wss:' ?
                          'https:': parsedGoTo.protocol);
    window.location.href = url.format(parsedGoTo);
};

var AppActions = {
    async init(ctx, state) {
        try {
            var key = await ctx.session.getSiteKey().getPromise();
            updateF(ctx.store, Object.assign({}, state, {siteKey: key}));
        } catch (err) {
            errorF(ctx.store, err);
        }
    },
    newToken(ctx, settings) {
        var spec = {
            log: function(x) { console.log(x);},
            securityClient: srpClient,
            accountsURL: stripURL(),
            password: settings.password,
            from: settings.caOwner + '-' + settings.caLocalName,
            durationInSec: settings.durationInSec,
            appLocalName : settings.appLocalName,
            appPublisher : settings.appPublisher,
            unrestrictedToken: settings.unrestrictedToken
        };
        var tf = cli.TokenFactory(spec);
        tf.newToken(null, function(err, data) {
            if (err) {
                errorF(ctx.store, err);
            } else {
                console.log('got token ' + data.slice(0,10));
                redirect(data);
            }
        });
    },
    async newAccount(ctx, settings) {
        if (!settings.passwordNew1 ||
            (settings.passwordNew1 !== settings.passwordNew2)) {
            var err = new Error('Passwords do not match, please retry');
            errorF(ctx.store, err);
        } else if (!settings.reCaptcha) {
            err = new Error('Missing captcha, please retry');
            errorF(ctx.store, err);
        } else {
            try {
                var account = srpClient
                        .clientInstance(settings.caOwner, settings.passwordNew1)
                        .newAccount();
                await ctx.session.newAccount(account, settings.reCaptcha)
                    .getPromise();
                console.log('ok');
                updateF(ctx.store, {newAccount: false});
            } catch (err) {
                errorF(ctx.store, err);
            };
        }
    },
    message(ctx, msg) {
        console.log('message:' + JSON.stringify(msg));
        notifyF(ctx.store, msg);
    },
    closing(ctx, err) {
        console.log('Closing:' + JSON.stringify(err));
        wsStatusF(ctx.store, true);
    },
    resetError(ctx) {
        errorF(ctx.store, null);
    },
    setLocalState(ctx, data) {
        updateF(ctx.store, data);
    }
};

module.exports = AppActions;
