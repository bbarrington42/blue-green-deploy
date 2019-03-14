'use strict';

const utils = require('./lib/utils');

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

//utils.setInstances(classic_elb, dispenser_dev, [dispenser]).then(console.log);

//utils.inventory([dispenser_prod_blue, dispenser_prod_green]).then(console.log).catch(console.error);

//utils.prodColor().then(console.log).catch(console.error);

// utils.listRecords().then(console.log);
utils.loadBalancers().then(console.log);
// const dns = require('dns');
// const assert = require('assert');
// const _ = require('underscore');

// dns.resolve4('cda-dispe-ElasticL-1XM2UQU1NXKT6-1906510522.us-east-1.elb.amazonaws.com').then(console.log);
// dns.resolve4('dualstack.cda-dispe-elasticl-1xm2uqu1nxkt6-1906510522.us-east-1.elb.amazonaws.com').then(console.log);
//
// const a1 = [1,2];
// const a2 = [2,1];
//
// assert(_.isEqual(_.sortBy(a1, v => v), _.sortBy(a2, v => v)));
