const express = require('express'),
  request = require('request'),
  bodyParser = require('body-parser'),
  app = express();

const myLimit =
  typeof process.argv[2] != 'undefined' ? process.argv[2] : '100kb';
console.log('Using limit: ', myLimit);
app.use(bodyParser.json({ limit: myLimit }));

app.all('*', function (req, res, next) {
  // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    req.header('access-control-request-headers')
  );

  if (req.method === 'OPTIONS') {
    // CORS Preflight
    res.send();
  } else {
    const targetURL = req.header('Target-URL') || req.query.url; // Target-URL ie. https://example.com or http://example.com
    if (!targetURL) {
      res
        .status(500)
        .send({ error: 'There is no Target-Endpoint header in the request' });
      return;
    }
    request(
      {
        url: encodeURI(targetURL),
        method: req.method,
        json: req.body,
        headers: { Authorization: req.header('Authorization') },
      },
      function (error, response, body) {
        if (error) {
          console.error('error: ' + response.statusCode);
        }
        //                console.log(body);
      }
    ).pipe(res);
  }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {
  console.log('Proxy server listening on port ' + app.get('port'));
});
