const https = require('https');

const urls = [
  'https://pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev/models/cmmsdn7ch000yvh4kgc9vna7u/0-1773616792165.webp',
  'https://pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev/models/cmmsdn7ch000yvh4kgc9vna7u/1-1773616792973.webp',
  'https://pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev/models/cmmsdn7ch000yvh4kgc9vna7u/2-1773616793541.webp',
  'https://pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev/models/cmmsdn7ch000yvh4kgc9vna7u/3-1773616794350.webp',
];

urls.forEach((url, i) => {
  https.get(url, (res) => {
    console.log('Photo ' + i + ': status=' + res.statusCode + ' content-length=' + res.headers['content-length']);
    res.destroy();
  }).on('error', (e) => {
    console.log('Photo ' + i + ': ERROR ' + e.message);
  });
});
