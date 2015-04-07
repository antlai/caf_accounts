var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');
var AppSession = require('../session/AppSession');
var json_rpc = require('caf_transport').json_rpc;
var cli = require('caf_cli');
var url = require('url');
var querystring = require('querystring');
var srpClient = require('caf_srp').client;

var updateF = function(state) {
    var d = {
        actionType: AppConstants.APP_UPDATE,
        state: state
    };
    AppDispatcher.dispatch(d);
};


var errorF =  function(err) {
    var d = {
        actionType: AppConstants.APP_ERROR,
        error: err
    };
    AppDispatcher.dispatch(d);
};

var wsStatusF =  function(isClosed) {
    var d = {
        actionType: AppConstants.WS_STATUS,
        isClosed: isClosed
    };
    AppDispatcher.dispatch(d);
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
    options.token = token;
    parsedGoTo.hash = '#' +  querystring.stringify(options);
    parsedGoTo.protocol = (parsedGoTo.protocol === 'ws:' ?
                          'http:': parsedGoTo.protocol);
    parsedGoTo.protocol = (parsedGoTo.protocol === 'wss:' ?
                          'https:': parsedGoTo.protocol);
    window.location.href = url.format(parsedGoTo);
};

var AppActions = {
    init: function(state) {
        updateF(state);
    },
    newToken: function(settings) {
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
                            errorF(err);
                        } else {
                            console.log('got token ' + data.slice(0,10));
                            redirect(data);
                        }
                    });
    },
    newAccount: function(settings) {
        if (!settings.passwordNew1 ||
            (settings.passwordNew1 !== settings.passwordNew2)) {
            var err = new Error('Passwords do not match, retry');
            errorF(err);
        } else {
            var account = srpClient
                .clientInstance(settings.caOwner, settings.passwordNew1)
                .newAccount();
            AppSession.newAccount(account, function(err, data) {
                                      if (err) {
                                          errorF(err);
                                      } else {
                                          console.log('ok');
                                          updateF({caOwner: settings.caOwner,
                                                   accountCreated: true});
                                      }
                                  });
        }
    },
    resetError: function() {
        errorF(null);
    }
};

AppSession.onclose = function(err) {
    console.log('Closing:' + JSON.stringify(err));
    wsStatusF(true);
};


module.exports = AppActions;
