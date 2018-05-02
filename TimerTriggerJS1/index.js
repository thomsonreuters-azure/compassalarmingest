const
    http_request = require('./lib/http_request');

module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString().toString(),
        environment_config = {
            compassalarmingestppe: {
                tracer: 'Azure_Shared_Services-Non_Prod_Ingest',
                name: 'Azure Shared Services Non-Prod Compass Alarm Ingest Tracer',
                hostname: 'api.alarms.monitor.azure.compass-stage.thomsonreuters.com',
                path: '/alarm-ingest',
                key: 'f6478c51b2734b49a438fefcea8c77da'
            },
            compassalarmsupportppe: {
                tracer: 'Azure_Shared_Services-Non_Prod_Support',
                name: 'Azure Shared Services Non-Prod Compass Alarm Support Tracer',
                hostname: 'compassalarmsupportppe.azurewebsites.net',
                path: '/api/alarm-ingest',
                key: 'f6478c51b2734b49a438fefcea8c77da'
            },
            compassalarmingestprod: {
                tracer: 'Azure_Shared_Services-Production_Ingest',
                name: 'Azure Shared Services Production Compass Alarm Ingest Tracer',
                hostname: 'api.alarms.monitor.azure.compass.thomsonreuters.com',
                path: '/alarm-ingest',
                key: 'e6ce57d2ae164e0aac653cc5262279d7'
            },
            compassalarmsupportprod: {
                tracer: 'Azure_Shared_Services-Production_Support',
                name: 'Azure Shared Services Production Compass Alarm Support Tracer',
                hostname: 'compassalarmsupportprod.azurewebsites.net',
                path: '/api/alarm-ingest',
                key: 'e6ce57d2ae164e0aac653cc5262279d7'
            }
        },
        tracer_config = {},
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        },
        env_label;
    if (process.env.hasOwnProperty('WEBSITE_SITE_NAME')) {
        env_label = process.env['WEBSITE_SITE_NAME'].toLowerCase();
    } else {
        throw new Error('Could not get slot from env variable: WEBSITE_OWNER_NAME in ', process.env);
    }
    if (environment_config[env_label]) {
        tracer_config = environment_config[env_label];
    } else {
        throw new Error('Could match an environment config from the given slot', env_label);
    }

    var stringified_tracer = JSON.stringify({
        reporter: 'Azure',
        status: 'OK',
        end_point_id: '203773',
        alarm_type: 'application',
        message: 'Compass Alarms tracer for ' + tracer_config.name,
        category: 'COMPASS ALARMS TRACER:' + tracer_config.tracer,
        informer: 'send_tracer_azure',
        occurred_at: timeStamp
    });

    options.headers['Content-Length'] = stringified_tracer.length;
    options.headers['Ocp-Apim-Subscription-Key'] =  tracer_config.key;
    options.path = tracer_config.path;
    options.hostname = tracer_config.hostname;
    context.log('sending [', env_label, '] tracer', stringified_tracer);
    return http_request(options, stringified_tracer, context);
};