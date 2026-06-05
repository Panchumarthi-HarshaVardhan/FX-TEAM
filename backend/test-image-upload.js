const axios = require('axios');
const FormData = require('form-data');

const testImageUpload = async () => {
  console.log('=== Testing Local Image Upload Fallbacks ===');
  try {
    const email = `upload_test_${Date.now()}@example.com`;
    
    // 1. Register User
    const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Upload Test User',
      email: email,
      password: 'password123',
      role: 'founder'
    });
    
    console.log('✅ User registered:', registerRes.data.email);
    const token = registerRes.data.token;
    
    // Mock image file buffer (1px transparent PNG)
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    
    // 2. Upload Avatar
    console.log('\n=== Testing POST /api/users/upload-avatar ===');
    const avatarForm = new FormData();
    avatarForm.append('image', mockImageBuffer, { filename: 'avatar.png', contentType: 'image/png' });
    
    const avatarRes = await axios.post('http://localhost:3000/api/users/upload-avatar', avatarForm, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...avatarForm.getHeaders()
      }
    });
    
    console.log('✅ Avatar upload response success:', avatarRes.data.success);
    console.log('✅ Avatar saved URL:', avatarRes.data.data);
    
    if (!avatarRes.data.data.includes('/public/uploads/avatars/')) {
      throw new Error('Avatar was not saved to local uploads folder as fallback!');
    }
    
    // 3. Upload Cover Banner
    console.log('\n=== Testing POST /api/users/upload-cover ===');
    const coverForm = new FormData();
    coverForm.append('image', mockImageBuffer, { filename: 'cover.png', contentType: 'image/png' });
    
    const coverRes = await axios.post('http://localhost:3000/api/users/upload-cover', coverForm, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...coverForm.getHeaders()
      }
    });
    
    console.log('✅ Cover banner upload response success:', coverRes.data.success);
    console.log('✅ Cover banner saved URL:', coverRes.data.data);
    
    if (!coverRes.data.data.includes('/public/uploads/covers/')) {
      throw new Error('Cover banner was not saved to local uploads folder as fallback!');
    }
    
    console.log('\n=== ALL LOCAL FILE FALLBACK UPLOADS PASSED SUCCESSFULLY ===');
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

testImageUpload();
