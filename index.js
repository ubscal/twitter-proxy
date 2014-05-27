var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};

var twitter = function(path, method, post, headers, callback) {
  var options = {
    host: 'api.twitter.com',
    path:  path,
    method: method
  };

  if(typeof headers === 'object') {
    options['headers'] = headers;
  }

  var req = https.request(options, function(resp) {
    var str = '';

    resp.on('data', function(chunk) {
      str += chunk;
    });

    resp.on('end', function() {
      callback(str);
    });
  });

  if(method === 'POST') {
    req.write(serialize(post));
  }

  req.end();
};

var app = express();

app.use(bodyParser());

app.set('port', (process.env.PORT || 5000));

app.get('/crossdomain.xml', function(request, response) {
  var xml = '<?xml version="1.0" ?><cross-domain-policy><allow-access-from domain="*" /></cross-domain-policy>';

  response.send(xml);
});

app.all('/*', function(request, response) {
  var method = request.method;
  var path = request.originalUrl;
  var headers = {
    'content-type': request.headers['content-type'],
    'content-length': request.headers['content-length'],
    'Authorization': (request.headers['Authorization'] ? request.headers['Authorization'] : false)
  };

  var body = (method === 'post' ? request.body : '');

  var callback = function(resp) {
    response.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
    response.setHeader('Access-Control-Request-Headers', 'origin, authorization, access-control-allow-origin, accept, access-control-allow-headers');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.send(resp);
  };

  twitter(path, method, body, headers, callback);
});

app.listen(app.get('port'), function() {
  console.log("Twitter Proxy API is running at on port " + app.get('port'));
});