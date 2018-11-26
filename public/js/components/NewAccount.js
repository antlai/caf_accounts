var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

class  NewAccount extends React.Component {

    constructor(props) {
        super(props);
        this.state = {password1: '', password2: ''};
        this.doDismiss = this.doDismiss.bind(this);
        this.handlePasswordChange1 = this.handlePasswordChange1.bind(this);
        this.handlePasswordChange2 = this.handlePasswordChange2.bind(this);
        this.passwordKeyDown = this.passwordKeyDown.bind(this);
        this.doSignUp = this.doSignUp.bind(this);
    }

    doSignUp(ev) {
        var settings = {
            caOwner:  this.props.caOwner,
            passwordNew1: this.state.password1,
            passwordNew2: this.state.password2
        };
        AppActions.newAccount(this.props.ctx, settings);

        if (settings.passwordNew1 &&
            (settings.passwordNew1 === settings.passwordNew2)) {
            AppActions.setLocalState(this.props.ctx, {
                password: settings.passwordNew1
            });
        }

        this.setState({
            password1: '',
            password2: ''
        });
    }

    handlePasswordChange1(ev) {
        this.setState({
            password1: ev.target.value
        });
    }

    handlePasswordChange2(ev) {
        this.setState({
            password2: ev.target.value
        });
    }

    passwordKeyDown(ev) {
        if (ev.key === 'Enter') {
            this.doSignUp(ev);
        }
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {
           newAccount: false
        });
    }

    render() {
        return cE(rB.Modal,{show: this.props.newAccount,
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : "bg-primary text-primary",
                      closeButton: true},
                     cE(rB.Modal.Title, null, "Create Account")
                    ),
                  cE(rB.ModalBody, null,
                     cE(rB.FormGroup, { controlId: 'usernameNewId' },
                        cE(rB.ControlLabel, null, 'Username'),
                        cE(rB.FormControl, {
                            type: 'text',
                            readOnly: true,
                            value: this.props.caOwner
                        })
                       ),
                     cE(rB.FormGroup, { controlId: 'password1Id' },
                        cE(rB.ControlLabel, null, 'Password'),
                        cE(rB.FormControl, {
                            type: 'password',
                            onChange: this.handlePasswordChange1,
                            value: this.state.password1
                        })
                       ),
                     cE(rB.FormGroup, { controlId: 'password2Id' },
                        cE(rB.ControlLabel, null, 'Repeat Password'),
                        cE(rB.FormControl, {
                            type: 'password',
                            onChange: this.handlePasswordChange2,
                            value: this.state.password2,
                            onKeyPress: this.passwordKeyDown
                        })
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, "Cancel"),
                     cE(rB.Button, {onClick: this.doSignUp, bsStyle:'primary'},
                        "Sign up")
                    )
                 );
    }
};

module.exports = NewAccount;
