'use strict';

const
    root = '../../../../',

    q = require('q'),
    supertest = require('supertest'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    sinonChai = require('sinon-chai'),

    Converter = require(root + 'HttpTriggerJS1/ingest_api/tasks/converter'),
    context = {
        log: function (msg) {
            console.log(msg);
        }
    };

chai.use(sinonChai);

describe('converter', function () {

    let sandbox,
        converter;

    beforeEach(function () {

        this.clock = sinon.useFakeTimers(1456305586000); // epoch of '2016-02-24T09:19:46.000Z'

        converter = new Converter();
        sandbox = sinon.sandbox.create();


    });

    afterEach(function () {
        this.clock.restore();
        sandbox.restore();
    });

    describe('Conversion ready for publishing', function () {

        it('Converts a received CAM alarm', function () {

            let cam_v2_alarm = {
                reporter: 'AWS_CloudWatch',
                status: 'CRITICAL',
                message: 'Disk space F: at 90pc',
                category: 'ITM_DISK_SPACE',
                occurred_at: '2016-02-24T09:19:46Z',
                informer: 'some-host',
                end_point_id: 'some-host',
                alarm_type: 'host'
            };

            let alarm_schema = 'CAM',
                alarm_schema_version = 2.0;

            let expected_response = {
                reporter: 'AWS_CloudWatch',
                status: 'CRITICAL',
                message: 'Disk space F: at 90pc',
                category: 'ITM_DISK_SPACE',
                occurred_at: '2016-02-24T09:19:46Z',
                informer: 'some-host',
                end_point_id: 'some-host',
                alarm_type: 'host',
                domain: {
                    provenance: {
                        azure_alarm_ingest_api: {
                            informed_at: '2016-02-24T09:19:46.000Z',
                            informer: 'Azure ASE CAM API'
                        }
                    }
                }
            };

            return converter.convertToCam(cam_v2_alarm, alarm_schema, alarm_schema_version, context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });


        });

        it('Converts a received Azure Metric alarm', function () {

            let azure_alarm = {
                status: 'Activated',
                context: {
                    condition: {
                        metricName: 'CPU idle time',
                        metricUnit: 'Percent',
                        metricValue: '99',
                        threshold: '99',
                        windowSize: '5',
                        timeAggregation: 'Average',
                        operator: 'GreaterThan'
                    },
                    resourceName: 'compasstestvm',
                    resourceType: 'microsoft.compute/virtualmachines',
                    resourceRegion: 'centralus',
                    portalLink: 'https://portal.azure.com/#resource/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                    timestamp: '2017-01-16T15:08:06.7768750Z',
                    id: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/microsoft.insights/alertrules/compass_cpu_idle_test',
                    name: 'compass_cpu_idle_test',
                    description: 'Test cpu idle alarm',
                    conditionType: 'Metric',
                    subscriptionId: 'de02a256-5327-4bda-a301-ad8165a9a7f5',
                    resourceId: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                    resourceGroupName: 'centralus-ComALMgm'
                },
                properties: {'$type': 'Microsoft.WindowsAzure.Management.Common.Storage.CasePreservedDictionary`1[[System.String, mscorlib]], Microsoft.WindowsAzure.Management.Common.Storage'}
            };

            let alarm_schema = 'Azure Metric Alarm',
                alarm_schema_version = 1.0;

            let expected_response = {
                alarm_type: 'cloud',
                category: 'CPU idle time',
                domain: {
                    cloud_region_name: 'centralus',
                    cloud_namespace: 'microsoft.compute/virtualmachines',
                    cloud_account_id: 'de02a256-5327-4bda-a301-ad8165a9a7f5',
                    cloud_raw_alarm: {
                      status: 'Activated',
                      context: {
                        condition: {
                          metricName: 'CPU idle time',
                          metricUnit: 'Percent',
                          metricValue: '99',
                          threshold: '99',
                          windowSize: '5',
                          timeAggregation: 'Average',
                          operator: 'GreaterThan'
                        },
                        resourceName: 'compasstestvm',
                        resourceType: 'microsoft.compute/virtualmachines',
                        resourceRegion: 'centralus',
                        portalLink: 'https://portal.azure.com/#resource/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                        timestamp: '2017-01-16T15:08:06.7768750Z',
                        id: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/microsoft.insights/alertrules/compass_cpu_idle_test',
                        name: 'compass_cpu_idle_test',
                        description: 'Test cpu idle alarm',
                        conditionType: 'Metric',
                        subscriptionId: 'de02a256-5327-4bda-a301-ad8165a9a7f5',
                        resourceId: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                        resourceGroupName: 'centralus-ComALMgm'
                      },
                      properties: {'$type': 'Microsoft.WindowsAzure.Management.Common.Storage.CasePreservedDictionary`1[[System.String, mscorlib]], Microsoft.WindowsAzure.Management.Common.Storage'}
                    },
                    provenance: {
                        azure_alarm_ingest_api: {
                            informed_at: '2016-02-24T09:19:46.000Z',
                            informer: 'Azure ASE CAM API'
                        }
                    }
                },
                end_point_id: 'compasstestvm',
                informer: 'compasstestvm',
                message: 'CPU idle time GreaterThan 99 Percent',
                occurred_at: '2017-01-16T15:08:06.776Z',
                reporter: 'Azure',
                status: 'CRITICAL'
            };

            return converter.convertToCam(azure_alarm, alarm_schema, alarm_schema_version,context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });
        });

        it('Uses the received timestamp for Resolved alarms', function () {

            let azure_alarm = {
                status: 'Resolved',
                context: {
                    condition: {
                        metricName: 'CPU idle time',
                        metricUnit: 'Percent',
                        metricValue: '99',
                        threshold: '99',
                        windowSize: '5',
                        timeAggregation: 'Average',
                        operator: 'GreaterThan'
                    },
                    resourceName: 'compasstestvm',
                    resourceType: 'microsoft.compute/virtualmachines',
                    resourceRegion: 'centralus',
                    portalLink: 'https://portal.azure.com/#resource/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                    timestamp: '2017-01-16T15:08:06.7768750Z',
                    id: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/microsoft.insights/alertrules/compass_cpu_idle_test',
                    name: 'compass_cpu_idle_test',
                    description: 'Test cpu idle alarm',
                    conditionType: 'Metric',
                    subscriptionId: 'de02a256-5327-4bda-a301-ad8165a9a7f5',
                    resourceId: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                    resourceGroupName: 'centralus-ComALMgm'
                },
                properties: {'$type': 'Microsoft.WindowsAzure.Management.Common.Storage.CasePreservedDictionary`1[[System.String, mscorlib]], Microsoft.WindowsAzure.Management.Common.Storage'}
            };

            let alarm_schema = 'Azure Metric Alarm',
                alarm_schema_version = 1.0;

            let expected_response = {
                alarm_type: 'cloud',
                category: 'CPU idle time',
                domain: {
                  cloud_region_name: 'centralus',
                  cloud_namespace: 'microsoft.compute/virtualmachines',
                  cloud_account_id: 'de02a256-5327-4bda-a301-ad8165a9a7f5',
                  cloud_raw_alarm: {
                    status: 'Resolved',
                    context: {
                      condition: {
                        metricName: 'CPU idle time',
                        metricUnit: 'Percent',
                        metricValue: '99',
                        threshold: '99',
                        windowSize: '5',
                        timeAggregation: 'Average',
                        operator: 'GreaterThan'
                      },
                      resourceName: 'compasstestvm',
                      resourceType: 'microsoft.compute/virtualmachines',
                      resourceRegion: 'centralus',
                      portalLink: 'https://portal.azure.com/#resource/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                      timestamp: '2017-01-16T15:08:06.7768750Z',
                      id: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/microsoft.insights/alertrules/compass_cpu_idle_test',
                      name: 'compass_cpu_idle_test',
                      description: 'Test cpu idle alarm',
                      conditionType: 'Metric',
                      subscriptionId: 'de02a256-5327-4bda-a301-ad8165a9a7f5',
                      resourceId: '/subscriptions/de02a256-5327-4bda-a301-ad8165a9a7f5/resourceGroups/centralus-ComALMgm/providers/Microsoft.Compute/virtualMachines/compasstestvm',
                      resourceGroupName: 'centralus-ComALMgm'
                    },
                    properties: {'$type': 'Microsoft.WindowsAzure.Management.Common.Storage.CasePreservedDictionary`1[[System.String, mscorlib]], Microsoft.WindowsAzure.Management.Common.Storage'}
                  },
                  provenance: {
                    azure_alarm_ingest_api: {
                      informed_at: "2016-02-24T09:19:46.000Z",
                      informer: "Azure ASE CAM API"
                    }
                  }
                },
                end_point_id: 'compasstestvm',
                informer: 'compasstestvm',
                message: 'CPU idle time GreaterThan 99 Percent',
                occurred_at: '2016-02-24T09:19:46.000Z',
                reporter: 'Azure',
                status: 'OK'
            };

            return converter.convertToCam(azure_alarm, alarm_schema, alarm_schema_version, context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });
        });

        it('Converts a received Azure Service alarm', function () {

            let azure_service_alarm = {
                "schemaId": "Microsoft.Insights/activityLogs",
                "data": {
                    "status": "Activated",
                    "context": {
                        "activityLog": {
                            "channels": "Admin",
                            "correlationId": "41ab0b28-1fdc-4efe-8cde-11e73d23fa6a",
                            "description": "RCA - Network Infrastructure - UK South",
                            "eventSource": "ServiceHealth",
                            "eventTimestamp": "2017-07-24T22:31:12.385372+00:00",
                            "eventDataId": "b8d4d5a4-48be-5ef7-06ab-cb709fb42706",
                            "level": "Informational",
                            "operationName": "Microsoft.ServiceHealth/information/action",
                            "operationId": "41ab0b28-1fdc-4efe-8cde-11e73d23fa6a",
                            "properties": {
                                "title": "Resolved: RCA - Network Infrastructure - UK South",
                                "service": "Service Fabric",
                                "region": "UK South",
                                "communication": "SUMMARY OF IMPACT: Between July 20, 2017 21:41 UTC and July 21, 2017 1:40 UTC, a subset of customers may have encountered connectivity failures for their resources deployed in the UK South region. Customers would have experienced errors or timeouts while accessing their resources. Upon investigation, the Azure Load Balancing team found that the data plane for one of the instances of Azure Load Balancing service in UK South region was down. A single instance of Azure Load Balancing service has multiple instances of data plane. It was noticed that all data plane instances went down in quick succession and failed repeatedly whilst trying to self-recover. The team immediately started working on the mitigation to fail over from the offending Azure Load Balancing instance to another instance of Azure Load Balancing service. This failover process was delayed due to the fact that VIP address of Azure authentication service used to secure access to any Azure production service in that region was also being served by the Azure Load Balancing service instance that went down. The Engineering teams resolved the access issue and then recovered the impacted Azure Load Balancing service instance by failing over the impacted customers to another instance of Azure Load Balancing service. The dependent services recovered gradually once the underlying load balancing service instance was recovered. Full recovery by all of the affected services was confirmed by 01:40 UTC on 21 July 2017. WORKAROUND: Customers who had deployed their services across multiple regions could fail out of UK South region. ROOT CAUSE AND MITIGATION: The issue occurred when one of the instances of Azure Load Balancing service went down in the UK South region. The root cause of the issue was a bug in the Azure Load Balancing service. The issue was exposed due to a specific combination of configurations on this load balancing instance combined with a deployment specification that caused the data plane of the load balancing service to crash. There are multiple instances of data plane in a particular instance of Azure Load Balancing Service. However, due to this bug, the crash cascaded through multiple instances. The issue was recovered by failing over from the specific load balancing instance to another load balancing instance. The software bug was not detected in deployments in prior regions because it only manifested under specific combinations of the configuration in Azure Load Balancing services. The combination of configurations that exposed this bug was addressed by recovering the Azure Load Balancing service instance. NEXT STEPS: We sincerely apologize for the impact to affected customers. We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future. In this case, we will: 1. Roll out a fix to the bug which caused Azure Load Balancing instance data plane to crash. In the interim a temporary mitigation has been applied to prevent this bug from resurfacing in any other region. 2. Improve test coverage for the specific combination of configuration that exposed the bug. 3. Address operational issues for Azure Authentication services break-glass scenarios. PROVIDE FEEDBACK: Please help us improve the Azure customer communications experience by taking our survey: https://survey.microsoft.com/425965 ",
                                "incidentType": "Information",
                                "trackingId": "NA0F-BJG",
                                "groupId": "41ab0b28-1fdc-4efe-8cde-11e73d23fa6a",
                                "impactStartTime": "2017-07-20T21:41:00.0000000Z",
                                "impactMitigationTime": "2017-07-21T01:40:00.0000000Z",
                                "eventCreationTime": "2017-07-20T21:41:00.0000000Z",
                                "impactedServices": "[{\"ImpactedRegions\":[{\"RegionName\":\"UK South\"}],\"ServiceName\":\"Service Fabric\"}]",
                                "defaultLanguageTitle": "Resolved: RCA - Network Infrastructure - UK South",
                                "defaultLanguageContent": "SUMMARY OF IMPACT: Between July 20, 2017 21:41 UTC and July 21, 2017 1:40 UTC, a subset of customers may have encountered connectivity failures for their resources deployed in the UK South region. Customers would have experienced errors or timeouts while accessing their resources. Upon investigation, the Azure Load Balancing team found that the data plane for one of the instances of Azure Load Balancing service in UK South region was down. A single instance of Azure Load Balancing service has multiple instances of data plane. It was noticed that all data plane instances went down in quick succession and failed repeatedly whilst trying to self-recover. The team immediately started working on the mitigation to fail over from the offending Azure Load Balancing instance to another instance of Azure Load Balancing service. This failover process was delayed due to the fact that VIP address of Azure authentication service used to secure access to any Azure production service in that region was also being served by the Azure Load Balancing service instance that went down. The Engineering teams resolved the access issue and then recovered the impacted Azure Load Balancing service instance by failing over the impacted customers to another instance of Azure Load Balancing service. The dependent services recovered gradually once the underlying load balancing service instance was recovered. Full recovery by all of the affected services was confirmed by 01:40 UTC on 21 July 2017. WORKAROUND: Customers who had deployed their services across multiple regions could fail out of UK South region. ROOT CAUSE AND MITIGATION: The issue occurred when one of the instances of Azure Load Balancing service went down in the UK South region. The root cause of the issue was a bug in the Azure Load Balancing service. The issue was exposed due to a specific combination of configurations on this load balancing instance combined with a deployment specification that caused the data plane of the load balancing service to crash. There are multiple instances of data plane in a particular instance of Azure Load Balancing Service. However, due to this bug, the crash cascaded through multiple instances. The issue was recovered by failing over from the specific load balancing instance to another load balancing instance. The software bug was not detected in deployments in prior regions because it only manifested under specific combinations of the configuration in Azure Load Balancing services. The combination of configurations that exposed this bug was addressed by recovering the Azure Load Balancing service instance. NEXT STEPS: We sincerely apologize for the impact to affected customers. We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future. In this case, we will: 1. Roll out a fix to the bug which caused Azure Load Balancing instance data plane to crash. In the interim a temporary mitigation has been applied to prevent this bug from resurfacing in any other region. 2. Improve test coverage for the specific combination of configuration that exposed the bug. 3. Address operational issues for Azure Authentication services break-glass scenarios. PROVIDE FEEDBACK: Please help us improve the Azure customer communications experience by taking our survey: https://survey.microsoft.com/425965 ",
                                "stage": "Active",
                                "communicationId": "636365322721822668",
                                "version": "0.1"
                            },
                            "status": "Active",
                            "subscriptionId": "32c4b0ff-af38-4b6f-8efc-d70cd1276b00",
                            "submissionTimestamp": "2017-07-24T22:31:15.6299713+00:00"
                        }
                    },
                    "properties": {}
                }
            };


            let alarm_schema = 'Azure Service Health',
                alarm_schema_version = 1.0;

            let expected_response = {
                alarm_type: 'cloud',
                category: 'Service Fabric - Information',
                instance: '32c4b0ff-af38-4b6f-8efc-d70cd1276b00',
                domain: {
                    cloud_region_name: 'UK South',
                    cloud_account_id: "32c4b0ff-af38-4b6f-8efc-d70cd1276b00",
                    cloud_impacted_services: [{"ImpactedRegions":[{"RegionName":"UK South"}],"ServiceName":"Service Fabric"}],
                    cloud_raw_alarm : {
                      "status": "Activated",
                      "context": {
                        "activityLog": {
                          "channels": "Admin",
                          "correlationId": "41ab0b28-1fdc-4efe-8cde-11e73d23fa6a",
                          "description": "RCA - Network Infrastructure - UK South",
                          "eventSource": "ServiceHealth",
                          "eventTimestamp": "2017-07-24T22:31:12.385372+00:00",
                          "eventDataId": "b8d4d5a4-48be-5ef7-06ab-cb709fb42706",
                          "level": "Informational",
                          "operationName": "Microsoft.ServiceHealth/information/action",
                          "operationId": "41ab0b28-1fdc-4efe-8cde-11e73d23fa6a",
                          "properties": {
                            "title": "Resolved: RCA - Network Infrastructure - UK South",
                            "service": "Service Fabric",
                            "region": "UK South",
                            "communication": "SUMMARY OF IMPACT: Between July 20, 2017 21:41 UTC and July 21, 2017 1:40 UTC, a subset of customers may have encountered connectivity failures for their resources deployed in the UK South region. Customers would have experienced errors or timeouts while accessing their resources. Upon investigation, the Azure Load Balancing team found that the data plane for one of the instances of Azure Load Balancing service in UK South region was down. A single instance of Azure Load Balancing service has multiple instances of data plane. It was noticed that all data plane instances went down in quick succession and failed repeatedly whilst trying to self-recover. The team immediately started working on the mitigation to fail over from the offending Azure Load Balancing instance to another instance of Azure Load Balancing service. This failover process was delayed due to the fact that VIP address of Azure authentication service used to secure access to any Azure production service in that region was also being served by the Azure Load Balancing service instance that went down. The Engineering teams resolved the access issue and then recovered the impacted Azure Load Balancing service instance by failing over the impacted customers to another instance of Azure Load Balancing service. The dependent services recovered gradually once the underlying load balancing service instance was recovered. Full recovery by all of the affected services was confirmed by 01:40 UTC on 21 July 2017. WORKAROUND: Customers who had deployed their services across multiple regions could fail out of UK South region. ROOT CAUSE AND MITIGATION: The issue occurred when one of the instances of Azure Load Balancing service went down in the UK South region. The root cause of the issue was a bug in the Azure Load Balancing service. The issue was exposed due to a specific combination of configurations on this load balancing instance combined with a deployment specification that caused the data plane of the load balancing service to crash. There are multiple instances of data plane in a particular instance of Azure Load Balancing Service. However, due to this bug, the crash cascaded through multiple instances. The issue was recovered by failing over from the specific load balancing instance to another load balancing instance. The software bug was not detected in deployments in prior regions because it only manifested under specific combinations of the configuration in Azure Load Balancing services. The combination of configurations that exposed this bug was addressed by recovering the Azure Load Balancing service instance. NEXT STEPS: We sincerely apologize for the impact to affected customers. We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future. In this case, we will: 1. Roll out a fix to the bug which caused Azure Load Balancing instance data plane to crash. In the interim a temporary mitigation has been applied to prevent this bug from resurfacing in any other region. 2. Improve test coverage for the specific combination of configuration that exposed the bug. 3. Address operational issues for Azure Authentication services break-glass scenarios. PROVIDE FEEDBACK: Please help us improve the Azure customer communications experience by taking our survey: https://survey.microsoft.com/425965 ",
                            "incidentType": "Information",
                            "trackingId": "NA0F-BJG",
                            "groupId": "41ab0b28-1fdc-4efe-8cde-11e73d23fa6a",
                            "impactStartTime": "2017-07-20T21:41:00.0000000Z",
                            "impactMitigationTime": "2017-07-21T01:40:00.0000000Z",
                            "eventCreationTime": "2017-07-20T21:41:00.0000000Z",
                            "impactedServices": "[{\"ImpactedRegions\":[{\"RegionName\":\"UK South\"}],\"ServiceName\":\"Service Fabric\"}]",
                            "defaultLanguageTitle": "Resolved: RCA - Network Infrastructure - UK South",
                            "defaultLanguageContent": "SUMMARY OF IMPACT: Between July 20, 2017 21:41 UTC and July 21, 2017 1:40 UTC, a subset of customers may have encountered connectivity failures for their resources deployed in the UK South region. Customers would have experienced errors or timeouts while accessing their resources. Upon investigation, the Azure Load Balancing team found that the data plane for one of the instances of Azure Load Balancing service in UK South region was down. A single instance of Azure Load Balancing service has multiple instances of data plane. It was noticed that all data plane instances went down in quick succession and failed repeatedly whilst trying to self-recover. The team immediately started working on the mitigation to fail over from the offending Azure Load Balancing instance to another instance of Azure Load Balancing service. This failover process was delayed due to the fact that VIP address of Azure authentication service used to secure access to any Azure production service in that region was also being served by the Azure Load Balancing service instance that went down. The Engineering teams resolved the access issue and then recovered the impacted Azure Load Balancing service instance by failing over the impacted customers to another instance of Azure Load Balancing service. The dependent services recovered gradually once the underlying load balancing service instance was recovered. Full recovery by all of the affected services was confirmed by 01:40 UTC on 21 July 2017. WORKAROUND: Customers who had deployed their services across multiple regions could fail out of UK South region. ROOT CAUSE AND MITIGATION: The issue occurred when one of the instances of Azure Load Balancing service went down in the UK South region. The root cause of the issue was a bug in the Azure Load Balancing service. The issue was exposed due to a specific combination of configurations on this load balancing instance combined with a deployment specification that caused the data plane of the load balancing service to crash. There are multiple instances of data plane in a particular instance of Azure Load Balancing Service. However, due to this bug, the crash cascaded through multiple instances. The issue was recovered by failing over from the specific load balancing instance to another load balancing instance. The software bug was not detected in deployments in prior regions because it only manifested under specific combinations of the configuration in Azure Load Balancing services. The combination of configurations that exposed this bug was addressed by recovering the Azure Load Balancing service instance. NEXT STEPS: We sincerely apologize for the impact to affected customers. We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future. In this case, we will: 1. Roll out a fix to the bug which caused Azure Load Balancing instance data plane to crash. In the interim a temporary mitigation has been applied to prevent this bug from resurfacing in any other region. 2. Improve test coverage for the specific combination of configuration that exposed the bug. 3. Address operational issues for Azure Authentication services break-glass scenarios. PROVIDE FEEDBACK: Please help us improve the Azure customer communications experience by taking our survey: https://survey.microsoft.com/425965 ",
                            "stage": "Active",
                            "communicationId": "636365322721822668",
                            "version": "0.1"
                          },
                          "status": "Active",
                          "subscriptionId": "32c4b0ff-af38-4b6f-8efc-d70cd1276b00",
                          "submissionTimestamp": "2017-07-24T22:31:15.6299713+00:00"
                        }
                      },
                      "properties": {}
                    },
                    provenance: {
                        azure_alarm_ingest_api: {
                            informed_at: '2016-02-24T09:19:46.000Z',
                            informer: 'Azure ASE CAM API'
                        }
                    }
                },
                end_point_id: 'Service Fabric',
                informer: 'Azure ServiceHealth',
                message: 'SUMMARY OF IMPACT: Between July 20, 2017 21:41 UTC and July 21, 2017 1:40 UTC, a subset of customers may have encountered connectivity failures for their resources deployed in the UK South region. Customers would have experienced errors or timeouts while accessing their resources. Upon investigation, the Azure Load Balancing team found that the data plane for one of the instances of Azure Load Balancing service in UK South region was down. A single instance of Azure Load Balancing service has multiple instances of data plane. It was noticed that all data plane instances went down in quick succession and failed repeatedly whilst trying to self-recover. The team immediately started working on the mitigation to fail over from the offending Azure Load Balancing instance to another instance of Azure Load Balancing service. This failover process was delayed due to the fact that VIP address of Azure authentication service used to secure access to any Azure production service in that region was also being served by the Azure Load Balancing service instance that went down. The Engineering teams resolved the access issue and then recovered the impacted Azure Load Balancing service instance by failing over the impacted customers to another instance of Azure Load Balancing service. The dependent services recovered gradually once the underlying load balancing service instance was recovered. Full recovery by all of the affected services was confirmed by 01:40 UTC on 21 July 2017. WORKAROUND: Customers who had deployed their services across multiple regions could fail out of UK South region. ROOT CAUSE AND MITIGATION: The issue occurred when one of the instances of Azure Load Balancing service went down in the UK South region. The root cause of the issue was a bug in the Azure Load Balancing service. The issue was exposed due to a specific combination of configurations on this load balancing instance combined with a deployment specification that caused the data plane of the load balancing service to crash. There are multiple instances of data plane in a particular instance of Azure Load Balancing Service. However, due to this bug, the crash cascaded through multiple instances. The issue was recovered by failing over from the specific load balancing instance to another load balancing instance. The software bug was not detected in deployments in prior regions because it only manifested under specific combinations of the configuration in Azure Load Balancing services. The combination of configurations that exposed this bug was addressed by recovering the Azure Load Balancing service instance. NEXT STEPS: We sincerely apologize for the impact to affected customers. We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future. In this case, we will: 1. Roll out a fix to the bug which caused Azure Load Balancing instance data plane to crash. In the interim a temporary mitigation has been applied to prevent this bug from resurfacing in any other region. 2. Improve test coverage for the specific combination of configuration that exposed the bug. 3. Address operational issues for Azure Authentication services break-glass scenarios. PROVIDE FEEDBACK: Please help us improve the Azure customer communications experience by taking our survey: https://survey.microsoft.com/425965 ',
                occurred_at: '2017-07-24T22:31:12.385Z',
                reporter: 'Azure_Health',
                status: 'CRITICAL',
                correlation_signature: ['end_point_id', 'domain.azure_region_name', 'category', 'instance']
            };

            return converter.convertToCam(azure_service_alarm, alarm_schema, alarm_schema_version, context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });
        });

        it('Converts a received TR Log v3 alarm', function () {

            let tr_log_v3 = {
                'sp-eventSchemaVersion': 3.0,
                'sp-timestamp': '2015-10-30T14:14:42.042Z',
                'sp-eventSourceUUID': 'd7c5e965-1ca7-4970-a1e4-1f0262fa963d',
                'sp-eventType': 'ips_mywebapp_alarm1',
                'sp-eventSeverity': 'critical',
                'sp-eventSourceVersion': '2.42.1',
                'sp-message': 'Error: eel.overflow',
                'sp-isAlarm': true,
                'sp-applicationUniqueID': '203998',
                'sp-softwareModuleName': 'mySoftwareModule',
                'sp-eventContext': {
                    'sp-environmentClass': 'pre-production',
                    'sp-environmentInstance': 'demo',
                    'sp-eventSourceHostname': 'c123abc.int.thomsonreuters.com',
                    'sp-hostingModuleID': 'H00184'
                }
            };

            let alarm_schema = 'TR_Log',
                alarm_schema_version = 3.0;

            let expected_response = {
                'sp-eventSchemaVersion': 3.0,
                'sp-timestamp': '2015-10-30T14:14:42.042Z',
                'sp-eventSourceUUID': 'd7c5e965-1ca7-4970-a1e4-1f0262fa963d',
                'sp-eventType': 'ips_mywebapp_alarm1',
                'sp-eventSeverity': 'critical',
                'sp-eventSourceVersion': '2.42.1',
                'sp-message': 'Error: eel.overflow',
                'sp-isAlarm': true,
                'sp-applicationUniqueID': '203998',
                'sp-softwareModuleName': 'mySoftwareModule',
                'sp-eventContext': {
                    'sp-environmentClass': 'pre-production',
                    'sp-environmentInstance': 'demo',
                    'sp-eventSourceHostname': 'c123abc.int.thomsonreuters.com',
                    'sp-hostingModuleID': 'H00184'
                }
            };

            return converter.convertToCam(tr_log_v3, alarm_schema, alarm_schema_version, context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });

        });

      it('Converts a received TR Log v4 alarm', function () {

        let tr_log_v4 = {
          'sp-eventSchemaVersion': 4.0,
          'sp-timestamp': '2017-11-14T10:48:00.597Z',
          'sp-alarmStatus': 'CRITICAL',
          'sp-message': 'Expect percent 99% identical of another venue/2017-10-02/rawMP but got 20.00%',
          'sp-applicationUniqueID': '204250',
          'sp-environmentClass': 'PRODUCTION',
          'sp-eventType': 'vbd_manifest_compare_alarm',
          'sp-eventSourceVersion': 'PROD',
          'sp-softwareModuleName': 'vbd_manifest_compare',
          'sp-eventSourceHostname': 'arn:aws:lambda:us-east-1:434679419647:function:lambda_vbd_manifest_compare:PROD',
          'sp-functionalDomain': 'AWS',
          'alarmEventGroupID': 'vbd_manifest_compare: another venue',
          'sp-properties': {
            'info': {
              'comparison_type': 'automatic',
              'reference_bucket': 'foo_bucket_hdc',
              'difference_bucket': 'foo_bucket_pln',
              'cache_bucket': 'foo_bucket_cache',
              'diff_percent_threshold': '99%',
              'notice_sns_topic_arn': 'arn:aws:sns:us-east-1:123456789012:foo-topic',
              'venue': 'another venue',
              'date': '2017-10-02',
              'type': 'rawMP'
            },
            'result': {
              'reference_ric_count': 4,
              'difference_ric_count': 4,
              'matched_ric_count': 1,
              'reference_only_ric_count': 1,
              'difference_only_ric_count': 1,
              'ric_match_percent': '20.00%',
              'reference_records_num': 100,
              'difference_records_num': 90,
              'mismatched_ric_count': 2,
              'record_mismatched_percent': '10.00%'
            }
          }
        };

        let alarm_schema = 'TR_Log',
          alarm_schema_version = 4.0;

        let expected_response = {
          'sp-eventSchemaVersion': 4.0,
          'sp-timestamp': '2017-11-14T10:48:00.597Z',
          'sp-alarmStatus': 'CRITICAL',
          'sp-message': 'Expect percent 99% identical of another venue/2017-10-02/rawMP but got 20.00%',
          'sp-applicationUniqueID': '204250',
          'sp-environmentClass': 'PRODUCTION',
          'sp-eventType': 'vbd_manifest_compare_alarm',
          'sp-eventSourceVersion': 'PROD',
          'sp-softwareModuleName': 'vbd_manifest_compare',
          'sp-eventSourceHostname': 'arn:aws:lambda:us-east-1:434679419647:function:lambda_vbd_manifest_compare:PROD',
          'sp-functionalDomain': 'AWS',
          'alarmEventGroupID': 'vbd_manifest_compare: another venue',
          'sp-properties': {
            'info': {
              'comparison_type': 'automatic',
              'reference_bucket': 'foo_bucket_hdc',
              'difference_bucket': 'foo_bucket_pln',
              'cache_bucket': 'foo_bucket_cache',
              'diff_percent_threshold': '99%',
              'notice_sns_topic_arn': 'arn:aws:sns:us-east-1:123456789012:foo-topic',
              'venue': 'another venue',
              'date': '2017-10-02',
              'type': 'rawMP'
            },
            'result': {
              'reference_ric_count': 4,
              'difference_ric_count': 4,
              'matched_ric_count': 1,
              'reference_only_ric_count': 1,
              'difference_only_ric_count': 1,
              'ric_match_percent': '20.00%',
              'reference_records_num': 100,
              'difference_records_num': 90,
              'mismatched_ric_count': 2,
              'record_mismatched_percent': '10.00%'
            }
          },
          provenance: {
            azure_alarm_ingest_api: {
              informed_at: '2016-02-24T09:19:46.000Z',
              informer: 'Azure ASE CAM API'
            }
          }
        };

        return converter.convertToCam(tr_log_v4, alarm_schema, alarm_schema_version, context)
        .then(function (converted) {
          expect(converted).to.deep.equal(expected_response);
        });

      });

        it('Converts a received DataDog Service Health alarm', function () {

            let datadog_service_alarm = {
                "meta": {
                    "unsubscribe": "http://status.datadoghq.com/?unsubscribe=hmyv34mhlk6p",
                    "documentation": "http://doers.statuspage.io/customer-notifications/webhooks/",
                    "generated_at": "2017-08-08T14:41:42.493Z"
                },
                "page": {
                    "id": "1k6wzpspjf99",
                    "status_indicator": "minor",
                    "status_description": "Partially Degraded Service"
                },
                "component": {
                    "status": "degraded_performance",
                    "name": "API",
                    "created_at": "2013-07-01T23:10:23.077Z",
                    "updated_at": "2017-08-08T14:41:37.388Z",
                    "position": 1,
                    "description": null,
                    "showcase": false,
                    "id": "1kbgg1cp74tb",
                    "page_id": "1k6wzpspjf99",
                    "group_id": null
                },
                "component_update": {
                    "old_status": "operational",
                    "new_status": "degraded_performance",
                    "created_at": "2017-08-08T14:41:37.394Z",
                    "component_type": "Component",
                    "id": "ckdysmnpzs2r",
                    "component_id": "1kbgg1cp74tb"
                }
            };

            let alarm_schema = 'DataDog Service Health',
                alarm_schema_version = 1.0;

            let expected_response = {
                alarm_type: 'cloud',
                category: 'API',
                domain: {
                    cloud_region_name: 'Global',
                    cloud_account_id: 'All',
                    cloud_namespace: 'API',
                    cloud_raw_alarm : {
                      "meta": {
                        "unsubscribe": "http://status.datadoghq.com/?unsubscribe=hmyv34mhlk6p",
                        "documentation": "http://doers.statuspage.io/customer-notifications/webhooks/",
                        "generated_at": "2017-08-08T14:41:42.493Z"
                      },
                      "page": {
                        "id": "1k6wzpspjf99",
                        "status_indicator": "minor",
                        "status_description": "Partially Degraded Service"
                      },
                      "component": {
                        "status": "degraded_performance",
                        "name": "API",
                        "created_at": "2013-07-01T23:10:23.077Z",
                        "updated_at": "2017-08-08T14:41:37.388Z",
                        "position": 1,
                        "description": null,
                        "showcase": false,
                        "id": "1kbgg1cp74tb",
                        "page_id": "1k6wzpspjf99",
                        "group_id": null
                      },
                      "component_update": {
                        "old_status": "operational",
                        "new_status": "degraded_performance",
                        "created_at": "2017-08-08T14:41:37.394Z",
                        "component_type": "Component",
                        "id": "ckdysmnpzs2r",
                        "component_id": "1kbgg1cp74tb"
                      }
                    },
                    provenance: {
                        azure_alarm_ingest_api: {
                            informed_at: '2016-02-24T09:19:46.000Z',
                            informer: 'Azure ASE CAM API'
                        }
                    }
                },
                end_point_id: 'DataDog',
                informer: 'DataDog ServiceHealth',
                message: 'Partially Degraded Service',
                occurred_at: '2017-08-08T14:41:42.493Z',
                reporter: 'DataDog',
                status: 'WARNING',
                correlation_signature: ['end_point_id', 'category']
            };

            return converter.convertToCam(datadog_service_alarm, alarm_schema, alarm_schema_version, context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });
        });

        it('Converts a received DataDog Service Incident', function () {

            let datadog_incident_alarm = {
                "meta": {
                    "unsubscribe": "http://status.datadoghq.com/?unsubscribe=hmyv34mhlk6p",
                    "documentation": "http://doers.statuspage.io/customer-notifications/webhooks/",
                    "generated_at": "2017-08-08T14:45:46.343Z"
                },
                "page": {
                    "id": "1k6wzpspjf99",
                    "status_indicator": "minor",
                    "status_description": "Partially Degraded Service"
                },
                "incident": {
                    "name": "API intermittent errors",
                    "status": "investigating",
                    "created_at": "2017-08-08T10:45:44.090-04:00",
                    "updated_at": "2017-08-08T10:45:44.758-04:00",
                    "monitoring_at": null,
                    "resolved_at": null,
                    "impact": "minor",
                    "shortlink": "http://stspg.io/feacd1657",
                    "postmortem_ignored": false,
                    "postmortem_body": null,
                    "postmortem_body_last_updated_at": null,
                    "postmortem_published_at": null,
                    "postmortem_notified_subscribers": false,
                    "postmortem_notified_twitter": false,
                    "backfilled": false,
                    "scheduled_for": null,
                    "scheduled_until": null,
                    "scheduled_remind_prior": false,
                    "scheduled_reminded_at": null,
                    "impact_override": null,
                    "scheduled_auto_in_progress": false,
                    "scheduled_auto_completed": false,
                    "id": "9g7yvbccltvk",
                    "page_id": "1k6wzpspjf99",
                    "incident_updates": [
                        {
                            "status": "investigating",
                            "body": "We are experiencing delays in our pipeline resulting in intermittent HTTP errors. As a result, metrics and alerts are delayed, however, these will be backfilled and replayed once issues are resolved.",
                            "created_at": "2017-08-08T10:45:44.212-04:00",
                            "wants_twitter_update": true,
                            "twitter_updated_at": "2017-08-08T14:45:44.745Z",
                            "updated_at": "2017-08-08T10:45:44.745-04:00",
                            "display_at": "2017-08-08T10:45:44.212-04:00",
                            "affected_components": [
                                {
                                    "name": "No components were affected by this update."
                                }
                            ],
                            "custom_tweet": null,
                            "id": "khbq8r3dmwsf",
                            "incident_id": "9g7yvbccltvk"
                        }
                    ]
                }
            };

            let alarm_schema = 'DataDog Service Incident',
                alarm_schema_version = 1.0;

            let expected_response = {
                alarm_type: 'cloud',
                category: 'api intermittent errors',
                domain: {
                    cloud_region_name: 'Global',
                    cloud_account_id : 'All',
                    cloud_namespace: 'API intermittent errors',
                    cloud_raw_alarm: {
                      "meta": {
                        "unsubscribe": "http://status.datadoghq.com/?unsubscribe=hmyv34mhlk6p",
                        "documentation": "http://doers.statuspage.io/customer-notifications/webhooks/",
                        "generated_at": "2017-08-08T14:45:46.343Z"
                      },
                      "page": {
                        "id": "1k6wzpspjf99",
                        "status_indicator": "minor",
                        "status_description": "Partially Degraded Service"
                      },
                      "incident": {
                        "name": "API intermittent errors",
                        "status": "investigating",
                        "created_at": "2017-08-08T10:45:44.090-04:00",
                        "updated_at": "2017-08-08T10:45:44.758-04:00",
                        "monitoring_at": null,
                        "resolved_at": null,
                        "impact": "minor",
                        "shortlink": "http://stspg.io/feacd1657",
                        "postmortem_ignored": false,
                        "postmortem_body": null,
                        "postmortem_body_last_updated_at": null,
                        "postmortem_published_at": null,
                        "postmortem_notified_subscribers": false,
                        "postmortem_notified_twitter": false,
                        "backfilled": false,
                        "scheduled_for": null,
                        "scheduled_until": null,
                        "scheduled_remind_prior": false,
                        "scheduled_reminded_at": null,
                        "impact_override": null,
                        "scheduled_auto_in_progress": false,
                        "scheduled_auto_completed": false,
                        "id": "9g7yvbccltvk",
                        "page_id": "1k6wzpspjf99",
                        "incident_updates": [
                          {
                            "status": "investigating",
                            "body": "We are experiencing delays in our pipeline resulting in intermittent HTTP errors. As a result, metrics and alerts are delayed, however, these will be backfilled and replayed once issues are resolved.",
                            "created_at": "2017-08-08T10:45:44.212-04:00",
                            "wants_twitter_update": true,
                            "twitter_updated_at": "2017-08-08T14:45:44.745Z",
                            "updated_at": "2017-08-08T10:45:44.745-04:00",
                            "display_at": "2017-08-08T10:45:44.212-04:00",
                            "affected_components": [
                              {
                                "name": "No components were affected by this update."
                              }
                            ],
                            "custom_tweet": null,
                            "id": "khbq8r3dmwsf",
                            "incident_id": "9g7yvbccltvk"
                          }
                        ]
                      }
                    },
                    provenance: {
                        azure_alarm_ingest_api: {
                            informed_at: '2016-02-24T09:19:46.000Z',
                            informer: 'Azure ASE CAM API'
                        }
                    }
                },
                end_point_id: 'DataDog',
                informer: 'DataDog ServiceHealth',
                message: 'We are experiencing delays in our pipeline resulting in intermittent HTTP errors. As a result, metrics and alerts are delayed, however, these will be backfilled and replayed once issues are resolved.',
                occurred_at: '2017-08-08T14:45:46.343Z',
                reporter: 'DataDog',
                status: 'WARNING',
                correlation_signature: ['end_point_id', 'category']
            };

            return converter.convertToCam(datadog_incident_alarm, alarm_schema, alarm_schema_version, context)
                .then(function (converted) {
                    expect(converted).to.deep.equal(expected_response);
                });
        });

    });

});
