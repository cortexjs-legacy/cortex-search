#!/usr/bin/env node

var search = require('../');
var optimist = require('optimist');

var argv = optimist.alias('s', 'sort')
    .describe('sorted by field')
    .boolean('searchRev')
    .alias('r', 'searchRev')
    .describe('reverse the order')
    .argv;


search(argv._, argv, function(err, out) {
    if (err)
        return console.error(err);

    console.log(out);
});