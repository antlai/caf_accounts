var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

var NewAccount = {
    doSignUp: function(ev) {
        var settings = {
            caOwner : document.getElementById('usernameNew').value,
            passwordNew1 : document.getElementById('passwordNew1').value,
            passwordNew2 : document.getElementById('passwordNew2').value
        };
        document.getElementById('passwordNew1').value = '';
        document.getElementById('passwordNew2').value = '';
        AppActions.newAccount(settings);
        this.props.onRequestHide();
    },

    passwordChange: function(ev) {
        if (ev.key === 'Enter') {
            this.doSignUp(ev);
        }
    },
    render: function() {
        return cE(rB.Modal, React.__spread({},  this.props, {
                                               bsStyle: "primary",
                                               title: "Create Account",
                                               animation: false}),
                  cE("div", {className: "modal-body"},
                     cE('p', null, 'Username',
                        cE(rB.Input, {
                               type: 'text',
                               id: 'usernameNew',
                               defaultValue: this.props.username
                           })
                       ),
                     cE('p', null, 'Password',
                        cE(rB.Input, {type: 'password',
                                      id: 'passwordNew1',
                                      onKeyDown: this.passwordChange})
                       ),
                     cE('p', null, 'Repeat Password',
                        cE(rB.Input, {type: 'password',
                                      id: 'passwordNew2',
                                      onKeyDown: this.passwordChange})
                       )
                    ),
                  cE("div", {className: "modal-footer"},
                     cE(rB.Button, {onClick: this.doSignUp}, "Sign up")
                    )
                 );
    }
};

module.exports = React.createClass(NewAccount);
