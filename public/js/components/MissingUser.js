const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const NOBODY_USER = 'nobody';
const url = require('url');
const querystring = require('querystring');

class MissingUser extends React.Component {

    constructor(props) {
        super(props);
        this.handleEmail = this.handleEmail.bind(this);
        this.doLookUp = this.doLookUp.bind(this);
        this.doRetry = this.doRetry.bind(this);
        this.emailKeyDown = this.emailKeyDown.bind(this);
    }

    doRetry() {
        if ((this.props.caOwner === NOBODY_USER) && this.props.username) {
            const parsedURL = url.parse(window.location.href);
            const options = querystring.parse(parsedURL.hash.slice(1));
            const parsedGoTo = url.parse(options.goTo);
            parsedGoTo.protocol = (parsedGoTo.protocol === 'ws:' ?
                                   'http:': parsedGoTo.protocol);
            parsedGoTo.protocol = (parsedGoTo.protocol === 'wss:' ?
                                   'https:': parsedGoTo.protocol);
            window.location.href = url.format(parsedGoTo);
        }
    }

    emailKeyDown(ev) {
        if (ev.key === 'Enter') {
            this.doLookUp(ev);
        }
    }

    handleEmail(ev) {
        AppActions.setLocalState(this.props.ctx, {email: ev.target.value});
    }

    doLookUp(ev) {
        if (this.props.email) {
            AppActions.lookupUsername(this.props.ctx, this.props.email);
        } else {
            AppActions.setError(this.props.ctx, new Error('Invalid Email'));
        }
    }

    render() {
        const show = (this.props.caOwner === NOBODY_USER);

        return cE(rB.Modal,{show: show,
                            animation: false},
                   cE(rB.Modal.Header, {
                       className : 'bg-primary text-primary',
                       closeButton: true
                   },
                      cE(rB.Modal.Title, null, 'Lookup Username')
                     ),
                  cE(rB.ModalBody, null,
                     cE(rB.FormGroup, {
                         key: 1112,
                         controlId: 'lookup-emailId'
                     },
                        cE(rB.ControlLabel, null, 'Email'),
                        cE(rB.FormControl, {
                            type: 'text',
                            onChange: this.handleEmail,
                            value: this.props.email,
                            onKeyPress: this.emailKeyDown
                        })
                       ),
                     cE(rB.FormGroup, {
                         key: 1113,
                         controlId: 'lookup-userId'
                     },
                        cE(rB.ControlLabel, null, 'Username'),
                        cE(rB.FormControl, {
                            type: 'text',
                            readOnly: true,
                            value: this.props.username
                        })
                       ),
                     cE(rB.Modal.Footer, null,
                        (this.props.username ?
                         cE(rB.Button, {onClick: this.doRetry,
                                       bsStyle:'danger'},
                            'Back to Login') :
                        cE(rB.Button, {onClick: this.doLookUp,
                                       bsStyle:'primary'},
                           'Search')
                        )
                       )
                    )
                 );
    }
};

module.exports = MissingUser;
