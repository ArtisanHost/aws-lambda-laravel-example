'use strict';

var child_process = require('child_process');

exports.handler = function(event, context) {
    var proc = child_process.spawn('./php-cgi', ['-v']);

    var output = '';
    proc.stdout.on('data', function(data) {
        output += data.toString('utf-8');
    });

    proc.on('close', function() {
        context.succeed(output);
    });
};