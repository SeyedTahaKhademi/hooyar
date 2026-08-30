#!/usr/bin/env node

const https = require('https');

const owner = 'SeyedTahaKhademi';
const repo = 'hooyar';
const tagName = 'v1.0.2';
const commitSha = '6fdafaf8d0d734bb591b21a9ee08e9a6447d6520'; // Latest commit with version bump

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('❌ GITHUB_TOKEN environment variable is not set');
  process.exit(1);
}

const data = JSON.stringify({
  ref: `refs/tags/${tagName}`,
  sha: commitSha
});

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: `/repos/${owner}/${repo}/git/refs`,
  method: 'POST',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Node.js',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response:', responseData);

    if (res.statusCode === 201) {
      console.log(`✅ Tag ${tagName} created successfully!`);
      console.log(`🚀 Release workflow should start building now...`);
    } else if (res.statusCode === 422) {
      console.log(`⚠️  Tag ${tagName} already exists. Starting build anyway...`);
    } else {
      console.error(`❌ Error creating tag. Status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

req.write(data);
req.end();
