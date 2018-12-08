var React = require('react');
var ReactDOM = require('react-dom');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');


class TokenCreate extends React.Component {

    constructor(props) {
        super(props);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.submit = this.submit.bind(this);
        this.doNewToken = this.doNewToken.bind(this);
        this.doSignUp = this.doSignUp.bind(this);
    }

    componentDidMount() {
        ReactDOM.findDOMNode(this.refs.password).focus();
    }

    clearPassword() {
        AppActions.setLocalState(this.props.ctx, {
            password: ''
        });
    }

    doNewToken(ev) {
        var settings = {
            caOwner : this.props.caOwner,
            password : this.props.password,
            durationInSec: this.props.durationInSec,
            appLocalName : this.props.appLocalName,
            appPublisher : this.props.appPublisher,
            caLocalName :  this.props.caLocalName,
            unrestrictedToken: this.props.unrestrictedToken
        };
        AppActions.newToken(this.props.ctx, settings);
        this.clearPassword();
    }

    doSignUp(ev) {
        ReactDOM.findDOMNode(this.refs.password).focus();
        AppActions.setLocalState(this.props.ctx, {
            newAccount: true
        });
    }

    handlePasswordChange(ev) {
        AppActions.setLocalState(this.props.ctx, {
            password: ev.target.value
        });
    }

    submit(ev) {
        if (ev.key === 'Enter') {
            this.doNewToken(ev);
        }
    }

    render() {
        return cE(rB.Grid, {fluid: true},
                  cE(rB.Row, null,
                     cE(rB.Col, {xs: 10, sm:5},
                         cE(rB.FormGroup, { controlId: 'usernameId' },
                            cE(rB.ControlLabel, null, 'Username'),
                            cE(rB.FormControl, {
                                type: 'text',
                                readOnly: true,
                                value: this.props.caOwner
                            })
                           )
                       ),
                     cE(rB.Col, {xs: 10, sm:5},
                        cE(rB.FormGroup, { controlId: 'passwordId' },
                           cE(rB.ControlLabel, null, 'Password'),
                           cE(rB.FormControl, {
                               type: 'password',
                               ref: 'password',
                               value: this.props.password,
                               onChange: this.handlePasswordChange,
                               onKeyPress: this.submit
                           })
                          )
                       )
                    ),
                  cE(rB.Row, null,
                     cE(rB.Col, {xs:5, sm:2},
                        cE(rB.Button, {onClick: this.doNewToken,
                                       bsStyle: 'primary'},
                           'Create Token')
                       )/*,
                     cE(rB.Col, {xs:5, sm:2},
                        cE(rB.Button, {onClick: this.doSignUp,
                                       bsStyle: 'primary'},
                           'Sign up')
                       )*/
                    )
                 );
    }
}

module.exports = TokenCreate;
