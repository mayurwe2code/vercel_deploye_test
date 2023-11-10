// const Imap = require('imap');
import Imap from 'imap'

export function imapConnect(){
    const imap = new Imap({
  user: 'your_email@example.com',
  password: 'your_password',
  host: 'imap.example.com',
  port: 993, // IMAPS port
  tls: true,
});

imap.connect();

imap.once('ready', () => {
  console.log('Connected to IMAP server');

  // यहां आप IMAP सर्वर के साथ बातचीत कर सकते हैं
});

imap.once('error', (err) => {
  console.error('IMAP connection error:', err);
});

imap.once('end', () => {
  console.log('IMAP connection ended');
});}
