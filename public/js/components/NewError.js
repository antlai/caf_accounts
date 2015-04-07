var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

var NewError = {
    doDismissError: function(ev) {
        AppActions.resetError();
        this.props.onRequestHide();

    },
    render: function() {
        return (this.props.error ?
                cE(rB.Modal, React.__spread({},  this.props, {
                                                bsStyle: "primary",
                                                title: "Warning!",
                                                animation: false}),
                   cE("div", {className: "modal-body"},
                      cE('p', null, 'Got Error:',
                         cE(rB.Alert, {bsStyle: 'danger'},
                            this.props.error && this.props.error.toString())
                        )
                     ),
                   cE("div", {className: "modal-footer"},
                      cE(rB.Button, {onClick: this.doDismissError}, "Continue")
                    )
                  ) : cE(rB.Modal,{}, cE('span')));
    }
};

module.exports = React.createClass(NewError);
