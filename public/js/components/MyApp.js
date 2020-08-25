const React = require('react');
const rB = require('react-bootstrap');
const AppActions = require('../actions/AppActions');
const AppStatus = require('./AppStatus');
const NewAccount = require('./NewAccount');
const MissingUser = require('./MissingUser');
const Reset = require('./Reset');
const NewError = require('./NewError');
const TableToken = require('./TableToken');
const TokenCreate = require('./TokenCreate');
const cE = React.createElement;

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
                  cE(MissingUser, {
                      ctx: this.props.ctx,
                      caOwner: this.state.caOwner,
                      email: this.state.email,
                      username: this.state.username
                  }),
                  cE(NewAccount, {
                      ctx: this.props.ctx,
                      newAccount: this.state.newAccount,
                      caOwner: this.state.caOwner,
                      siteKey: this.state.siteKey,
                      emailCode: this.state.emailCode,
                      email: this.state.email,
                      isRegistered: this.state.isRegistered,
                      codeRequested: this.state.codeRequested
                  }),
                  cE(Reset, {
                      ctx: this.props.ctx,
                      resetAccount: this.state.resetAccount,
                      caOwner: this.state.caOwner,
                      siteKey: this.state.siteKey,
                      resetCode: this.state.resetCode,
                      email: this.state.email,
                      resetCodeRequested: this.state.resetCodeRequested
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
