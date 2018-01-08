'use strict';

var child_process = require('child_process');
const parser = require("http-string-parser");
var path = require("path");
module.exports.handle = (event, context, callback) =>
{
    context.callbackWaitsForEmptyEventLoop = false;

    var requestMethod = event.httpMethod || 'GET';
    var requestBody = event.body || '';
    var serverName = event.headers ? event.headers.Host : 'lambda.dev';
    var requestUri = event.path || '';
    var headers = {};
    var queryParams = '';

    if (event.headers) {
        Object.keys(event.headers).map(function (key) {
            headers['HTTP_' + key.toUpperCase().replace(/-/g, '_')] = event.headers[key];
            headers[key.toUpperCase().replace(/-/g, '_')] = event.headers[key];
        });
    }

    if (event.queryStringParameters) {
        var parameters = Object.keys(event.queryStringParameters).map(function (key) {
            var obj = key + "=" + event.queryStringParameters[key];
            return obj;
        });
        queryParams = parameters.join("&");
    }

    var scriptPath = path.resolve(__dirname + '/public/index.php')

    var proc = child_process.spawn(('./php', ['-f', scriptPath, '-c', './php.ini'], {
        env: Object.assign({
            REDIRECT_STATUS: 200,
            REQUEST_METHOD: requestMethod,
            SCRIPT_FILENAME: scriptPath,
            SCRIPT_NAME: '/index.php',
            PATH_INFO: '/',
            SERVER_NAME: serverName,
            SERVER_PROTOCOL: 'HTTP/1.1',
            REQUEST_URI: requestUri,
            QUERY_STRING: queryParams,
            AWS_LAMBDA: true,
            CONTENT_LENGTH: Buffer.byteLength(requestBody, 'utf-8')
        }, headers, process.env),
        input: requestBody
    });
    console.log(proc.stderr.toString('utf-8'));

    var parsedResponse = parser.parseResponse(proc.stdout.toString('utf-8'));

    context.succeed({
        statusCode: parsedResponse.statusCode || 200,
        headers: parsedResponse.headers,
        body: parsedResponse.body
    });
};