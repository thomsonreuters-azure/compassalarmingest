'use strict';

const
    library = require('../lib'),
    moment = require('moment'),
    q = require('q'),
    https = require('https');

function SendToCam(cam_message, context) {
    var options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'zOHtS8xIOE8In1uP7ghbP8jmUdVMvoMB4finmmPU'
        }
    };
    var stringified_alarm = JSON.stringify(cam_message);

    options.headers['Content-Length'] = stringified_alarm.length;
    context.log('sending it', stringified_alarm);
    return library.https_request(options, stringified_alarm, context);
}


module.exports.SendToCam = SendToCam;