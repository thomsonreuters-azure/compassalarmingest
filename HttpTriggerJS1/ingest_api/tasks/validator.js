'use strict';

const revalidator = require('revalidator');

const CAM_v2 = {
    properties: {
        //mandatory fields
        reporter: {type: 'string', allowEmpty: false, required: true},
        end_point_id: {type: 'string', allowEmpty: false, required: true},
        alarm_type: {type: 'string', allowEmpty: false, required: true},
        status: {
            type: 'string',
            allowEmpty: false,
            required: true,
            enum: ['OK', 'WARNING', 'INCONCLUSIVE', 'CRITICAL']
        },
        category: {type: 'string', allowEmpty: false, required: true},
        message: {type: 'string', allowEmpty: false, required: true},
        informer: {type: 'string', allowEmpty: false, required: true},
        occurred_at: {type: 'string', allowEmpty: false, required: true},
        //non-mandatory fields
        instance: {type: 'string', allowEmpty: false, required: false},
        domain: {type: 'object', allowEmpty: false, required: false},
        correlation_id: {type: 'string', allowEmpty: false, required: false},
        correlation_signature: {type: 'array', allowEmpty: false, required: false},
        context: {type: 'object', allowEmpty: false, required: false}
    }
};
const TRLog_V3 = {
    properties: {
        //mandatory fields
        'sp-eventSchemaVersion': {type: 'number', allowEmpty: false, required: true, enum: [3.0]}, //3.0
        'sp-timestamp': {type: 'string', allowEmpty: false, required: true, format: 'date-time'}, //ISO8601 '2015-10-30T14:14:42.042Z'
        'sp-eventSeverity': {
            type: 'string',
            allowEmpty: false,
            required: true,
            enum: ['OK', 'ok', 'WARNING', 'warning', 'INCONCLUSIVE', 'inconclusive', 'CRITICAL', 'critical']
        }, //'critical'
        'sp-message': {type: 'string', allowEmpty: false, required: true}, //'Error: eel.overflow'
        'sp-isAlarm': {type: 'boolean', allowEmpty: false, required: true}, //true
        'sp-applicationUniqueID': {type: 'string', allowEmpty: false, required: true}, //'203998'
        'sp-eventContext': {type: 'object', allowEmpty: false, required: true}, //{ 'sp-environmentClass': 'pre-production'}
        //non-mandatory fields
        'sp-eventType': {type: 'string', allowEmpty: false, required: false}, //'ips_mywebapp_alarm1'
        'sp-eventSourceVersion': {type: 'string', allowEmpty: false, required: false}, //'2.42.1'
        'sp-softwareModuleName': {type: 'string', allowEmpty: false, required: false}, //'mySoftwareModule'
        'sp-eventSourceUUID': {type: 'string', allowEmpty: false, required: false}, //'d7c5e965-1ca7-4970-a1e4-1f0262fa963d'
        'sp-humanInfo': {type: 'string', allowEmpty: false, required: false}, //'My hovercraft is full of eels'
        'sp-functionalDomain': {type: 'string', allowEmpty: false, required: false}, //'myAppDomain'
        'sp-threadName': {type: 'string', allowEmpty: false, required: false}, //'eel-handler-thread-1'
        'sp-eventGroupID': {type: 'string', allowEmpty: false, required: false}, //'eel_capacity_test'
        'sp-tags': {type: 'array', allowEmpty: false, required: false}, //['eel1','eel2']
        'sp-properties': {type: 'object', allowEmpty: false, required: false} //{'key1':'another eel','key2':'yet another eel'}
    }
};

const TRLog_V4 = {
  properties: {
    //mandatory fields
    'sp-eventSchemaVersion':  {type: 'number', allowEmpty: false, required: true}, //4.0
    'sp-timestamp':           {type: 'string', allowEmpty: false, required: true, format: 'date-time'}, //ISO8601 '2015-10-30T14:14:42.042Z'
    'sp-alarmStatus':         {type: 'string', allowEmpty: false, required: true, enum: ['OK', 'ok', 'WARNING', 'warning', 'INCONCLUSIVE', 'inconclusive', 'CRITICAL', 'critical']}, //'critical'
    'sp-message':             {type: 'string', allowEmpty: false, required: true}, //'Error: eel.overflow'
    'sp-applicationUniqueID': {type: 'string', allowEmpty: false, required: true}, //'203998'
    'sp-environmentClass':    {type: 'string', allowEmpty: false, required: true}, //'pre-production'}

    //non-mandatory fields
    'sp-eventType':           {type: 'string', allowEmpty: false, required: false}, //'ips_mywebapp_alarm1'
    'sp-eventSourceVersion':  {type: 'string', allowEmpty: false, required: false}, //'2.42.1'
    'sp-softwareModuleName':  {type: 'string', allowEmpty: false, required: false}, //'mySoftwareModule'
    'sp-eventSourceUUID':     {type: 'string', allowEmpty: false, required: false}, //'d7c5e965-1ca7-4970-a1e4-1f0262fa963d'
    'sp-functionalDomain':    {type: 'string', allowEmpty: false, required: false}, //'myAppDomain'
    'alarmEventGroupID':      {type: 'string', allowEmpty: false, required: false}, //'eel_capacity_test'
    'sp-tags':                {type: 'array', allowEmpty: false, required: false}, //['eel1','eel2']
    'sp-properties':          {type: 'object', allowEmpty: false, required: false}, //{'key1':'another eel','key2':'yet another eel'}
    'sp-environmentLabel':    {type: 'string', allowEmpty: false, required: false}, //'demo'}
    'sp-eventSourceHostname': {type: 'string', allowEmpty: false, required: false}, //'c123abc.int.thomsonreuters.com'}
    'sp-hostingModuleID':     {type: 'string', allowEmpty: false, required: false} //'H00184'}

  }
};


