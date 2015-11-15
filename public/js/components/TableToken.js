var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;

var TableToken = {
    render: function() {
        var self = this;
        var renderOneRow = function(i, token) {
            var ifUnrestricted = function(label) {
                return ((token.unrestrictedToken ||
                         (!token[label]))? 'ANY' : token[label]);
            };

            return  cE('tr', {key:10*i},
                       cE('td', {key:10*i+1}, ifUnrestricted('appPublisher')),
                       cE('td', {key:10*i+2}, ifUnrestricted('appLocalName')),
                       cE('td', {key:10*i+3}, token.caOwner),
                       cE('td', {key:10*i+4}, ifUnrestricted('caLocalName')),
                       cE('td', {key:10*i+5}, ifUnrestricted('durationInSec')),
                       cE('td', {key:10*i+6},
                          (token.unrestrictedToken ?
                           cE(rB.Glyphicon,{glyph: 'check',
                                            className:'text-danger'}) :
                           cE(rB.Glyphicon,{glyph: 'unchecked',
                                            className: 'text-success'})))
                      );
        };
        var renderRows = function() {
            return [renderOneRow(1, self.props.token)];
        };

        return cE(rB.Table, {striped: true, responsive: true, bordered: true,
                             condensed: true, hover: true},
                  cE('thead', {key:0},
                     cE('tr', {key:1},
                        cE('th', {key:2}, 'AppPublisher'),
                        cE('th', {key:3}, 'AppLocalName'),
                        cE('th', {key:4}, 'CAOwner'),
                        cE('th', {key:5}, 'CALocalName'),
                        cE('th', {key:6}, 'Duration(sec)'),
                        cE('th', {key:7}, 'Unrestricted')
                       )
                    ),
                  cE('tbody', {key:8}, renderRows())
                 );
    }
};


module.exports = React.createClass(TableToken);
