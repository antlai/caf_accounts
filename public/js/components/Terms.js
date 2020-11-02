const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

const TERMS =
`bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla`;

const PRIVACY =
`bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla
bla bla bla bla bla`;


class  Terms extends React.Component {
    constructor(props) {
        super(props);
        this.doDismiss = this.doDismiss.bind(this);
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showTerms: false});
    }

    render() {
        return cE(rB.Modal,{show: !!this.props.showTerms,
                            onHide: this.doDismiss,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : 'bg-primary text-primary',
                      closeButton: true},
                     cE(rB.Modal.Title, null, 'Caf.js Labs LLC')
                    ),
                  cE(rB.ModalBody, null,
                     cE('h3', null, 'Terms and Conditions'),
                     cE('p', null, TERMS),
                     cE('h3', null, 'Privacy Policy'),
                     cE('p', null, PRIVACY)
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, "Continue")
                    )
                 );
    }
};

module.exports = Terms;
