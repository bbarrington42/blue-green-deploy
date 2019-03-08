'use strict';

const _ = require('underscore');
const assert = require('assert');

/*
    Return a single object with the ELB names as keys. Each value is a list of the instance names registered with the ELB.
 */

const getInstanceInfo = function (classic_elb, elb_names) {
    return classic_elb.describeLoadBalancers({
        LoadBalancerNames: elb_names
    }).promise().then(data => {
        const descriptions = data.LoadBalancerDescriptions;
        // Extract the instance names keyed by the name of the ELB
        let obj = {};
        // Note: iteratee cannot be passed using arrow notation as the context is not properly assigned if we do
        _.each(descriptions, function (description) {
            this[description.LoadBalancerName] = _.map(description.Instances, instance => instance.InstanceId);
        }, obj);
        return obj;
    })
};

/*
    Deregister & register instances.
    // todo These need to be rewritten to have the instance info passed into them  ;-)
*/

const deRegisterInstances = function (classic_elb, elb_name) {
    return getInstanceInfo(classic_elb, [elb_name]).
    then(info => getRegistrationParams(elb_name, info)).
    then(params => classic_elb.deregisterInstancesFromLoadBalancer(params).promise());
};

const registerInstances = function (classic_elb, elb_name) {
    return getInstanceInfo(classic_elb, [elb_name]).
    then(info => getRegistrationParams(elb_name, info)).
    then(params => classic_elb.registerInstancesWithLoadBalancer(params).promise());
};


/*
    Format registration params. Formats the params argument for deregistration and registration calls.
    Second argument is the return value from the 'getInstanceInfo' method above.

    Params (return value) should look like this:

     var params = {
        "Instances": [
            {
                "InstanceId": "i-d6f6fae3"
            }
        ],
        "LoadBalancerName": "my-load-balancer"
    };

 */
const getRegistrationParams = function (elb_name, instance_info) {
    let obj = {};
    // Use context object so that iteratee is bound to it. Note that arrow notation will NOT work when using a context.
    const instances = _.map(instance_info[elb_name], function (id) {
        this.InstanceId = id;
        return this;
    }, obj);

    return {
        LoadBalancerName: elb_name,
        Instances: instances
    }
};

module.exports = {
    getInstanceInfo,
    getRegistrationParams,
    deRegisterInstances,
    registerInstances
};
