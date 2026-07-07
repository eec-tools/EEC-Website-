const axios = require('axios');

const API = 'https://www.eectrade.com/api';

async function testAuthMeLoggedOut() {
  console.log('Testing GET /auth/me logged out...');
  try {
    const res = await axios.get(`${API}/auth/me`);
    console.log('FAIL: Expected 401 but got:', res.status, res.data);
    return { status: 'FAIL', evidence: `Got status ${res.status}` };
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('PASS: Got 401 as expected:', err.response.data);
      return { status: 'PASS', evidence: JSON.stringify(err.response.data) };
    }
    console.log('FAIL: Got error:', err.message);
    return { status: 'FAIL', evidence: err.message };
  }
}

async function testInvalidLogin() {
  console.log('Testing POST /auth/login with wrong password...');
  try {
    await axios.post(`${API}/auth/login`, {
      email: 'eecqa88518@mailto.plus',
      password: 'WrongPassword!!!'
    });
    console.log('FAIL: Login succeeded with wrong password');
    return { status: 'FAIL', evidence: 'Login succeeded' };
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('PASS: Got 401 as expected:', err.response.data);
      return { status: 'PASS', evidence: JSON.stringify(err.response.data) };
    }
    console.log('FAIL: Got error:', err.message);
    return { status: 'FAIL', evidence: err.message };
  }
}

async function testDuplicateSignup() {
  console.log('Testing POST /auth/register with duplicate email...');
  try {
    await axios.post(`${API}/auth/register`, {
      email: 'eecqa88518@mailto.plus',
      password: 'PasswordTest123!',
      name: 'Duplicate QA',
      role: 'buyer'
    });
    console.log('FAIL: Duplicate registration succeeded');
    return { status: 'FAIL', evidence: 'Registration succeeded' };
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('PASS: Got 400 as expected:', err.response.data);
      return { status: 'PASS', evidence: JSON.stringify(err.response.data) };
    }
    console.log('FAIL: Got error:', err.message);
    return { status: 'FAIL', evidence: err.message };
  }
}

async function testValidationBuyerIntake() {
  console.log('Testing POST /buyer/intake validation failures...');
  try {
    // Missing required fields
    await axios.post(`${API}/buyer/intake`, {
      company_name: 'QA Corp'
    });
    console.log('FAIL: Intake succeeded with missing fields');
    return { status: 'FAIL', evidence: 'Intake succeeded' };
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('PASS: Got 400 validation error:', err.response.data);
      return { status: 'PASS', evidence: JSON.stringify(err.response.data) };
    }
    console.log('FAIL: Got error:', err.message);
    return { status: 'FAIL', evidence: err.message };
  }
}

async function main() {
  const results = {};
  results['5.1_auth_me_logged_out'] = await testAuthMeLoggedOut();
  results['6.1_invalid_login'] = await testInvalidLogin();
  results['6.2_duplicate_signup'] = await testDuplicateSignup();
  results['3.1_buyer_intake_validation'] = await testValidationBuyerIntake();

  console.log('\n=== INTEGRATION TEST SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
