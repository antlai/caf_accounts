

var React = require('react');
var AppSession = require('./session/AppSession');
var MyApp = require('./components/MyApp');
var AppActions = require('./actions/AppActions');
var url = require('url');
var querystring = require('querystring');

var json_rpc = require('caf_transport').json_rpc;

var cE = React.createElement;

var options = {};

AppSession.onopen = function() {
    console.log('open session');
    React.render(
        cE(MyApp, null),
        document.getElementById('content')
    );
    AppActions.init(options);
};

var mixin = function(dest, source) {
    source = source || {};
    Object.keys(source).forEach(function(x) {
                                    if (source.hasOwnProperty(x)) {
                                        dest[x] = source[x];
                                    }
                                });
};


exports.main = function() {
    var parsedURL = url.parse(window.location.href);
    if (parsedURL.hash && (parsedURL.hash.indexOf('#') === 0)) {
         mixin(options, querystring.parse(parsedURL.hash.slice(1)));
    }
    options.unrestrictedToken = (options.unrestrictedToken === 'true' ? true :
                                 false);
    if (!isNaN(parseInt(options.durationInSec))) {
        options.durationInSec = parseInt(options.durationInSec);
    }

    var parsedGoTo = url.parse(options.goTo);

    options.url = url.format(parsedGoTo);
    var h = json_rpc.splitName(parsedGoTo.hostname.split('.')[0]);
    options.appPublisher = h[0];
    options.appLocalName = h[1];
    h = json_rpc.splitName(options.from);
    options.caOwner = h[0];
    options.caLocalName = h[1];

    console.log('Starting Accounts');
};
