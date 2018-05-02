'use strict';

const
    _      = require('lodash'),
    path   = require('path'),
    q      = require('q');


function promiseOf (stuff) {
    return function() {
        return q.resolve(stuff);
    };
}

function rejectsPromiseWith (error) {
    return function() {
        return q.reject(error);
    };
}


module.exports = {
    promiseOf:           promiseOf,
    rejectsPromiseWith:  rejectsPromiseWith,
    noop:                function() {}
};