// Modifications copyright 2020 Caf.js Labs and contributors
/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';
var caf = require('caf_core');
var assert = require('assert');

var accUtils = require('./ca_methods_utils');
var util = require('util');

const ADMIN_CA = 'root-admin';
const DISABLED_MAP = 'disabled';
const ADMIN_DISABLED_MAP = ADMIN_CA + '-' + DISABLED_MAP;
const EMAIL_MAP = 'email';
const ADMIN_EMAIL_MAP = ADMIN_CA + '-' + EMAIL_MAP;
const EMAIL_TOPIC = 'forum-email';

const isAdmin = function(self) {
    const name = self.__ca_getName__();
    return (name === ADMIN_CA);
};

exports.methods = {
    async __ca_init__() {
        if (isAdmin(this)) {
            this.$.sharing.addWritableMap('disabled', DISABLED_MAP);
            this.$.sharing.addWritableMap('email', EMAIL_MAP);

            this.$.pubsub.subscribe(EMAIL_TOPIC, '__ca_handleEmail__');
            return [];
        } else {
            this.$.sharing.addReadOnlyMap('disabled', ADMIN_DISABLED_MAP);
            this.$.sharing.addReadOnlyMap('email', ADMIN_EMAIL_MAP);
            this.state.accounts = {};
            this.scratch.loginErrors = {};
            accUtils.initSessions(this);
            accUtils.defaultAccounts(this);
            return accUtils.loadKeys(this);
        }
    },

    async __ca_resume__(cp) {
        if (isAdmin(this)) {
            return [];
        } else {
            accUtils.initSessions(this);
            this.scratch.loginErrors = {};
            return accUtils.loadKeys(this);
        }
    },

    async __ca_pulse__() {
         if (isAdmin(this)) {
             return [];
         }

        const now = (new Date()).getTime();
        const expires = this.$.props.challengeTimeoutInSec * 1000;
        const expiresLogin = this.$.props.loginTimeoutInSec * 1000;
        const $$ = this.$.sharing.$;

        // Garbage collect accounts with old email challenges pending
        Object.keys(this.state.accounts).forEach((username) => {
            const x = this.state.accounts[username];
            if (x.emailCode && (x.emailCode.timestamp + expires < now)) {
                const msg = `Deleting expired account ${username}`;
                this.$.log && this.$.log.warn(msg);
                delete this.state.accounts[username];
            }
        });

        // Garbage collect old reset challenges pending
        Object.keys(this.state.accounts).forEach((username) => {
            const x = this.state.accounts[username];
            if (x.resetCode && (x.resetCode.timestamp + expires < now)) {
                const msg = `Deleting reset code for account ${username}`;
                this.$.log && this.$.log.warn(msg);
                delete x.resetCode;
            }
        });

        // Garbage collect old account login errors
         Object.keys(this.scratch.loginErrors).forEach((username) => {
            const x = this.scratch.loginErrors[username];
             if (x.timestamp + expiresLogin < now) {
                const msg = `Deleting login errors for account ${username}`;
                this.$.log && this.$.log.warn(msg);
                delete this.scratch.loginErrors[username];
            }
        });

        // Ensure e-mail properly registered
        Object.keys(this.state.accounts).forEach((username) => {
            const x = this.state.accounts[username];
            if (!x.emailCode) {
                const registeredUser = $$.email.get(x.email);
                if (!registeredUser) {
                    // Retry...
                    const msg = `Retrying registration for ${username}`;
                    this.$.log && this.$.log.warn(msg);
                    const rec = {email: x.email, username: username};
                    this.$.pubsub.publish(EMAIL_TOPIC, JSON.stringify(rec));
                } else if (registeredUser !== username) {
                    // Race during registration...
                    const msg = `Deleting inconsistent account ${username}`;
                    this.$.log && this.$.log.warn(msg);
                    delete this.state.accounts[username];
                }
            }
        });

        return [];
    },

    async __ca_handleEmail__(topic, msg, from) {
        const acc = JSON.parse(msg);
        const $$ = this.$.sharing.$;
        assert(acc && acc.email && acc.username);
        accUtils.checkEmailPublisher(this, from, acc.username);
        $$.email.set(acc.email, acc.username);
        return [];
    },

    async getSiteKey() {
        return [null,  {siteKey: this.$.recaptcha.getSiteKey()}];
    },

    //Privileged methods only

    async disableUser(user) {
        assert(isAdmin(this), 'Admin user only');
        const $$ = this.$.sharing.$;
        $$.disabled.set(user.username, user);
        return [];
    },

    async enableUser(user) {
        assert(isAdmin(this), 'Admin user only');
        const $$ = this.$.sharing.$;
        $$.disabled.delete(user.username);
        return [];
    },

    async listDisabledUsers() {
        assert(isAdmin(this), 'Admin user only');
        const $$ = this.$.sharing.$;
        const obj = $$.disabled.toObject();
        return [null, Object.keys(obj).filter(x => x !== '__ca_version__')];
    },


    //Non-privileged methods only
    async hello(user) {
        this.$.log && this.$.log.warn('Calling DEPRECATED method hello');
        return this.helloSRP(user);
    },

    // Step 1 of authentication
    async helloSRP(user) {
        assert(!isAdmin(this), 'Not for admin user');

        const $$ = this.$.sharing.$;
        if ($$.disabled.get(user.username)) {
            const err = new Error(`Account ${user.username} disabled`);
            return [err];
        }

        const acc = this.state.accounts[user.username];
        if (!acc) {
            const err = new Error(`Account ${user.username} missing`);
            return [err];
        }

        if ($$.email.get(acc.email) !== user.username) {
            const err = new Error(`Account ${user.username} email not valid`);
            return [err];
        }

        const loginErrors = this.scratch.loginErrors[user.username];
        if (loginErrors && (loginErrors.count > this.$.props.maxLoginErrors)) {
            const err = new Error('Account ' + user.username +
                                  ' locked, try again in a few minutes.');
            return [err];
        }

        try {
            var server = accUtils.sessionInstance(this, user.username);
            return [null, server.hello(user)];
        } catch (err) {
            if (user && (typeof user.username === 'string')) {
                accUtils.deleteSession(this, user.username);
            }
            return [err];
        }
    },

    // Step 2 of authentication
    async newToken(challenge, tokenConstr) {
        assert(!isAdmin(this), 'Not for admin user');

        try {
            var server = accUtils.lookupSession(this, tokenConstr.caOwner);
            return [null, server.newToken(challenge, tokenConstr)];
        } catch (err) {
            if (tokenConstr && (typeof tokenConstr.caOwner === 'string')) {
                accUtils.deleteSession(this, tokenConstr.caOwner);
                const acc = this.state.accounts[tokenConstr.caOwner];
                if (acc) {
                    const loginErrors =
                          this.scratch.loginErrors[tokenConstr.caOwner] ||
                          {count: 0};
                    loginErrors.timestamp = (new Date()).getTime();
                    loginErrors.count = loginErrors.count + 1;
                    this.scratch.loginErrors[tokenConstr.caOwner] = loginErrors;
                }
            }
            return [err];
        }
    },

    // Step 1 to create account
    async newAccount(username, reCaptcha, email) {
        assert(!isAdmin(this), 'Not for admin user');

        try {
            /*
             It blocks this CA for about 120ms. Need to use different
             CAs based on, e.g., first three characters of acc name.
             */
            accUtils.checkUsername(this, username);
            accUtils.checkEmailAddress(this, email);
            await this.$.recaptcha.dirtyValidate(reCaptcha);

            const userAcc = {username, email};
            this.state.accounts[username] = userAcc;

            if (this.$.props.enableSMTP) {
                userAcc.emailCode = {
                    value: await accUtils.sendEmailChallenge(this, email),
                    timestamp: (new Date()).getTime()
                };
                return [];
            } else {
                // Bypass email authentication
                userAcc.emailCode = {
                    value: '424242',
                    timestamp: (new Date()).getTime()
                };
                return [null, {emailCode: '424242'}];
            }
        } catch (err) {
            return [err];
        }
    },

    // Step 2 to create account
    async activateAccount(account, challenge) {
        assert(!isAdmin(this), 'Not for admin user');

        try {
            const userAcc = this.state.accounts[account.username];

            if (!userAcc) {
                const err = new Error(`Account ${account.username} missing`);
                return [err];
            }

            if (!userAcc.emailCode) {
                const msg = `Account ${account.username} already active`;
                this.$.log && this.$.log.debug(msg);
                // idempotent, no error
                return [];
            }

            if (challenge === userAcc.emailCode.value) {
                userAcc.verifierHex = account.verifierHex;
                userAcc.saltHex = account.saltHex;
                delete this.state.accounts[account.username];
                accUtils.addAccount(this, userAcc, userAcc.email);
                const msg = {email: userAcc.email, username: userAcc.username};
                this.$.pubsub.publish(EMAIL_TOPIC, JSON.stringify(msg));
                delete userAcc.emailCode;
                return [];
            } else {
                const err = new Error(`Invalid code for ${account.username}`);
                return [err];
            }
        } catch (err) {
            return [err];
        }
    },

    async isRegistered(username) {
        // Only the corresponding CA can answer
        accUtils.checkUsernameLocal(this, username);
        return [null, {isRegistered: !!this.state.accounts[username]}];
    },

    // (Optional) Step 0 of reset
    async lookupUsername(email) {
        // Any CA can respond to this!
        const $$ = this.$.sharing.$;
        const registeredUser = $$.email.get(email);
        return registeredUser ?
            [null, {username: registeredUser}] :
            [new Error(`Missing account for ${email}`)];
    },

    // Step 1 of reset
    async newResetChallenge(username, reCaptcha, email) {
        assert(!isAdmin(this), 'Not for admin user');

        const $$ = this.$.sharing.$;
        try {
            const registeredUser = $$.email.get(email);
            if (!registeredUser) {
                return [new Error(`Unknown user for email ${email}`)];
            }
            if (username !== registeredUser) {
                return [new Error(`Invalid user for email ${email}`)];
            }
            const acc = this.state.accounts[registeredUser];
            if (!acc) {
                return [new Error(`Missing account for email ${email}`)];
            } else {
                if (this.$.props.enableSMTP) {
                    await this.$.recaptcha.dirtyValidate(reCaptcha);
                    acc.resetCode = {
                        value: await accUtils.sendResetChallenge(this, email,
                                                                 acc.username),
                        timestamp: (new Date()).getTime()
                    };
                    return [];
                } else {
                    const msg = 'Cannot reset accounts with email disabled';
                    return [new Error(msg)];
                }
            }
        } catch (err) {
            return [err];
        }
    },

    // Step 2 of reset
    async resetAccount(account, challenge) {
        assert(!isAdmin(this), 'Not for admin user');

        try {
            const userAcc = this.state.accounts[account.username];

            if (!userAcc) {
                const err = new Error(`Account ${account.username} missing`);
                return [err];
            }

            if (!userAcc.resetCode) {
                const err = new Error(
                    `Missing reset code for ${account.username}`
                );
                return [err];
            }

            if (challenge === userAcc.resetCode.value) {
                const newAccount = {
                    username: account.username,
                    verifierHex: account.verifierHex,
                    saltHex: account.saltHex
                };
                delete this.state.accounts[account.username];
                accUtils.addAccount(this, newAccount, userAcc.email);
                delete userAcc.resetCode;
                return [];
            } else {
                const err = new Error(
                    `Invalid reset code for ${account.username}`
                );
                return [err];
            }
        } catch (err) {
            return [err];
        }
    },

    async confirmOrder(peopleTokenStr, order) {
        let isMock = false;
        const {oid, tid, units, value, balance} = order;
        const peopleToken = this.$.security.verifyToken(peopleTokenStr);
        assert(peopleToken && peopleToken.caOwner, 'Invalid people app token');
        assert(peopleToken.appPublisher === 'root', 'Invalid app publisher');
        if (peopleToken.appLocalName === 'hellopaypal') {
            isMock = true;
        } else {
            assert(peopleToken.appLocalName === 'people', 'Invalid app name');
        }
        assert(typeof units === 'number', 'Invalid units');
        assert(typeof value === 'number', 'Invalid value');
        assert(typeof balance === 'number', 'Invalid balance');

        const username = peopleToken.caOwner;
        const acc = this.state.accounts[username];
        if (acc && acc.email) {
            const id = tid ? tid : oid; // transaction ids are preferred
            const props = {id, username, units, value, balance};
            if (isMock) {
                await accUtils.sendMockPurchaseConfirm(this, acc.email, props);
            } else {
                await accUtils.sendPurchaseConfirm(this, acc.email, props);
            }
            return [null, props];
        } else {
            return [new Error(`Missing account ${username}`)];
        }
    },

    async attenuateToken(megaTokenStr, constraints) {
        const $$ = this.$.sharing.$;
        const megaToken = this.$.security.verifyToken(megaTokenStr);
        assert(megaToken && megaToken.caOwner, 'Invalid megaToken');

        if ($$.disabled.get(megaToken.caOwner)) {
            const err = new Error(`Account ${megaToken.caOwner} disabled`);
            return [err];
        } else {
            var attenuateAsync = util.promisify(this.$.security.attenuateToken);
            try {
                var newToken = await attenuateAsync(megaTokenStr, constraints);
                return [null, newToken];
            } catch (err) {
                return [err];
            }
        }
    }
};

caf.init(module);
