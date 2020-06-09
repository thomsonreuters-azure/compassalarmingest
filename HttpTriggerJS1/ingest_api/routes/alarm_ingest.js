'use strict';

const
    publisher = require('../tasks/publisher'),
    validator = require('../tasks/validator'),
    _         = require('lodash'),
    moment    = require('moment'),
    Converter = require('../tasks/converter');

exports.ingest = function (req, context) {
    context.log('Ingest:', req.body);
    req.body = datetimesToString(req.body);
    function datetimesToString (body){
    // Azure bug strips quotes from timestamps making them appear to be an object when they have a dot before millisec
        var datetime_properties = [
            'occurred_at',
            'context.timestamp',
            'data.context.timestamp',
            'data.context.activityLog.eventTimestamp',
            'sp-timestamp'
        ];
        _.forEach(datetime_properties, function (datetime_property) {
            var date_value = _.get(body, datetime_property);
            if (_.has(body, datetime_property)) {
                context.log('Has timestamp:', datetime_property, date_value);
                if (moment.isDate(_.get(body, datetime_property))){
                    _.set(body, datetime_property, moment.utc(date_value).toISOString());
                } else if (moment.isMoment(date_value)){
                    _.set(body, datetime_property, date_value.toISOString());
                } else if (!_.isString(date_value)) {
                    context.log('Timestamp needs quotes');
                    _.set(body, datetime_property, '\'' + _.get(body, datetime_property) + '\'');
                    context.log('Quoted timestamp:', _.get(body, datetime_property));
                    if (!_.isString(date_value)) {
                        context.log('Timestamp needs replacing:');
                        _.set(body, datetime_property, moment.utc().toISOString());
                        context.log('Replaced timestamp:', _.get(body, datetime_property));
                    }
                }
            }
        });
        return body;
    }

    let validation = validator(req.body),
    res = context.res;

    context.log('Valid:', validation);
    let converter = new Converter();

    if (!validation.valid) {
        console.log('Validation Error:' + JSON.stringify(validation));
        context.log('Validation Error:' + JSON.stringify(validation));
        res.status(400).json({
            ingested: false,
            message: "Alarm validation error",
            message_details: validation.errors,
            alarm_schema: validation.alarm_schema,
            alarm_schema_version: validation.alarm_schema_version
        });
    } else {
        converter.convertToCam(req.body,validation.alarm_schema,validation.alarm_schema_version, context)
            .then(function (converted) {
                context.log('Converted:', converted);
                return publisher.SendToCam(converted, context)
                    .then(function () {
                        res.status(200).json({
                            ingested: true,
                            message: "Alarm ingested and sent to CAM",
                            alarm_schema: validation.alarm_schema,
                            alarm_schema_version: validation.alarm_schema_version
                        });
                    })
            })
            .catch(function (error) {
                console.log('Error:' + error);
                res.status(400).json({
                    ingested: false,
                    message: "Alarm ingest error",
                    message_details: error
                });
            });

    }
};
