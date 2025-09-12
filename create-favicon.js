const fs = require('fs');

// Create a simple 32x32 PNG favicon with base64 encoding
// This is a purple gradient square with white "P" letter
const faviconBase64 = `iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKFSURBVFiFtZe/axRBFMc/s3t3l0uiRhQVFRRBLCxEsBAsLGwsLPwHLGwsLCwsLCwsLCwsLCwsLCwsLCz8A0QQLETwR6GFhYiKRjGa5O5u9/ZtMTM3s7d7l0vygmFm3nvz/b7vzZs3b0VVqYJzjh07dqwDNgPrgDVAC2gDs8AM8A74BLxT1XepnyilvCAiG4EjwBFgL7CiYuh34BFwG7irqt+8z6USEBEBDgJngYPAgqePwCPgBfAWeA/MAl+BFrAKWAtsAnYDe4AdAOoJPQNuAjdUtVMkMCIQ9PwScB5Y2mfgZ+A6cE1VX1Tw3wacBE4Bq/vUvwGngWuppJMEROQ4cBlYmuFfgCvARVWdKesxkWyfiGwDLgPHMu0fgBOqep8UAkPATWBfQnkLOKWqb0ZZqdEIHBGB+8CBROEhcDRW6QkAmMAlYHdEdYCjqno3iykMXAbWRwrvgF2qOjOKZY6OcOAUsC2imAUOxeRDAiKyH9gcKayqpxN748YRiZwH9kQUt4CLYSdMCJxLjOyRH/ml9tZvA9tJLNE24HQokZ6AiEwBWyKK98Cj8c5tdBwDlgUCE6q6UUSaPt4JoDYCLzbr6M6vgfdUfJRCcOALpwl3wQ0xBfA4lhsV4AHQCaL3AM0lQM8qOMBVcPBKJv0ecBHjSQpVfQtcj3K6AWz3TdQb6OcxvWKhAZGOdBXmT+AmMLsAAkHuCWB7ILAyeOnnY3ktpdJQM9Dx5CWEqnaBz8EBaLQ/p/ZGi0h0yVY1fBq3YioUKvvVCsekKgJKQQIxVFU/Al8CgTVNfwMMNMT0BphKTXNE8BqY9uRXBgKfMnYTgcAU8GIcfgXsKXABCG/L8z1HgP8r/gEcT4rbxXtMdgAAAABJRU5ErkJggg==`;

// Convert base64 to buffer and save as PNG
const buffer = Buffer.from(faviconBase64, 'base64');
fs.writeFileSync('favicon-32x32.png', buffer);

console.log('✅ Favicon created: favicon-32x32.png');

// Also create a 16x16 version
const favicon16Base64 = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA3QAAAN0BcFOiBwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEpSURBVDiNjZM9TsNAEIW/WTtOHCcQQUGBaCgoKCgoOAIFR6DgCJyAI1BQUFBQICFEgSIhfuLYazPbYG/WdhJgpNVq5r15b3ZnV0QkxDmHMeYgsA1sAivAErAATANfwDvwDLwAD8aYGxHphzlKKAtUgTPgEFgcYfcFXAPnxpirJI8SABcA5UCiAqwBe8Ae0AbugFvg0Vr7Zt8BJ8BxINEGDowxF1ACoihaBE6BxcD5FTgzxtwPBFx2gLVA4hM4ttbehQT2gUog0QWOxDAAlD3AhIDlLJvEKDHLGbdEJEoBJTPCPgJvAJNSgNxk3hAgNxqkjn+AxhhyIpL/AXoDfh8m4APoBBJ1wKYU0AJarhtrrT0H7gOJe+fcVpJH+fN8AM5kRDeBQ+ALWJ7A5g/M5FeN5K0aXgAAAABJRU5ErkJggg==`;

const buffer16 = Buffer.from(favicon16Base64, 'base64');
fs.writeFileSync('favicon-16x16.png', buffer16);

console.log('✅ Favicon created: favicon-16x16.png');

// Create favicon.ico reference file
const icoHTML = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`;

console.log('\n📝 Add these lines to your HTML <head> section:');
console.log(icoHTML);