const AzureMetricAlarm = {
    properties: {
        //mandatory fields
        status: {type: 'string', allowEmpty: false, required: true},
        context: {
            type: 'object', allowEmpty: false, required: true,
            properties: {
                condition: {type: 'object', allowEmpty: false, required: true},
                resourceName: {type: 'string', allowEmpty: false, required: true},
                resourceType: {type: 'string', allowEmpty: false, required: true},
                resourceRegion: {type: 'string', allowEmpty: false, required: true},
                portalLink: {type: 'string', allowEmpty: false, required: true},
                timestamp: {type: ['string', 'object'], allowEmpty: false, required: true},
                id: {type: 'string', allowEmpty: false, required: true},
                name: {type: 'string', allowEmpty: false, required: true},
                description: {type: 'string', allowEmpty: true, required: true},
                conditionType: {type: 'string', allowEmpty: false, required: true},
                subscriptionId: {type: 'string', allowEmpty: false, required: true},
                resourceId: {type: 'string', allowEmpty: false, required: true},
                resourceGroupName: {type: 'string', allowEmpty: false, required: true}
            }
        }
    }
};

const AzureActivityAlarm = {
    properties: {
        //mandatory fields
        schemaId: {type: 'string', allowEmpty: false, required: true},
        data: {
            type: 'object', allowEmpty: false, required: true,
            properties: {
                status: {type: 'string', allowEmpty: false, required: true},
                context: {
                    type: 'object', allowEmpty: false, required: true,
                    properties: {
                        activityLog: {
                            type: 'object', allowEmpty: false, required: true,
                            properties: {
                                description: {type: 'string', allowEmpty: false, required: true},
                                level: {type: 'string', allowEmpty: false, required: true},
                                eventSource: {type: 'string', allowEmpty: false, required: true},
                                eventTimestamp: {type: 'string', allowEmpty: false, required: true},
                                properties : { type: 'object', allowEmpty: false, required: true,
                                    properties: {
                                        title: {type: 'string', allowEmpty: false, required: true},
                                        service: {type: 'string', allowEmpty: false, required: true},
                                        impactedServices: {type: 'string', allowEmpty: false, required: true},
                                    }

                                },
                                status: {type: 'string', allowEmpty: false, required: true},
                            }
                        }
                    }
                }
            }
        }
    }
};

const DataDogHealthAlarm = {
    properties: {
        //mandatory fields
        meta: {type: 'object', allowEmpty: false, required: true},
        page: {type: 'object', allowEmpty: false, required: true},
        component: {type: 'object', allowEmpty: false, required: false},
        component_update: {type: 'object', allowEmpty: false, required: false},
        incident: {type: 'object', allowEmpty: false, required: false}
    }
};



module.exports = function sanitise(event) {

    console.log('Raw Event:' + JSON.stringify(event, null, 4));

    let valid = {};

    if (event.hasOwnProperty('sp-eventSchemaVersion')) {
        if(event['sp-eventSchemaVersion'] < 4) {
          valid = revalidator.validate(event, TRLog_V3, {additionalProperties: true});
          valid.alarm_schema = 'TR_Log';
          valid.alarm_schema_version = 3.0;
        } else {
          valid = revalidator.validate(event, TRLog_V4, {additionalProperties: true});
          valid.alarm_schema = 'TR_Log';
          valid.alarm_schema_version = 4.0;
        }

    } else if (event.hasOwnProperty('status') && event.hasOwnProperty('context')) {

        if (event.context.hasOwnProperty('condition')) {
            valid = revalidator.validate(event, AzureMetricAlarm, {additionalProperties: true});
            valid.alarm_schema = 'Azure Metric Alarm';
            valid.alarm_schema_version = 1.0;
        } else {
            valid.valid = false;
            valid.errors = 'Unrecognised Azure alarm type';
        }

    } else if (event.hasOwnProperty('schemaId') && event.hasOwnProperty('data')) {
        valid = revalidator.validate(event, AzureActivityAlarm, {additionalProperties: true});
        valid.alarm_schema = 'Azure Service Health';
        valid.alarm_schema_version = 1.0;

    } else if (event.hasOwnProperty('meta') && event.hasOwnProperty('page')){
        valid = revalidator.validate(event, DataDogHealthAlarm, {additionalProperties: true});
        if(event.hasOwnProperty('incident')) {
            valid.alarm_schema = 'DataDog Service Incident';
        } else {
            valid.alarm_schema = 'DataDog Service Health';
        }

        valid.alarm_schema_version = 1.0;

    } else {
        valid = revalidator.validate(event, CAM_v2, {additionalProperties: false});
        valid.alarm_schema = 'CAM';
        valid.alarm_schema_version = 2.0;

    }

    return valid;
};
