const axios = require('axios');
const mongoose = require('mongoose');

async function test() {
  try {
    // 1. Log in as super_admin
    const res1 = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'yatharthsachihar@gmail.com', // wait, is this the email? I used it earlier and it failed.
      password: 'password123'
    });
    console.log("Logged in super_admin");
  } catch (err) {
    console.error("Super Admin Login failed", err.response?.data || err.message);
  }
}
test();
