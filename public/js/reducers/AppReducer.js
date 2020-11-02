var AppConstants = require('../constants/AppConstants');

var AppReducer = function(state, action) {
    if (typeof state === 'undefined') {
        return  {siteKey: null, isClosed: false, password: '',
                 resetAccount: false, isRegistered: false,
                 username: '', showTerms: false,
                 emailCode: '', email: '', codeRequested: '', resetCode: '',
                 resetCodeRequested: ''};
    } else {
        switch(action.type) {
        case AppConstants.APP_UPDATE:
        case AppConstants.APP_NOTIFICATION:
            return Object.assign({}, state, action.state);
        case AppConstants.APP_ERROR:
            return Object.assign({}, state, {error: action.error});
        case AppConstants.WS_STATUS:
            return Object.assign({}, state, {isClosed: action.isClosed});
        default:
            return state;
        }
    };
};

module.exports = AppReducer;
