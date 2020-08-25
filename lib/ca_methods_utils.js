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
const caf = require('caf_core');
const caf_comp = caf.caf_components;
const myUtils = caf_comp.myUtils;
const json_rpc = caf.caf_transport.json_rpc;
const caf_security = caf.caf_security;
const tokens = caf_security.tokens;
const secUtils = caf_security.utils;
const caf_srp = require('caf_srp');
const srpClient = caf_srp.client;
const srpServer = caf_srp.server;
const util = require('util');
const EMAIL_REGEXP = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
const EMAIL_TOPIC = 'forum-email'; // copy of ca_methods.js

exports.loadKeys = async function(self) {
    const pubFile = self.$.props.publicKeyFile || 'rsa_pub.pem';
    const privFile = self.$.props.privateKeyFile || 'rsa_priv.pem';
    const keysDir = self.$.props.keysDir || __dirname;
    const loadKeyAsync = util.promisify(secUtils.loadKey);
    try {
        const pubKey = await loadKeyAsync(keysDir, pubFile);
        const privKey = await loadKeyAsync(keysDir, privFile);
        self.scratch.keys = {pubKey: pubKey, privKey: privKey};
        return [];
    } catch (err) {
        return [err];
    }
};

exports.checkEmailPublisher = function(self, from, username) {
    const testUsers = (self.$.props.testAccounts || []).map(x => x.username);
    if (testUsers.includes(username)) {
        // test accounts are replicated
        return;
    }

    const [caOwner, caName] = json_rpc.splitName(from);
    if ((caName !== username.substring(0, json_rpc.ACCOUNTS_CA_LENGTH)) ||
         (caOwner !== json_rpc.DEFAULT_FROM_USERNAME)) {
        throw new Error(`Publisher ${caName} inconsistent with ${username}`);
    }
};

exports.checkUsernameLocal = function(self, username) {
    const me = self.__ca_getName__();
    if (!tokens.validExtendedNobody(me)) {
        throw new Error('Destination CA is not an extended NOBODY user');
    }
    const [nobody, caLocalName] = json_rpc.splitName(me);

    if (caLocalName !== username.substring(0, json_rpc.ACCOUNTS_CA_LENGTH)) {
        throw new Error(`Username ${username} not local to ${me}`);
    }
};

exports.lookupSession = function(self, user) {
    return self.scratch.srpSessions[user];
};

exports.deleteSession = function(self, user) {
    delete self.scratch.srpSessions[user];
};

exports.initSessions = function(self) {
    self.scratch.srpSessions = {};
};

exports.sessionInstance = function(self, user) {
    var server = self.scratch.srpSessions[user];
    if (!server) {
        server = srpServer.serverInstance(self.state.accounts,
                                          self.scratch.keys.privKey,
                                          self.scratch.keys.pubKey);
        self.scratch.srpSessions[user] = server;
    }
    return server;
};

exports.checkUsername = function(self, username) {
    if (!tokens.validUsername(username)) {
        throw new Error('Invalid name');
    }
    if (self.state.accounts[username]) {
        throw new Error('Username already in use');
    }
    const me = self.__ca_getName__();
    if (!tokens.validExtendedNobody(me)) {
        throw new Error('Destination CA is not an extended NOBODY user');
    }
    const caLocalName = json_rpc.splitName(me)[1];
    if (caLocalName !== username.substring(0, json_rpc.ACCOUNTS_CA_LENGTH)) {
        throw new Error('Destination CA does not match');
    }
};

exports.checkEmailAddress = function(self, email) {
    if (email && email.match(EMAIL_REGEXP)) {
        const $$ = self.$.sharing.$;
        if ($$.email.get(email)) {
            throw new Error(`Email address ${email} already registered`);
        }
    } else {
        throw new Error(`Invalid email address ${email}`);
    }
};

exports.sendEmailChallenge = async function(self, email) {
    const code = myUtils.randomString(6);
    const body = self.$.smtp.instantiateTemplate('confirm', {code});
    const subject = `[Caf.js] Confirmation Code: ${code}`;
    await self.$.smtp.dirtySend(email, subject, body);
    return code;
};

exports.sendResetChallenge =  async function(self, email, username) {
    const code = myUtils.randomString(6);
    const body = self.$.smtp.instantiateTemplate('reset', {code, username});
    const subject = `[Caf.js] Reset Code: ${code}`;
    await self.$.smtp.dirtySend(email, subject, body);
    return code;
};

const addAccount = exports.addAccount = function(self, account, email) {
    const server = srpServer.serverInstance(self.state.accounts);
    server.newAccount(account);
    self.state.accounts[account.username].email = email;
};

exports.defaultAccounts = function(self) {
    if (!self.$.props.disableTestAccounts &&
        Array.isArray(self.$.props.testAccounts)) {
        self.$.props.testAccounts
            .forEach(function(acc) {
                const cl = srpClient.clientInstance(acc.username, acc.password);
                const email = `${acc.username}@vcap.me`;
                addAccount(self, cl.newAccount(), email);
                const msg = {email: email, username: acc.username};
                self.$.pubsub.publish(EMAIL_TOPIC, JSON.stringify(msg));
            });
    }
};
