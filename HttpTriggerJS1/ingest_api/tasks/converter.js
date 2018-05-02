'use strict';

const _ = require('lodash'),
    moment = require('moment'),
    q = require('q'),
    rp = require('request-promise');

function ConvertToCam() {

    let provenance = {
        informed_at: moment.utc().toISOString(),
        informer: 'Azure CAM API'
    };

    function convertCAMtoCAM(cam_alarm) {
        _.merge(cam_alarm, {domain: {provenance: {azure_alarm_ingest_api: provenance}}});
        return cam_alarm
    }

    function convertTRLogV2toCAM(tr_log_alarm) {

        return tr_log_alarm //TR Log is passed straight through to CAM without conversion
    }

    function convertTRLogV4toCAM(tr_log_alarm) {

        _.merge(tr_log_alarm, {provenance: {azure_alarm_ingest_api: provenance}});
        return tr_log_alarm //TR Log is passed straight through to CAM without conversion
    }

    function convertAzuretoCAM(azure_alarm, context) {

        let alarm_map = {
            'Activated': 'CRITICAL',
            'Resolved': 'OK'
        };

        let occurred_at = moment.parseZone(azure_alarm.context.timestamp).toISOString();

        let status = alarm_map[azure_alarm.status];

        if (status === 'OK') {
            occurred_at = provenance.informed_at;
        }

        return getTags(azure_alarm, context).then(
            function(tags){
                return {
                    alarm_type: 'cloud',
                    category: azure_alarm.context.condition.metricName,
                    end_point_id: azure_alarm.context.resourceName,
                    informer: azure_alarm.context.resourceName,
                    message: azure_alarm.context.condition.metricName + ' ' + azure_alarm.context.condition.operator + ' ' + azure_alarm.context.condition.threshold + ' ' + azure_alarm.context.condition.metricUnit,
                    occurred_at: occurred_at,
                    reporter: 'Azure',
                    status: status,
                    domain: {
                        cloud_account_id: azure_alarm.context.subscriptionId,
                        cloud_region_name: azure_alarm.context.resourceRegion,
                        cloud_namespace: azure_alarm.context.resourceType,
                        cloud_raw_alarm: azure_alarm,
                        provenance: {
                            azure_alarm_ingest_api: provenance
                        },
                        cloud_tags: tags
                    }
                };
            })
    }


    function convertAzureHealthtoCAM(azure_alarm, context) {

        let alarm_map = {
            'Activated': 'CRITICAL',
            'Resolved': 'OK',
            'Active': 'CRITICAL'
        };
        return getTags(azure_alarm, context).then(
            function(tags){
                return {
                    alarm_type: 'cloud',
                    category: azure_alarm.data.context.activityLog.properties.service + ' - ' + azure_alarm.data.context.activityLog.properties.incidentType,
                    instance: azure_alarm.data.context.activityLog.subscriptionId,
                    end_point_id: azure_alarm.data.context.activityLog.properties.service,
                    informer: 'Azure ServiceHealth',
                    message: azure_alarm.data.context.activityLog.properties.communication,
                    occurred_at: moment(azure_alarm.data.context.activityLog.eventTimestamp).toISOString(),
                    reporter: 'Azure_Health',
                    status: alarm_map[azure_alarm.data.context.activityLog.status],
                    domain: {
                        cloud_region_name: azure_alarm.data.context.activityLog.properties.region,
                        cloud_account_id: azure_alarm.data.context.activityLog.subscriptionId,
                        cloud_raw_alarm: azure_alarm.data,
                        cloud_impacted_services: JSON.parse(azure_alarm.data.context.activityLog.properties.impactedServices),
                        provenance: {
                            azure_alarm_ingest_api: provenance
                        },
                        cloud_tags: tags
                    },
                    correlation_signature: ['end_point_id', 'domain.azure_region_name', 'category', 'instance']
                };
            });
    }

    function convertDataDogHealthToCAM(datadog_health_alarm) {

        let alarm_map = {
            'operational': 'OK',
            'degraded_performance': 'WARNING',
            'partial_outage': 'WARNING',
            'major_outage': 'CRITICAL'
        };

        return {
            alarm_type: 'cloud',
            category: datadog_health_alarm.component.name,
            end_point_id: 'DataDog',
            informer: 'DataDog ServiceHealth',
            message: datadog_health_alarm.page.status_description,
            occurred_at: moment(datadog_health_alarm.meta.generated_at).toISOString(),
            reporter: 'DataDog',
            status: alarm_map[datadog_health_alarm.component.status],
            domain: {
                cloud_region_name: 'Global',
                cloud_raw_alarm: datadog_health_alarm,
                cloud_account_id: 'All',
                cloud_namespace: datadog_health_alarm.component.name,
                provenance: {
                    azure_alarm_ingest_api: provenance
                }
            },
            correlation_signature: ['end_point_id', 'category']
        };
    }

    function convertDataDogServiceIncidentToCAM(datadog_service_incident_alarm) {

        let alarm_map = {
            'resolved': 'OK',
            'investigating': 'WARNING',
            'identified': 'CRITICAL',
            'monitoring': 'CRITICAL'
        };

        return {
            alarm_type: 'cloud',
            category: datadog_service_incident_alarm.incident.name.toLowerCase(),
            end_point_id: 'DataDog',
            informer: 'DataDog ServiceHealth',
            message: datadog_service_incident_alarm.incident.incident_updates[0].body,
            occurred_at: moment(datadog_service_incident_alarm.meta.generated_at).toISOString(),
            reporter: 'DataDog',
            status: alarm_map[datadog_service_incident_alarm.incident.status],
            domain: {
                cloud_region_name: 'Global',
                cloud_raw_alarm: datadog_service_incident_alarm,
                cloud_account_id: 'All',
                cloud_namespace: datadog_service_incident_alarm.incident.name,
                provenance: {
                    azure_alarm_ingest_api: provenance
                }
            },
            correlation_signature: ['end_point_id', 'category']
        };

    }



    var subs_apiver = '2018-02-01';

    var getToken = function (resource, apiver, context) {
            context.log('Getting Token...');
            var options = {
                uri: process.env["MSI_ENDPOINT"] + '/?resource=' + resource + '&api-version=' + apiver,
                headers: {
                    'Secret': process.env["MSI_SECRET"]
                }
            };
            return rp(options);
        },
        readResourceGroups = function (resource_group_metadata, apiver, token, context) {
            context.log('Getting Tags for subscription:', resource_group_metadata.resource_group_name, resource_group_metadata.subscription_id);
            var options = {
                uri: 'https://management.azure.com/subscriptions/' + resource_group_metadata.subscription_id + '/resourcegroups?api-version=' + apiver,
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            };
            return rp(options);
        },
        getAzureRG = function (event) {
            return {
                resource_group_name: event.context.resourceGroupName,
                subscription_id: event.context.subscriptionId
            };
        },
        getTags = function (event, context) {
            var tags = {},
                resource_group_metadata = getAzureRG(event);
            return getToken('https://management.azure.com/', '2017-09-01', context)
                .then(function (result) {
                    var token = JSON.parse(result).access_token;
                    context.log('Got token:', token);
                    return readResourceGroups(resource_group_metadata, subs_apiver, token, context)
                        .then(function (tag_response) {
                            var rgs = JSON.parse(tag_response).value;
                            context.log('Got rgs:', rgs);
                            var specific_rg = _.find(rgs, function (rg) {
                                return rg.name.toLowerCase() === resource_group_metadata.resource_group_name.toLowerCase();
                            });
                            if (! _.isUndefined(specific_rg)) {
                                tags = _.get(specific_rg, 'tags');
                                context.log('Setting tags from event rg:', tags);
                            }
                            if (_.isUndefined(specific_rg) || _.isEqual( tags, {})) {
                                // RG or tags not found. Try to get the tags from any available rg returned
                                var tags_not_found = true;
                                _.forEach(rgs, function (rg) {
                                    if (_.has(rg, 'tags') && tags_not_found) {
                                        tags = _.get(rg, 'tags');
                                        context.log('Setting any tags found:', tags);
                                        tags_not_found = false;
                                    }
                                });
                            }
                            return tags;
                        })
                        .catch(function (err) {
                            context.log('Error', err);
                            return tags;
                        });
                });
        };

    this.convertToCam = function (alarm, alarm_schema, alarm_schema_version, context) {
        context.log(JSON.stringify(alarm, null, 4));
        context.log(alarm_schema);
        context.log(alarm_schema_version);
        if (alarm_schema === 'CAM' && alarm_schema_version === 2.0) {
            return q(convertCAMtoCAM(alarm));
        }
        if (alarm_schema === 'TR_Log' && alarm_schema_version === 3.0) {
            return q(convertTRLogV2toCAM(alarm));
        }
        if (alarm_schema === 'TR_Log' && alarm_schema_version === 4.0) {
            return q(convertTRLogV4toCAM(alarm));
        }
        if (alarm_schema === 'Azure Metric Alarm' && alarm_schema_version === 1.0) {
            return q(convertAzuretoCAM(alarm, context));
        }
        if (alarm_schema === 'Azure Service Health' && alarm_schema_version === 1.0) {
            return q(convertAzureHealthtoCAM(alarm, context));
        }
        if (alarm_schema === 'DataDog Service Health' && alarm_schema_version === 1.0) {
            return q(convertDataDogHealthToCAM(alarm));
        }
        if (alarm_schema === 'DataDog Service Incident' && alarm_schema_version === 1.0) {
            return q(convertDataDogServiceIncidentToCAM(alarm));
        }

    }

}


module.exports = ConvertToCam;