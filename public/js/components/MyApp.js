var React = require('react');
var rB = require('react-bootstrap');
var AppStore = require('../stores/AppStore');
var AppActions = require('../actions/AppActions');
var AppStatus = require('./AppStatus');
var NewAccount = require('./NewAccount');
var NewError = require('./NewError');

var cE = React.createElement;

var safeParseInt = function(x) {
    var result = parseInt(document.getElementById(x).value);
    return (isNaN(result) ? undefined : result);
};

var safeParseString = function(x) {
    var result = document.getElementById(x).value;
    return (((typeof result === 'string') && (result !== 'ANY')) ? result :
            undefined);
};


var MyApp = {
    getInitialState: function() {
        return AppStore.getState();
    },
    componentDidMount: function() {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function() {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange : function(ev) {
        this.setState(AppStore.getState());
    },
    doNewToken : function(ev) {
        ev.stopPropagation();
        var settings = {
            caOwner : document.getElementById('username').value,
            password : document.getElementById('password').value,
            durationInSec: safeParseInt('durationInSec'),
            appLocalName : safeParseString('appLocalName'),
            appPublisher :  safeParseString('appPublisher'),
            caLocalName :  safeParseString('caLocalName'),
            unrestrictedToken: this.state.unrestrictedToken
        };
        document.getElementById('password').value = '';
        AppActions.newToken(settings);
    },
    submit: function(ev) {
        if (ev.key === 'Enter') {
            this.doNewToken(ev);
        }
    },
    render: function() {
        var self = this;
        var ifUnrestricted = function(label) {
          return (self.state.unrestrictedToken ? 'ANY' : self.state[label]);
        };
        return cE("div", {className: "container-fluid"},
                  cE(NewError, {
                         error: self.state.error
                     }),
                  cE(rB.Panel, {header: cE('h1', null,
                                           cE(AppStatus,
                                              {isClosed: this.state.isClosed}),
                                           " Accounts")},
                     cE(rB.Panel, {header: "Token for " + this.state.url},
                        cE(rB.Grid, null,
                           cE(rB.Row, null,
                              cE(rB.Col, {sm:5},
                                 cE('p', null, 'CA Owner',
                                    cE(rB.Input, {
                                           type: 'text', id: 'caOwner',
                                           readOnly: 'true',
                                           value : this.state.caOwner,
                                           defaultValue: 'ANY'
                                       })
                                   ),
                                 cE('p', null, 'CA Local Name',
                                    cE(rB.Input, {
                                           type: 'text',
                                           readOnly: 'true',
                                           id: 'caLocalName',
                                           value :
                                           ifUnrestricted('caLocalName'),
                                           defaultValue: 'ANY'
                                       })
                                   )
                                ),
                              cE(rB.Col, {sm:5},
                                 cE('p', null, 'Application Publisher',
                                    cE(rB.Input, {
                                           type: 'text', id: 'appPublisher',
                                           readOnly: 'true',
                                           value:
                                           ifUnrestricted('appPublisher'),
                                           defaultValue: 'ANY'
                                       })
                                   ),
                                 cE('p', null, 'Application Local Name',
                                    cE(rB.Input, {
                                           type: 'text',
                                           readOnly: 'true',
                                           id: 'appLocalName',
                                           value:
                                           ifUnrestricted('appLocalName'),
                                           defaultValue: 'ANY'
                                       })
                                   )
                                )
                             ),
                           cE(rB.Row, null,
                              cE(rB.Col, {sm:5},
                                 cE('p', null, 'Duration in seconds',
                                    cE(rB.Input, {
                                           type: 'text', id: 'durationInSec',
                                           readOnly: 'true',
                                           value: this.state.durationInSec,
                                           defaultValue: 'ANY'
                                       })
                                   )
                                ),
                              cE(rB.Col, {sm:5},
                                 cE('p', null, 'Special Token',
                                    (this.state.unrestrictedToken ?
                                     cE(rB.Alert, {bsStyle: 'danger'},
                                        'WARNING: UNRESTRICTED TOKEN!!') : '')
                                   )
                                )
                             )
                          )
                       ),
                     cE(rB.Panel, {header: "Login"},
                        cE(rB.Grid, null,
                           cE(rB.Row, null,
                              cE(rB.Col, {sm:5},
                                 cE('p', null, 'Username',
                                    cE(rB.Input, {
                                           type: 'text', id: 'username',
                                           readOnly: 'true',
                                           value: this.state.caOwner,
                                           defaultValue: 'ANY'
                                       })
                                   )
                                ),
                              cE(rB.Col, {sm:5},
                                 cE('p', null, 'Password',
                                    cE(rB.Input, {type: 'password',
                                                  id: 'password',
                                                  onKeyDown: this.submit
                                                 })
                                   )
                                )
                             ),
                           cE(rB.Row, null,
                              cE(rB.Col, {sm:5},
                                 cE(rB.Button, {onClick: this.doNewToken,
                                                bsStyle: 'primary'},
                                    'Create Token')
                                )
                             )
                          )
                       ),
                     cE(rB.Panel, {header: 'No Account?'},
                        cE(rB.Grid, null,
                           cE(rB.Row, null,
                              cE(rB.Col, {sm:5},
                                 cE(rB.ModalTrigger, {
                                        modal : cE(NewAccount, {
                                                       username: this.state
                                                           .caOwner
                                                   })
                                    },
                                    cE(rB.Button, {bsStyle: 'primary'},
                                       'Sign up')
                                   )
                                )
                             )
                          )
                       )
                    )
                 );
    }
};

module.exports = React.createClass(MyApp);
