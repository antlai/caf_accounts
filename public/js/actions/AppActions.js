const AppConstants = require('../constants/AppConstants');
const cli = require('caf_cli');
const url = require('url');
const querystring = require('querystring');
const srpClient = require('caf_srp').client;
const json_rpc = require('caf_transport').json_rpc;

const updateF = function(store, state) {
    const d = {
        type: AppConstants.APP_UPDATE,
        state: state
    };
    store.dispatch(d);
};

const errorF =  function(store, err) {
    const d = {
        type: AppConstants.APP_ERROR,
        error: err
    };
    store.dispatch(d);
};

const notifyF = function(store, message) {
    const getNotifData = function(msg) {
        return json_rpc.getMethodArgs(msg)[0];
    };
    const d = {
        type: AppConstants.APP_NOTIFICATION,
        state: getNotifData(message)
    };
    store.dispatch(d);
};

const wsStatusF =  function(store, isClosed) {
    const d = {
        type: AppConstants.WS_STATUS,
        isClosed: isClosed
    };
    store.dispatch(d);
};


const stripURL = function(x) {
    const accountsURL = url.parse(window.location.href);
    delete accountsURL.hash;
    delete accountsURL.search;
    return url.format(accountsURL);
};

const redirect = function(token) {
    const parsedURL = url.parse(window.location.href);
    const options = querystring.parse(parsedURL.hash.slice(1));
    const parsedGoTo = url.parse(options.goTo);
    delete options.goTo;
    delete options.unrestrictedToken;
    delete options.newAccount;
    delete options.resetAccount;
    options.token = token;
    parsedGoTo.hash = '#' +  querystring.stringify(options);
    parsedGoTo.protocol = (parsedGoTo.protocol === 'ws:' ?
                          'http:': parsedGoTo.protocol);
    parsedGoTo.protocol = (parsedGoTo.protocol === 'wss:' ?
                          'https:': parsedGoTo.protocol);
    window.location.href = url.format(parsedGoTo);
};

const AppActions = {
    async init(ctx, initialData) {
        try {
            const key = await ctx.session.getSiteKey().getPromise();
            updateF(ctx.store, Object.assign({}, initialData, key));
        } catch (err) {
            errorF(ctx.store, err);
        }
    },
    newToken(ctx, settings) {
        const spec = {
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
        const tf = cli.TokenFactory(spec);
        tf.newToken(null, function(err, data) {
            if (err) {
                errorF(ctx.store, err);
            } else {
                console.log('got token ' + data.slice(0,10));
                redirect(data);
            }
        });
    },
    message(ctx, msg) {
        console.log('message:' + JSON.stringify(msg));
        notifyF(ctx.store, msg);
    },
    closing(ctx, err) {
        console.log('Closing:' + JSON.stringify(err));
        wsStatusF(ctx.store, true);
    },
    setError(ctx, error) {
        errorF(ctx.store, error);
    },
    resetError(ctx) {
        errorF(ctx.store, null);
    },
    setLocalState(ctx, data) {
        updateF(ctx.store, data);
    }
};

const EXTERNAL_METHODS = [
    'disableUser', 'enableUser', 'listDisabledUsers',
    'newAccount', 'activateAccount', 'isRegistered',
    'lookupUsername', 'newResetChallenge', 'resetAccount',
    'attenuateToken'
];

EXTERNAL_METHODS.forEach(function(x) {
    AppActions[x] = async function() {
        const args = Array.prototype.slice.call(arguments);
        const ctx = args.shift();
        try {
            const data =  await ctx.session[x].apply(ctx.session, args)
                  .getPromise();
            data && updateF(ctx.store, data);
        } catch (err) {
            if (['newAccount','activateAccount'].includes(x)) {
                // retry...
                AppActions.setLocalState(ctx, {codeRequested: false,
                                               newAccount: true});
            }
            if (['newResetChallenge','resetAccount'].includes(x)) {
                // retry...
                AppActions.setLocalState(ctx, {resetCodeRequested: false,
                                               resetAccount: true});
            }
            errorF(ctx.store, err);
        }
    };
});



module.exports = AppActions;
