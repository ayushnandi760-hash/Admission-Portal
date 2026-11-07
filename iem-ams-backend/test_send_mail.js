require('dotenv').config();
const { sendAdmissionStatusEmail } = require('./src/utils/email.utils');

async function test() {
  console.log('Testing email dispatch to ayushnandi790@gmail.com...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS, 'length:', (process.env.SMTP_PASS || '').length);

  const res = await sendAdmissionStatusEmail({
    to: 'ayushnandi790@gmail.com',
    studentName: 'Ayush Nandi',
    program: 'B.Tech (Computer Science & Engineering)',
    status: 'accepted',
    remarks: 'Verified Class 12 marksheet. Score meets cutoff. Recommended for B.Tech CSE.',
  });

  console.log('Result:', res);
}

test().catch(console.error);
