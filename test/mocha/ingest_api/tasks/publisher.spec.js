'use strict';

const
    root = '../../../../',

    q = require('q'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = require('chai').expect,
    sinonChai = require('sinon-chai'),
    _ = require('lodash'),
    nock = require('nock'),
    promiseOf = require(root + 'test/resources/helpers').promiseOf,

    ingestLibrary = require(root + 'HttpTriggerJS1/ingest_api/lib'),
    Publisher = require(root + 'HttpTriggerJS1/ingest_api/tasks/publisher'),
    Converter = require(root + 'HttpTriggerJS1/ingest_api/tasks/converter'),
    context = {
        log: function (msg) {
            console.log(msg);
        }
    };


chai.use(sinonChai);

describe('tasks', function () {

    let sandbox,
        converter;

    beforeEach(function () {

        sandbox = sinon.sandbox.create();
        converter = new Converter();
        this.clock = sinon.useFakeTimers(1456305586000); // epoch of '2016-02-24T09:19:46.000Z'

    });

    afterEach(function () {
        this.clock.restore();
        nock.cleanAll();
        sandbox.restore();
    });

    describe('publisher', function () {

        it('Publishes the alarm to the CAM API', function (done) {

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

            let success_response = {
                response: 'Alarm Consumed',
                headers: {},
                statusCode: 200
            };

            let https_stub = sandbox.stub(ingestLibrary, 'https_request', promiseOf(success_response));

            converter.convertToCam(cam_v2_alarm,'CAM',2.0,context)
                .then(function(converted) {
                     return Publisher.SendToCam(converted, context)
                        .then(function (response) {
                            expect(response.response).to.equal('Alarm Consumed');
                            expect(https_stub).to.have.been.calledWith({
                                headers: {
                                    'Content-Length': 442,
                                    'Content-Type': 'application/json',
                                    'x-api-key': 'zOHtS8xIOE8In1uP7ghbP8jmUdVMvoMB4finmmPU'
                                },
                                method: 'POST'
                            }, JSON.stringify(converted));
                        })
                }).done(done);


        });

    });

});
