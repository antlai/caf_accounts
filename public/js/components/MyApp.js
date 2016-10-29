var React = require('react');
var rB = require('react-bootstrap');
var AppStore = require('../stores/AppStore');
var AppActions = require('../actions/AppActions');
var AppStatus = require('./AppStatus');
var NewAccount = require('./NewAccount');
var NewError = require('./NewError');
var TableToken = require('./TableToken');

var cE = React.createElement;


var MyApp = {
    getInitialState: function() {
        return AppStore.getState();
    },
    componentDidMount: function() {
        AppStore.addChangeListener(this._onChange);
        this.refs.password.getInputDOMNode().focus();
    },
    componentWillUnmount: function() {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange : function(ev) {
        this.setState(AppStore.getState());
    },
    clearPassword : function() {
        AppActions.setLocalState({
            password: ''
        });
    },
    doNewToken : function(ev) {
        var settings = {
            caOwner : this.state.caOwner,
            password : this.state.password,
            durationInSec: this.state.durationInSec,
            appLocalName : this.state.appLocalName,
            appPublisher : this.state.appPublisher,
            caLocalName :  this.state.caLocalName,
            unrestrictedToken: this.state.unrestrictedToken
        };
        AppActions.newToken(settings);
        this.clearPassword();
    },
    doSignUp:  function(ev) {
        AppActions.setLocalState({
            newAccount: true
        });
    },
    handlePasswordChange : function() {
        AppActions.setLocalState({
            password: this.refs.password.getValue()
        });
    },

    submit: function(ev) {
        if (ev.key === 'Enter') {
            this.handlePasswordChange();
            this.doNewToken(ev);
        }
    },
    render: function() {
        return cE("div", {className: "container-fluid"},
                  cE(NewError, {
                      error: this.state.error
                  }),
                  cE(NewAccount, {
                      newAccount: this.state.newAccount,
                      caOwner: this.state.caOwner
                  }),
                  cE(rB.Panel, {header: cE('h1', null,
                                           cE(AppStatus,
                                              {isClosed: this.state.isClosed}),
                                           " Accounts")},
                     cE(rB.Panel, {header: "Token for " + this.state.url},
                        cE(rB.Grid, {fluid: true},
                           cE(rB.Row, null,
                              cE(rB.Col, {xs: 10, sm:5},
                                 cE(rB.Input, {
                                     type: 'text',
                                     ref: 'username',
                                     label: 'Username',
                                     readOnly: 'true',
                                     value: this.state.caOwner
                                 })
                                ),
                              cE(rB.Col, {xs: 10, sm:5},
                                 cE(rB.Input, {
                                     type: 'password',
                                     label: 'Password',
                                     ref: 'password',
                                     value: this.state.password,
                                     onChange: this.handlePasswordChange,
                                     onKeyDown: this.submit
                                 })
                                )
                             ),
                           cE(rB.Row, null,
                              cE(rB.Col, {xs:5, sm:2},
                                 cE(rB.Button, {onClick: this.doNewToken,
                                                bsStyle: 'primary'},
                                    'Create Token')
                                ),
                              cE(rB.Col, {xs:5, sm:2},
                                 cE(rB.Button, {onClick: this.doSignUp,
                                                bsStyle: 'primary'},
                                    'Sign up')
                                )
                             )
                          )
                       ),
                     cE(rB.Panel, {header: "Details"},
                        cE(TableToken, {token :this.state})
                       )
                    )
                 );
    }
};

module.exports = React.createClass(MyApp);
