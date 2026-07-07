const axios = require('axios');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const eecApi = 'https://www.eectrade.com/api';
  
  console.log('1. Fetching available domains from Mail.tm...');
  const domainRes = await axios.get('https://api.mail.tm/domains');
  const domain = domainRes.data['hydra:member'][0].domain;
  
  const randomStr = Math.floor(Math.random() * 1000000);
  const email = `eecqa${randomStr}@${domain}`;
  const password = 'PasswordTest123!';
  
  console.log(`2. Creating Mail.tm account: ${email}...`);
  await axios.post('https://api.mail.tm/accounts', { address: email, password });
  
  console.log('3. Authenticating with Mail.tm to get token...');
  const tokenRes = await axios.post('https://api.mail.tm/token', { address: email, password });
  const mailToken = tokenRes.data.token;
  
  const mailClient = axios.create({
    baseURL: 'https://api.mail.tm',
    headers: { Authorization: `Bearer ${mailToken}` }
  });

  console.log(`4. Registering test user on EECTrade: ${email}...`);
  try {
    const regRes = await axios.post(`${eecApi}/auth/register`, {
      email,
      password: 'PasswordTest123!',
      name: 'QA Email Tester',
      role: 'buyer'
    });
    console.log('   Registration succeeded! User ID:', regRes.data.user_id);
  } catch (err) {
    console.error('   Registration failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }

  console.log('5. Triggering password reset request on EECTrade...');
  try {
    const resetRes = await axios.post(`${eecApi}/auth/password/reset-request`, { email });
    console.log('   Reset request status:', resetRes.status, resetRes.data);
  } catch (err) {
    console.error('   Reset request failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }

  console.log('6. Polling Mail.tm inbox (waiting up to 60 seconds)...');
  let emailReceived = false;
  for (let i = 0; i < 12; i++) {
    await delay(5000);
    console.log(`   Polling iteration ${i + 1}/12...`);
    const messagesRes = await mailClient.get('/messages');
    const messages = messagesRes.data['hydra:member'];
    
    if (messages.length > 0) {
      emailReceived = true;
      const msg = messages[0];
      console.log('\n🎉 EMAIL RECEIVED!');
      console.log('-----------------------------------------');
      console.log('From:', msg.from.address);
      console.log('To:', msg.to[0].address);
      console.log('Subject:', msg.subject);
      console.log('Intro:', msg.intro);
      
      // Fetch full message details to check body
      const detailRes = await mailClient.get(`/messages/${msg.id}`);
      console.log('\nText Content:\n', detailRes.data.text);
      console.log('-----------------------------------------');
      break;
    }
  }

  if (!emailReceived) {
    console.log('\n❌ TIMEOUT: No email received. Staging/production SMTP server failed to deliver the message.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});
