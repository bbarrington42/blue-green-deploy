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

// Return a list of all load balancers and their DNSNames. Each entry will be of the form:
// {LoadBalancerName: 'cda-consu-ElasticL-BK5LOE3X0J1A',
//  DNSName: 'cda-consu-ElasticL-BK5LOE3X0J1A-876461607.us-east-1.elb.amazonaws.com' }
const elbDnsNames = () =>
    classic_elb.describeLoadBalancers().promise().then(elbs => {
        return _.map(elbs.LoadBalancerDescriptions, function (elb) {
            return {
                LoadBalancerName: elb.LoadBalancerName,
                DNSName: elb.DNSName
            }
        });
    });

// Resolve the DNSNames in the above to their IP addresses.
const loadBalancers = () =>
    elbDnsNames().then(elbs => {
        return Promise.all(_.map(elbs, elb => {
            return dns.resolve4(elb.DNSName).then(addresses => {
                return {
                    LoadBalancerName: elb.LoadBalancerName,
                    Addresses: addresses
                };
            });
        }));
    });


const prodColor = () =>
    // Use dispenser record in private zone to determine what color prod & stage are
    route53.listResourceRecordSets({
        HostedZoneId: 'Z1Y9W2RAQMHX1K'
    }).promise().then(recordSets => _.findWhere(recordSets.ResourceRecordSets,
        {Name: 'dispenser.freestylecda.com.', Type: 'A'}).AliasTarget.DNSName.match(/blue|green/)[0]);

/*
    Strategy: Get the DNSNames for green/blue consumer and dispenser ELBs. Then query the ELBs and match the names.
    This will give us the internal ELB names that can be used to set instances.
 */


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
    prodColor,
    listRecords,
    loadBalancers
};
