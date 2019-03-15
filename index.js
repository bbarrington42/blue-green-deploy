'use strict';

const utils = require('./lib/utils');

// utils.prodColor().then(console.log);
//utils.prodELBs().then(tags => console.log(JSON.stringify(tags))).catch(console.error);


utils.swapInstances().then(v => console.log(JSON.stringify(v))).catch(console.error);
