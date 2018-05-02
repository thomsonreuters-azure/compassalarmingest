'use strict';

const
    root = '../../',
    pkg = require(root + 'package.json');

exports.list = function(req, res){
    res.status(200).json({
        name:    pkg.name,
        version: pkg.version,
        about:   pkg.description
    });
};