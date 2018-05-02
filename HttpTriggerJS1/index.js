'use strict';

var alarmingest = require('./ingest_api/routes/alarm_ingest');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    if (req.body ) {
        return alarmingest.ingest(req,context);
    }

};