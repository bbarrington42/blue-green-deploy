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


// const rv = instance_info.then(info => utils.getRegistrationParams(prod_green, info));
//
// rv.then(console.log);

// Try to register in dev env
// const reg = instance_info.then(info => utils.getRegistrationParams(dev, info)).then(params => utils.registerInstances(classic_elb, params));
//
// reg.then(console.log).catch(console.error);

const dispenser = 'i-08b6c9c1e1a662382';
const consumer = 'i-0c5fdd7fe746e13ae';

utils.setInstances(classic_elb, dev, [dispenser]).then(console.log);

