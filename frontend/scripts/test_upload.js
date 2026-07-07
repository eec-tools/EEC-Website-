const axios = require('axios');
const FormData = require('form-data');

async function main() {
  const eecApi = 'https://www.eectrade.com/api';
  const email = 'eecqa88518@mailto.plus'; // Newly registered user from the previous step
  const password = 'PasswordTest123!';

  console.log('1. Logging in to obtain session cookies...');
  let loginRes;
  try {
    loginRes = await axios.post(`${eecApi}/auth/login`, { email, password });
    console.log('   Login successful!');
  } catch (err) {
    console.error('   Login failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }

  // Parse cookies from headers
  const setCookieHeaders = loginRes.headers['set-cookie'] || [];
  const cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
  console.log('   Cookies obtained:', cookies ? 'YES (access_token present)' : 'NONE');

  console.log('\n2. Preparing test file payload...');
  const form = new FormData();
  // Create a tiny dummy text buffer
  const fileBuffer = Buffer.from('EEC QA Integration Test Upload Content');
  form.append('file', fileBuffer, {
    filename: 'eec_qa_test.txt',
    contentType: 'text/plain'
  });

  const uploadClient = axios.create({
    baseURL: eecApi,
    headers: {
      ...form.getHeaders(),
      Cookie: cookies
    }
  });

  console.log('3. Sending file to /upload endpoint...');
  try {
    const uploadRes = await uploadClient.post('/upload?doc_type=certificate', form);
    console.log('   Upload Response:', uploadRes.status);
    console.log('   File Object Details:');
    console.log(JSON.stringify(uploadRes.data, null, 2));
    
    const fileId = uploadRes.data.file_id;
    const provider = uploadRes.data.storage_provider;
    console.log(`\n🎉 UPLOAD SUCCESSFUL! Provider: ${provider}`);

    // If local, check if it's download-friendly (it shouldn't be, on serverless)
    console.log('\n4. Attempting to retrieve uploaded file...');
    try {
      const getFileRes = await axios.get(`${eecApi}/files/${fileId}`, {
        headers: { Cookie: cookies }
      });
      console.log('   Retrieved URL successfully:', getFileRes.data.url ? 'YES' : 'NO');
      console.log('   File URL:', getFileRes.data.url);
    } catch (e) {
      console.error('   Failed to retrieve file url:', e.response ? e.response.data : e.message);
    }

  } catch (err) {
    console.error('❌ Upload Failed:', err.response ? err.response.status : err.message);
    if (err.response) {
      console.error('   Details:', JSON.stringify(err.response.data));
    }
  }
}

main().catch(err => {
  console.error('Crashed:', err);
  process.exit(1);
});
