// test-request.js
const http = require('http');

const data = JSON.stringify({
  name: "API Test",
  email: "api@test.com",
  password: "api123"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/test-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let response = '';
  res.on('data', (chunk) => {
    response += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', response);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();