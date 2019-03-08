'use strict';

const _ = require('underscore');
const assert = require('assert');

/*
    Return a single object with the ELB names as keys. Each value is a list of the instance names registered with the ELB.
 */

const getInstanceInfo = (classic_elb, elb_names) => {
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
    Deregister & register instances. Params is obtained using getRegistrationParams below.
*/

// todo These may need to confirm results!!
const deRegisterInstances = (classic_elb, params) =>
    classic_elb.deregisterInstancesFromLoadBalancer(params).promise();

const registerInstances = (classic_elb, params) =>
    classic_elb.registerInstancesWithLoadBalancer(params).promise();


// todo This has a bug in it. Sometimes the instance is not registered.
const swapInstances = (classic_elb, instance_info, elb_name1, elb_name2) => {
    // First get the params for the calls.
    const params1 = getRegistrationParams(elb_name1, instance_info);
    const params2 = getRegistrationParams(elb_name2, instance_info);

    const dereg1 = deRegisterInstances(classic_elb, params1);
    const dereg2 = deRegisterInstances(classic_elb, params2);

    const reg1 = registerInstances(classic_elb, params1);
    const reg2 = registerInstances(classic_elb, params2);

    // Make sure deregistration happens before registration
    return Promise.all([dereg1, dereg2]).then(() =>
        Promise.all([reg1, reg2])).then(() => 'success');
};

/*
    Return registration params in the format required for deregistration and registration calls.
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
const getRegistrationParams = (elb_name, instance_info) => {
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
    registerInstances,
    swapInstances
};
