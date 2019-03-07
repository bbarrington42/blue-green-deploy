'use strict';

const _ = require('underscore');
const assert = require('assert');

/*
    Return a single object with the ELB names as keys. Each value is a list of the instance names registered with the ELB.
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
                // Note: iteratee cannot be passed using arrow notation as the context is not properly assigned if we do
                _.each(descriptions, function (description) {
                    this[description.LoadBalancerName] = _.map(description.Instances, instance => instance.InstanceId);
                }, obj);

                resolve(obj);
            }
        })
    })
};

/*
    Deregister instances. Second argument is the name of the ELB. Third argument is the return value from the
    'getInstanceNames' method above.

    It looks like this:
 {
  "cda-dispe-ElasticL-1XM2UQU1NXKT6": [
    "i-08113355825ba3bdf",
    "i-09ee543003688e3a1",
    "i-0ad86620ff9e08b2e",
    "i-09ad0b50e572ab5a7"
  ],
  "cda-dispe-ElasticL-1TPFRAVFTJUDW": [
    "i-08e4b0e8d57c904d9"
  ]
}
*/

//const deRegisterInstances = function (classic_elb, elb_name, instance_info)

/*
    Format registration params. Formats the params argument for deregistration and registration calls.
    Second argument is the return value from the 'getInstanceNames' method above.

    Params should look like this:

     var params = {
        "Instances": [
            {
                "InstanceId": "i-d6f6fae3"
            }
        ],
        "LoadBalancerName": "my-load-balancer"
    };

 */
const formatRegistrationParams = function (elb_name, instance_info) {
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
    getInstanceNames,
    formatRegistrationParams
};
