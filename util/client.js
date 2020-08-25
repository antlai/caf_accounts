#!/usr/bin/env node
'use strict';

const parseArgs = require('minimist');
const caf_core =  require('caf_core');
const json_rpc = caf_core.caf_transport.json_rpc;
const caf_comp = caf_core.caf_components;
const myUtils = caf_comp.myUtils;
const caf_cli = caf_core.caf_cli;
const srpClient = require('caf_srp').client;
const urlParser = require('url');

const ACCOUNTS_URL = 'https://root-accounts.cafjs.com';
const ADMIN_CA = 'root-admin';

const usage = function(x) {
    console.log('Usage: client.js  [--password <string>] [--accountsURL <string>] <disable|enable|list> [user]');
    process.exit(1);
};

const argv = parseArgs(process.argv.slice(2), {
    string : ['password', 'accountsURL'],
    alias: {p: 'password', a: 'accountsURL'}
});


const [command, user] = argv._;

if (!argv.password || !command) {
    usage();
}

const specAll = {
    log: function(x) {
        console.log(x);
    },
    securityClient: srpClient,
    accountsURL: argv.accountsURL || ACCOUNTS_URL,
    password: argv.password,
    from: ADMIN_CA,
    unrestrictedToken: false,
    disableBackchannel: true
};

const s = new caf_cli.Session(argv.accountsURL, ADMIN_CA, specAll);

s.onopen = async () => {
    try {
        switch (command) {
        case 'disable':
            if (user) {
                await s.disableUser({username: user}).getPromise();
            } else {
                usage();
            }
            break;
        case 'enable':
            if (user) {
                await s.enableUser({username: user}).getPromise();
            } else {
                usage();
            }
            break;
        case 'list':
            const all = await s.listDisabledUsers().getPromise();
            console.log(all);
            break;
        default:
            usage();
        }
        s.close();
    } catch (ex) {
        s.close(ex);
    }
};

s.onclose = function(err) {
    if (err) {
        console.log(myUtils.errToPrettyStr(err));
        process.exit(1);
    }
    console.log('Done OK');
};
