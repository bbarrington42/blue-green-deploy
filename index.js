'use strict';

const utils = require('./lib/utils');

utils.prodColor().then(console.log);
utils.prodELBs().then(tags => console.log(JSON.stringify(tags))).catch(console.error);
