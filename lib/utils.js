'use strict';

const _ = require('underscore');
const assert = require('assert');

/*
    Return the instance names registered with this classic load balancer.
 */

// todo Use one method to get instances of one or more ELBs
exports.getInstanceNames = function (elb, elb_name) {
    return new Promise((resolve, reject) => {
        const description = elb.describeLoadBalancers({
            LoadBalancerNames: [
                elb_name
            ]
        }, (err, data) => {
            if (err) reject(err);
            else {
                const descriptions = data.LoadBalancerDescriptions;
                assert(descriptions.length == 1, `Received array of length ${descriptions.length}, expecting 1`);
                // Extract the instance names
                //console.log(descriptions);
                const names = _.map(descriptions, description => _.map(description.Instances, instance => instance.InstanceId));
                resolve(_.flatten(names));
            }
        })
    })
};


