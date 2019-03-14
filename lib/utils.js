'use strict';

require('dotenv').config();

const awsConfig = {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region
};

const ELB = require('aws-sdk/clients/elb');
const Route53 = require('aws-sdk/clients/route53');

const classic_elb = new ELB(awsConfig);
const route53 = new Route53(awsConfig);

const _ = require('underscore');
const assert = require('assert');
const dns = require('dns').promises;

// Takes an array of classic ELB names and finds the registered instances for each.
// Return value is an object where each key is the ELB name and the values are arrays of instance names.
const inventory = (classic_elb, elb_names) => {
    return classic_elb.describeLoadBalancers({LoadBalancerNames: elb_names}).promise().then(data => {
        let obj = {};
        _.map(data.LoadBalancerDescriptions, function (desc) {
            this[desc.LoadBalancerName] = _.map(desc.Instances, instance => instance.InstanceId);
        }, obj);
        return obj;
    })
};

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
        tags.then(tags => _.zip(elbs, tags)))
};


const listRecords = () =>
    route53.listResourceRecordSets({
        HostedZoneId: 'Z1Y9W2RAQMHX1K',
        StartRecordName: '*freestylecda.com',
        StartRecordType: 'A'
    }).promise().then(recordSets =>
        _.filter(recordSets.ResourceRecordSets, record => record.Name.match(/(consumer|dispenser)-(blue|green).+/)));


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

// Set the registered instances of a classic ELB. 'instances' is an array of instance names.
const setInstances = (classic_elb, elb_name, instances) => {
    const current = getInstances(classic_elb, elb_name);
    return current.then(curr => {
        console.log(`current: ${curr}`);
        console.log(`passed: ${instances}`);
        // If current instances are equal to our target then nothing to do.
        if (_.isEqual(curr, instances)) return Promise.resolve(); else
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
    setInstances: _.partial(setInstances, classic_elb),
    inventory: _.partial(inventory, classic_elb),
    describeTags,
    describeELBs,
    elbsWithTags
};
