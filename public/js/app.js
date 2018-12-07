var React = require('react');
var ReactDOM = require('react-dom');
var AppSession = require('./session/AppSession');
var MyApp = require('./components/MyApp');
var url = require('url');
var querystring = require('querystring');
var json_rpc = require('caf_transport').json_rpc;
var cE = React.createElement;
var redux = require('redux');
var AppReducer = require('./reducers/AppReducer');

var initOptions = function() {
    var options = {};
    var parsedURL = url.parse(window.location.href);
    if (parsedURL.hash && (parsedURL.hash.indexOf('#') === 0)) {
        options = Object.assign({}, options,
                                querystring.parse(parsedURL.hash.slice(1)));
    }
    options.unrestrictedToken = (options.unrestrictedToken === 'true' ? true :
                                 false);
    options.newAccount = (options.newAccount === 'true' ? true : false);

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
    return options;
};

exports.main = async function() {
    var ctx =  {
        store: redux.createStore(AppReducer,
                                 window.__REDUX_DEVTOOLS_EXTENSION__ &&
                                 window.__REDUX_DEVTOOLS_EXTENSION__())
    };
    try {
        await AppSession.connect(ctx, initOptions());
        ReactDOM.render(cE(MyApp, {ctx: ctx}),
                        document.getElementById('content'));
    } catch (err) {
        console.log('Cannot connect:' + err);
    }
};
