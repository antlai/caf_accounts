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
var accUtils = require('./ca_methods_utils');
var util = require('util');

exports.methods = {
    async __ca_init__() {
        this.state.accounts = {};
        accUtils.initSessions(this);
        accUtils.defaultAccounts(this);
        return accUtils.loadKeys(this);
    },
    async __ca_resume__(cp) {
        accUtils.initSessions(this);
        return accUtils.loadKeys(this);
    },
    async hello(user) {
        this.$.log && this.$.log.warn('Calling DEPRECATED method hello');
        return this.helloSRP(user);
    },
    async helloSRP(user) {
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
    async newToken(challenge, tokenConstr) {
        try {
            var server = accUtils.lookupSession(this, tokenConstr.caOwner);
            return [null, server.newToken(challenge, tokenConstr)];
        } catch (err) {
            if (tokenConstr && (typeof tokenConstr.caOwner === 'string')) {
                accUtils.deleteSession(this, tokenConstr.caOwner);
            }
            return [err];
        }
    },
    async newAccount(account) {
        try {
            accUtils.addAccount(this, account);
            return [];
        } catch (err) {
            return [err];
        }
    },
    async attenuateToken(megaTokenStr, constraints) {
        var attenuateAsync = util.promisify(this.$.security.attenuateToken);
        try {
            var newToken =  await attenuateAsync(megaTokenStr, constraints);
            return [null, newToken];
        } catch (err) {
            return [err];
        }
    }
};

caf.init(module);
