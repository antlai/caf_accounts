const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const reCap = require('react-google-recaptcha');
const ReCAPTCHA = reCap.default;
const srpClient = require('caf_srp').client;
const url = require('url');
const querystring = require('querystring');


class  NewAccount extends React.Component {

    constructor(props) {
        super(props);
        this.state = {password1: '', password2: '', reCaptcha: null,
                      checkedUser: false, clickedTerms: false};
        this.doDismiss = this.doDismiss.bind(this);
        this.doRetry = this.doRetry.bind(this);
        this.handlePasswordChange1 = this.handlePasswordChange1.bind(this);
        this.handlePasswordChange2 = this.handlePasswordChange2.bind(this);
        this.passwordKeyDown = this.passwordKeyDown.bind(this);
        this.doSignUp = this.doSignUp.bind(this);
        this.handleReCaptcha = this.handleReCaptcha.bind(this);
        this.doRequestCode = this.doRequestCode.bind(this);
        this.handleEmail = this.handleEmail.bind(this);
        this.handleEmailCode = this.handleEmailCode.bind(this);
        this.handleClickedTerms = this.handleClickedTerms.bind(this);
        this.doShowTerms = this.doShowTerms.bind(this);
    }

    componentDidUpdate() {
        if (!this.state.checkedUser && this.props.caOwner) {
            // caOwner is readonly, i.e., only set once...
            AppActions.isRegistered(this.props.ctx, this.props.caOwner);
            this.setState({checkedUser: true});
        }
    }

    doRequestCode(ev) {
        if (this.props.caOwner && this.state.reCaptcha && this.props.email) {
            AppActions.newAccount(this.props.ctx, this.props.caOwner,
                                  this.state.reCaptcha, this.props.email);
            AppActions.setLocalState(this.props.ctx, {codeRequested: true});
        } else {
            AppActions.setError(this.props.ctx, new Error('Invalid data'));
        }
    }

    doRetry(ev) {
        const parsedURL = url.parse(window.location.href);
        const options = querystring.parse(parsedURL.hash.slice(1));
        const parsedGoTo = url.parse(options.goTo);
        parsedGoTo.protocol = (parsedGoTo.protocol === 'ws:' ?
                               'http:': parsedGoTo.protocol);
        parsedGoTo.protocol = (parsedGoTo.protocol === 'wss:' ?
                               'https:': parsedGoTo.protocol);
        window.location.href = url.format(parsedGoTo);
    }

    doShowTerms(ev) {
        AppActions.setLocalState(this.props.ctx, {showTerms: true});
    }

    doSignUp(ev) {
        const {password1, password2} = this.state;

        if (!this.state.clickedTerms) {
            AppActions.setError(this.props.ctx, new Error(
                'Please agree to the terms of service'
            ));
        } else if (this.props.caOwner && this.props.emailCode) {
            if (password1 && (password1 === password2)) {
                const account = srpClient
                    .clientInstance(this.props.caOwner, password1)
                    .newAccount();
                AppActions.activateAccount(this.props.ctx, account,
                                           this.props.emailCode);
                AppActions.setLocalState(this.props.ctx, {
                    password: password1,
                    newAccount: false
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

    handleClickedTerms(ev) {
        this.setState({clickedTerms: ev.target.checked});
    }

    handleEmail(ev) {
        AppActions.setLocalState(this.props.ctx, {email: ev.target.value});
    }

    handleEmailCode(ev) {
        const code = ev.target.value || '';
        AppActions.setLocalState(this.props.ctx,
                                 {emailCode: code.toUpperCase()});
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
                     [
                         cE(rB.FormGroup, {
                             key: 1111,
                             controlId: 'usernameNewId'
                         },
                            cE(rB.ControlLabel, null, 'Username'),
                            cE(rB.FormControl, {
                                type: 'text',
                                readOnly: true,
                                value: this.props.caOwner
                            })
                           ),
                         this.props.isRegistered &&
                             cE(rB.Alert, {bsStyle: 'danger', key: 65},
                                'Username already in use'),
                         !this.props.isRegistered && cE(rB.FormGroup, {
                             key: 1112,
                             controlId: 'emailId'
                         },
                            cE(rB.ControlLabel, null, 'Email'),
                            cE(rB.FormControl, {
                                type: 'text',
                                onChange: this.handleEmail,
                                value: this.props.email
                            })
                           ),
                         this.props.codeRequested &&
                             cE(rB.FormGroup, {
                                 key: 2118,
                                 controlId: 'emailCode'
                             },
                                cE(rB.ControlLabel, null, 'Confirm Code'),
                                cE(rB.FormControl, {
                                    type: 'text',
                                    onChange: this.handleEmailCode,
                                    value: this.props.emailCode
                                })
                               ),
                         this.props.codeRequested &&
                             cE(rB.FormGroup, {
                                 key: 1113,
                                 controlId: 'password1Id'
                             },
                                cE(rB.ControlLabel, null, 'Password'),
                                cE(rB.FormControl, {
                                    type: 'password',
                                    onChange: this.handlePasswordChange1,
                                    value: this.state.password1
                                })
                               ),
                         this.props.codeRequested &&
                             cE(rB.FormGroup, {
                                 key: 1114,
                                 controlId: 'password2Id'
                             },
                                cE(rB.ControlLabel, null, 'Repeat Password'),
                                cE(rB.FormControl, {
                                    type: 'password',
                                    onChange: this.handlePasswordChange2,
                                    value: this.state.password2,
                                    onKeyPress: this.passwordKeyDown
                                })
                               ),
                         !this.props.isRegistered &&
                             !this.props.codeRequested &&
                             cE(ReCAPTCHA, {
                                 key: 1115,
                                 sitekey: this.props.siteKey,
                                 onChange: this.handleReCaptcha
                             }),
                         cE(rB.FormGroup, {
                             key : 31114,
                             controlId: 'terms'
                         },
                            cE(rB.Checkbox, {
                                checked: this.state.clickedTerms,
                                onChange: this.handleClickedTerms
                            }, 'I agree to the ',
                               cE(rB.Button, {
                                   onClick: this.doShowTerms,
                                   bsStyle: 'link'},
                                  'terms of service and privacy policy'
                                 )
                              )
                           )
                     ].filter((x) => !!x)
                    ),
                  cE(rB.Modal.Footer, null,
                     (this.props.isRegistered ?
                      cE(rB.Button, {onClick: this.doRetry, bsStyle:'danger'},
                         'Back to Login') :
                      [
                          cE(rB.Button, {key: 232, onClick: this.doDismiss},
                             'Cancel'),
                          (this.props.codeRequested ?
                           cE(rB.Button, {key: 342, onClick: this.doSignUp,
                                          bsStyle:'primary'},
                              'Sign up') :
                           cE(rB.Button, {key: 987, onClick: this.doRequestCode,
                                          bsStyle:'primary'}, 'Request Code')
                          )
                      ]
                     )
                    )
                 );
    }
};

module.exports = NewAccount;
