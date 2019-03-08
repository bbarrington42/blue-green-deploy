'use strict';

const utils = require('./lib/utils');

const ELB = require('aws-sdk/clients/elb');

const classic_elb = new ELB({
    accessKeyId: 'AKIAISEOJNARFLW376JQ',
    secretAccessKey: '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',
    region: 'us-east-1'
});

const dev = 'cda-dispe-ElasticL-1N0VM8V2BCD3V';
const prod_blue = 'cda-dispe-ElasticL-1TPFRAVFTJUDW';
const prod_green = 'cda-dispe-ElasticL-1XM2UQU1NXKT6';


const prod_info = utils.getInstanceInfo(classic_elb, [
    prod_blue,
    prod_green
]);

const dev_info = utils.getInstanceInfo(classic_elb, [
    dev
]);

const rv = prod_info.then(info => utils.getRegistrationParams(prod_green, info));

rv.then(console.log);

// Try to register in dev env
const reg = utils.registerInstances(classic_elb, dev);

reg.then(console.log).catch(console.error);
