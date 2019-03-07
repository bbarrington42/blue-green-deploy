'use strict';

const _ = require('underscore');
const assert = require('assert');

/*
    Return the instance names registered with these classic load balancers.

    {
  Instances: [
     {
    InstanceId: "i-d6f6fae3"
   }
  ],
  LoadBalancerName: "my-load-balancer"
 }

 */

const getInstanceNames = function (classic_elb, elb_names) {
    return new Promise((resolve, reject) => {
        const description = classic_elb.describeLoadBalancers({
            LoadBalancerNames: elb_names
        }, (err, data) => {
            if (err) reject(err);
            else {
                const descriptions = data.LoadBalancerDescriptions;
                // Extract the instance names keyed by the name of the ELB
                let obj = {};
                // iteratee CANNOT be declared using arrow syntax as our context would not be bound if we did
                _.each(descriptions, function(description) {
                    this[description.LoadBalancerName] = _.map(description.Instances, instance => instance.InstanceId);
                }, obj);

                resolve(obj);
            }
        })
    })
};

/*
    Derigister instances.
 */

module.exports = {
    getInstanceNames
};


