'use strict';

const _ = require('underscore');
const assert = require('assert');

/*
    Return the instance names registered with these classic load balancers.
 */

exports.getInstanceNames = function (classic_elb, elb_names) {
    return new Promise((resolve, reject) => {
        const description = classic_elb.describeLoadBalancers({
            LoadBalancerNames: elb_names
        }, (err, data) => {
            if (err) reject(err);
            else {
                const descriptions = data.LoadBalancerDescriptions;
                // Extract the instance names keyed by the name of the ELB
                const arr = _.map(descriptions, description => {
                    let obj = {};
                    obj[description.LoadBalancerName] = _.map(description.Instances, instance => instance.InstanceId);
                    return obj;
                });

                resolve(arr);
            }
        })
    })
};


