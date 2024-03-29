const
    q = require('q'),
    https = require('https'),
    fs = require('fs');

const trustedCa = [
    'comodo_b64.cer',
    'sectigo_b64.cer'
];

https.globalAgent.options.ca = [];
for (const ca of trustedCa) {
    https.globalAgent.options.ca.push(fs.readFileSync(__dirname + '/../certs/' + ca));
}

module.exports = function https_request(options, json_stringified_data, context) {
    'use strict';
    context.log('https_request');
    options.path = '/alarm-ingest';
    options.pathname = '/alarm-ingest';
    options.host = 'aws-alarm.refinitiv.com';
    options.port = '443';
    context.log('OPTIONS', options);
    var deferred = q.defer();

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        var response = '';

        res.on('data', function (data) {
            context.log('DATA', data);
            response += data;
        });
        res.on('end', function () {
            context.log('RESOLVED', res.statusCode, response);
            deferred.resolve({response: response, headers: res.headers, statusCode: res.statusCode, context: context});
        });
        res.on('error', function (error) {
            context.log('HTTPS error:', error);
            deferred.reject('HTTPS response error:', error);
        });
    });

    req.on('error', function (error) {
        context.log('REJECTED', error);
        deferred.reject('HTTPS error:' + error);
    });

    context.log('json_stringified_data', json_stringified_data);
    if (json_stringified_data) {
        req.write(json_stringified_data);
    }
    req.end();

    return deferred.promise;
}