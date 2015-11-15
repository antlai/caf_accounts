var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

var NewAccount = {

    getInitialState: function() {
        return {};
    },

    doSignUp: function(ev) {
        var settings = {
            caOwner :  this.props.caOwner,
            passwordNew1 : this.state.password1,
            passwordNew2 : this.state.password2
        };
        AppActions.newAccount(settings);
        this.setState({
            password1: '',
            password2: ''
        });
//        this.doDismiss();
    },

    handlePasswordChange1 : function() {
        this.setState({
            password1: this.refs.password1.getValue()
        });
    },

    handlePasswordChange2 : function() {
        this.setState({
            password2: this.refs.password2.getValue()
        });
    },

    passwordKeyDown: function(ev) {
        if (ev.key === 'Enter') {
            this.handlePasswordChange2();
            this.doSignUp(ev);
        }
    },

    doDismiss: function(ev) {
       AppActions.setLocalState({
            newAccount: false
        });
    },

    render: function() {
        return cE(rB.Modal,{show: this.props.newAccount,
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : "bg-primary text-primary",
                      closeButton: true},
                     cE(rB.Modal.Title, null, "Create Account")
                    ),
                  cE(rB.ModalBody, null,
                     cE(rB.Input, {
                         type: 'text',
                         label: 'Username',
                         id: 'usernameNew',
                         readOnly: 'true',
                         value: this.props.caOwner
                     }),
                     cE(rB.Input, {type: 'password',
                                   ref: 'password1',
                                   label: 'Password',
                                   onChange: this.handlePasswordChange1,
                                   value : this.state.password1
                                  }),
                     cE(rB.Input, {type: 'password',
                                   ref: 'password2',
                                   label: 'Repeat Password',
                                   onChange: this.handlePasswordChange2,
                                   value : this.state.password2,
                                   onKeyDown: this.passwordKeyDown})
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doSignUp}, "Sign up")
                    )
                 );
    }
};

module.exports = React.createClass(NewAccount);
