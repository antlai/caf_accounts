var React = require('react');
var rB = require('react-bootstrap');
var AppActions = require('../actions/AppActions');
var AppStatus = require('./AppStatus');
var NewAccount = require('./NewAccount');
var NewError = require('./NewError');
var TableToken = require('./TableToken');
var TokenCreate = require('./TokenCreate');
var cE = React.createElement;

class MyApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.props.ctx.store.getState();
    }

    componentDidMount() {
        if (!this.unsubscribe) {
            this.unsubscribe = this.props.ctx.store
                .subscribe(this._onChange.bind(this));
            this._onChange();
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    _onChange() {
        if (this.unsubscribe) {
            this.setState(this.props.ctx.store.getState());
        }
    }

    render() {
        return cE("div", {className: "container-fluid"},
                  cE(NewError, {
                      ctx: this.props.ctx,
                      error: this.state.error
                  }),
                  cE(NewAccount, {
                      ctx: this.props.ctx,
                      newAccount: this.state.newAccount,
                      caOwner: this.state.caOwner
                  }),
                  cE(rB.Panel, null,
                    cE(rB.Panel.Heading, null,
                        cE(rB.Panel.Title, null,
                           cE(rB.Grid, {fluid: true},
                              cE(rB.Row, null,
                                 cE(rB.Col, {sm:1, xs:1},
                                    cE(AppStatus, {
                                        isClosed: this.state.isClosed
                                    })
                                   ),
                                 cE(rB.Col, {
                                     sm: 5,
                                     xs:10,
                                     className: 'text-right'
                                 }, "Accounts"),
                                 cE(rB.Col, {
                                     sm: 5,
                                     xs:11,
                                     className: 'text-right text-danger'
                                 }, "Verify Address Bar!")
                                )
                             )
                          )
                       ),
                     cE(rB.Panel.Body, null,
                        cE(rB.Panel, null,
                           cE(rB.Panel.Heading, null,
                              cE(rB.Panel.Title, null, "Token for " +
                                 this.state.url)
                             ),
                           cE(rB.Panel.Body, null,
                              cE(TokenCreate, {
                                  ctx: this.props.ctx,
                                  caOwner: this.state.caOwner,
                                  password: this.state.password,
                                  durationInSec: this.state.durationInSec,
                                  appLocalName: this.state.appLocalName,
                                  appPublisher: this.state.appPublisher,
                                  caLocalName: this.state.caLocalName,
                                  unrestrictedToken:
                                  this.state.unrestrictedToken
                              })
                             )
                          ),
                        cE(rB.Panel, null,
                           cE(rB.Panel.Heading, null,
                              cE(rB.Panel.Title, null, "The CA owner is " +
                                 this.state.caOwner)
                             ),
                           cE(rB.Panel.Body, null,
                              cE(TableToken, {token: this.state})
                             )
                          )
                       )
                    )
                 );
    }
};

module.exports = MyApp;
