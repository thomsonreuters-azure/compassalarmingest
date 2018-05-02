const
    q = require('q'),
    https = require('https');

module.exports = function https_request(options, json_stringified_data, context) {
    'use strict';
    context.log('https_request');
    options.path = '/alarm-ingest';
    options.pathname = '/alarm-ingest';
    options.host = 'api.alarms.monitor.aws.compass.thomsonreuters.com';
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