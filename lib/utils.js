'use strict';

const _ = require('underscore');
const assert = require('assert');

// Takes an array of classic ELB names and finds the registered instances for each.
// Return value is an object where each key is the ELB name and the values are arrays of instance names.
const inventory = (classic_elb, elb_names) => {
    const data = classic_elb.describeLoadBalancers({LoadBalancerNames: elb_names}).promise();
    return data.then(d => {
        let obj = {};
        _.map(d.LoadBalancerDescriptions, function(desc) {
            this[desc.LoadBalancerName] = _.map(desc.Instances, instance => instance.InstanceId);
        }, obj);
        return obj;
    })
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


const setInstances = (classic_elb, elb_name, instances) => {
    const current = getInstances(classic_elb, elb_name);
    return current.then(curr => {
        console.log(`current: ${curr}`);
        console.log(`passed: ${instances}`);
        // If current instances are equal to our target then nothing to do.
        if (_.isEqual(curr, instances)) return Promise.resolve(); else {
            // If not empty, then deregister current instances
            if (_.isEmpty(curr)) return Promise.resolve(); else return deRegisterInstances(classic_elb, makeParams(elb_name, curr));
        }}).then(() => registerInstances(classic_elb, makeParams(elb_name, instances)));
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
    setInstances,
    inventory
};
