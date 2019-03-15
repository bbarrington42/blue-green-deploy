'use strict';

require('dotenv').config();

const awsConfig = {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region
};

const ELB = require('aws-sdk/clients/elb');

const classic_elb = new ELB(awsConfig);

const _ = require('underscore');
const assert = require('assert');


// Return a list of all load balancers and their Instances. Each entry will be of the form:
// {LoadBalancerName: 'cda-consu-ElasticL-BK5LOE3X0J1A',
//  Instances: [...] }
const describeELBs = () =>
    classic_elb.describeLoadBalancers().promise().then(elbs => {
        const descs = _.map(elbs.LoadBalancerDescriptions, function (elb) {
            return {
                LoadBalancerName: elb.LoadBalancerName,
                Instances: elb.Instances
            }
        });
        return _.sortBy(descs, desc => desc.LoadBalancerName)
    });


const describeTags = (elb_names) =>
    classic_elb.describeTags({
        LoadBalancerNames: elb_names
    }).promise().then(desc =>
        _.sortBy(desc.TagDescriptions, desc => desc.LoadBalancerName));


/*
    Strategy: Call describeELBs, then create an array of ELB names for the params to the describeTags call. Then join
        the tags with the matching ELB.
 */
const elbsWithTags = () => {
    const elbs = describeELBs();
    const names = elbs.then(elbs => _.map(elbs, elb => elb.LoadBalancerName));
    const tags = names.then(describeTags).then(tags => _.pluck(tags, 'Tags'));

    return elbs.then(elbs =>
        tags.then(tags => _.zip(elbs, tags)).then(elems => _.map(elems, elem => {
            elem[0].Tags = elem[1];
            return elem[0];
        })))
};

// Returns ELB names, their instances, & tags for all production ELBs.
const prodELBs = () => {
    const elbs = elbsWithTags();
    return elbs.then(elbs => _.filter(elbs, elb =>
        _.findWhere(elb.Tags, {
            Key: 'Environment',
            Value: 'prod'
        })))
};

// Swaps property between two similar instances
const swapProperty = (left, right, propertyName) => {
  const tmp = right[propertyName];
  right[propertyName] = left[propertyName];
  left[propertyName] = tmp;
};

const swapInstances = () => {
    // Group by app type, then swap the instances.
    const grouped = prodELBs().then(elbs => _.groupBy(elbs, elb =>
        _.find(elb.Tags, tag => tag.Key === 'AppType').Value
    ));

    grouped.then(group => swapProperty(group.consumer[0], group.consumer[1], 'Instances'));
    grouped.then(group => swapProperty(group.dispenser[0], group.dispenser[1], 'Instances'));

    // Extract the parameters to the setInstances call
    const consumers = grouped.then(group => _.map(group.consumer, el => _.omit(el, 'Tags')));
    const dispensers = grouped.then(group => _.map(group.dispenser, el => _.omit(el, 'Tags')));

    const params = consumers.then(consumers => dispensers.then(dispensers => consumers.concat(dispensers)));

    params.then(params => params.forEach(setInstances));
};


/*
    Deregister & register instances. Params is obtained using makeParams below.
*/

const deRegisterInstances = (classic_elb, params) =>
    classic_elb.deregisterInstancesFromLoadBalancer(params).promise();

const registerInstances = (classic_elb, params) =>
    classic_elb.registerInstancesWithLoadBalancer(params).promise();


/* Return a Promise containing an array of the instance ids currently registered with this ELB.

This is an example of the return value from 'describeInstanceHealth'
   data = {
    InstanceStates: [
       {
      Description: "N/A",
      InstanceId: "i-207d9717",
      ReasonCode: "N/A",
      State: "InService"
     },
       {
      Description: "N/A",
      InstanceId: "i-afefb49b",
      ReasonCode: "N/A",
      State: "InService"
     }
    ]
   }
   */
const getInstances = (classic_elb, elb_name) =>
    classic_elb.describeInstanceHealth({LoadBalancerName: elb_name}).promise().then(data =>
        _.map(data.InstanceStates, state => state.InstanceId));

// Set the registered instances of a classic ELB.
/* The parameter to this method is an object argument like below:
{
    "LoadBalancerName": "cda-consu-ElasticL-1JCJFBRJ4YIVL",
    "Instances": [
      {
        "InstanceId": "i-0de8bbc7c8ddf2e10"
      }
    ]
  }
*/
// todo Wrong name to prevent accidental invocation!
const setInstances2 = (elbAndInstances) => {
    const elb_name = elbAndInstances.LoadBalancerName;
    const instances = _.pluck(elbAndInstances.Instances, 'InstanceId');

    const current = getInstances(classic_elb, elb_name);
    return current.then(curr => {
        console.log(`current: ${curr}`);
        console.log(`passed: ${instances}`);
        // If current instances are equal to our target then nothing to do.
        if (_.isEqual(_.sortBy(curr, v => v), _.sortBy(instances, v => v))) return Promise.resolve(); else
        // If not empty, then deregister current instances
        if (_.isEmpty(curr)) return Promise.resolve(); else
            return deRegisterInstances(classic_elb, makeParams(elb_name, curr));
    }).then(() => registerInstances(classic_elb, makeParams(elb_name, instances)));
};


const makeParams = (elb_name, instances) => {
    return {
        LoadBalancerName: elb_name,
        Instances: _.map(instances, id => {
            return {
                InstanceId: id
            }
        })
    }
};


module.exports = {
    prodELBs,
    swapInstances
};
