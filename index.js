'use strict';

const utils = require('./lib/utils');
const _ = require('underscore');

utils.prodELBs().then(tags => console.log(JSON.stringify(tags))).catch(console.error);

const arr1 = [1,2];
const arr2 = [2,1];

console.log(_.isEqual(_.sortBy(arr1, v => v), _.sortBy(arr2, v => v)));
