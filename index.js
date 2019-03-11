'use strict';

require('dotenv').config();
const utils = require('./lib/utils');

const ELB = require('aws-sdk/clients/elb');

const classic_elb = new ELB({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region
});

const dispenser_dev = 'cda-dispe-ElasticL-1N0VM8V2BCD3V';
const dispenser_prod_blue = 'cda-dispe-ElasticL-1TPFRAVFTJUDW';
const dispenser_prod_green = 'cda-dispe-ElasticL-1XM2UQU1NXKT6';


// const rv = instance_info.then(info => utils.getRegistrationParams(prod_green, info));
//
// rv.then(console.log);

// Try to register in dev env
// const reg = instance_info.then(info => utils.getRegistrationParams(dev, info)).then(params => utils.registerInstances(classic_elb, params));
//
// reg.then(console.log).catch(console.error);

const dispenser = 'i-08b6c9c1e1a662382';
const consumer = 'i-0c5fdd7fe746e13ae';

utils.setInstances(classic_elb, dispenser_dev, [dispenser]).then(console.log);

//utils.inventory(classic_elb, [dispenser_prod_blue, dispenser_prod_green]).then(console.log).catch(console.error);

