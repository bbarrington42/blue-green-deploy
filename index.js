'use strict';

const utils = require('./lib/utils');

const ELB = require('aws-sdk/clients/elb');

const classic_elb = new ELB({
    accessKeyId: 'AKIAISEOJNARFLW376JQ',
    secretAccessKey: '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',
    region: 'us-east-1'
});


// cda-dispe-ElasticL-1N0VM8V2BCD3V - development
// cda-dispe-ElasticL-1XM2UQU1NXKT6 - production
// cda-dispe-ElasticL-1TPFRAVFTJUDW - production

const instance_names = utils.getInstanceNames(classic_elb, [
    'cda-dispe-ElasticL-1XM2UQU1NXKT6',
    'cda-dispe-ElasticL-1TPFRAVFTJUDW'
]);

const rv = instance_names.then(names => utils.formatRegistrationParams('cda-dispe-ElasticL-1XM2UQU1NXKT6', names));

rv.then(console.log);
