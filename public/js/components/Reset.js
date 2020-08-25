var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var reCap = require('react-google-recaptcha');
var ReCAPTCHA = reCap.default;
var srpClient = require('caf_srp').client;


class Reset extends React.Component {

    constructor(props) {
        super(props);
        this.state = {password1: '', password2: '', reCaptcha: null};
        this.doDismiss = this.doDismiss.bind(this);
        this.handlePasswordChange1 = this.handlePasswordChange1.bind(this);
        this.handlePasswordChange2 = this.handlePasswordChange2.bind(this);
        this.passwordKeyDown = this.passwordKeyDown.bind(this);
        this.doReset = this.doReset.bind(this);
        this.handleReCaptcha = this.handleReCaptcha.bind(this);
        this.doRequestCode = this.doRequestCode.bind(this);
        this.handleEmail = this.handleEmail.bind(this);
        this.handleResetCode = this.handleResetCode.bind(this);
    }

    doRequestCode(ev) {
        if (this.props.caOwner && this.state.reCaptcha && this.props.email) {
            AppActions.newResetChallenge(this.props.ctx, this.props.caOwner,
                                        this.state.reCaptcha, this.props.email);
            AppActions.setLocalState(this.props.ctx,
                                     {resetCodeRequested: true});
        } else {
            AppActions.setError(this.props.ctx, new Error('Invalid data'));
        }
    }

    doReset(ev) {
        const {password1, password2} = this.state;

        if (this.props.caOwner && this.props.resetCode) {
            if (password1 && (password1 === password2)) {
                const account = srpClient
                    .clientInstance(this.props.caOwner, password1)
                    .newAccount();
                AppActions.resetAccount(this.props.ctx, account,
                                           this.props.resetCode);
                AppActions.setLocalState(this.props.ctx, {
                    password: password1,
                    resetAccount: false
                });
            } else {
                AppActions.setError(this.props.ctx,
                                    new Error('Passwords do not match'));
            }
            this.setState({password1: '', password2: ''});
        } else {
            AppActions.setError(this.props.ctx, new Error('Missing code'));
        }
    }

    handleEmail(ev) {
        AppActions.setLocalState(this.props.ctx, {email: ev.target.value});
    }

    handleResetCode(ev) {
        const code = ev.target.value || '';
        AppActions.setLocalState(this.props.ctx,
                                 {resetCode: code.toUpperCase()});
    }

    handleReCaptcha(value) {
        console.log('Captcha value:' + value);
        this.setState({
            reCaptcha: value
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
            this.doReset(ev);
        }
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {
           resetAccount: false
        });
    }

    render() {
        return cE(rB.Modal,{show: this.props.resetAccount,
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : 'bg-primary text-primary',
                      closeButton: true},
                     cE(rB.Modal.Title, null, 'Reset Account')
                    ),
                  cE(rB.ModalBody, null,
                     [
                         cE(rB.FormGroup, {
                             key: 1111,
                             controlId: 'reset-usernameNewId'
                         },
                            cE(rB.ControlLabel, null, 'Username'),
                            cE(rB.FormControl, {
                                type: 'text',
                                readOnly: true,
                                value: this.props.caOwner
                            })
                           ),
                         cE(rB.FormGroup, {
                             key: 1112,
                             controlId: 'reset-emailId'
                         },
                            cE(rB.ControlLabel, null, 'Email'),
                            cE(rB.FormControl, {
                                type: 'text',
                                onChange: this.handleEmail,
                                value: this.props.email
                            })
                           ),
                         this.props.resetCodeRequested &&
                             cE(rB.FormGroup, {
                                 key: 2118,
                                 controlId: 'reset-resetCode'
                             },
                                cE(rB.ControlLabel, null, 'Confirm Code'),
                                cE(rB.FormControl, {
                                    type: 'text',
                                    onChange: this.handleResetCode,
                                    value: this.props.resetCode
                                })
                               ),
                         this.props.resetCodeRequested &&
                             cE(rB.FormGroup, {
                                 key: 1113,
                                 controlId: 'reset-password1Id'
                             },
                                cE(rB.ControlLabel, null, 'Password'),
                                cE(rB.FormControl, {
                                    type: 'password',
                                    onChange: this.handlePasswordChange1,
                                    value: this.state.password1
                                })
                               ),
                         this.props.resetCodeRequested &&
                             cE(rB.FormGroup, {
                                 key: 1114,
                                 controlId: 'reset-password2Id'
                             },
                                cE(rB.ControlLabel, null, 'Repeat Password'),
                                cE(rB.FormControl, {
                                    type: 'password',
                                    onChange: this.handlePasswordChange2,
                                    value: this.state.password2,
                                    onKeyPress: this.passwordKeyDown
                                })
                               ),
                         !this.props.resetCodeRequested &&
                             cE(ReCAPTCHA, {
                                 key: 1115,
                                 sitekey: this.props.siteKey,
                                 onChange: this.handleReCaptcha
                             })
                     ].filter((x) => !!x)
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, 'Cancel'),
                     (this.props.resetCodeRequested ?
                      cE(rB.Button, {onClick: this.doReset, bsStyle:'primary'},
                         'Save') :
                      cE(rB.Button, {onClick: this.doRequestCode,
                                     bsStyle:'primary'}, 'Request Code')
                     )
                    )
                 );
    }
};

module.exports = Reset;
