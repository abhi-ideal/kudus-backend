
const axios = require('axios');

const BASE_URL = 'http://0.0.0.0:3007/api/common';
const TEST_TOKEN = 'your-test-firebase-token'; // Replace with actual token

async function testGenreEndpoints() {
  console.log('Testing Genre Endpoints...\n');

  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Get all genres for admin
    console.log('1. Testing GET /admin/genres');
    const adminGenresResponse = await axios.get(`${BASE_URL}/admin/genres`, { headers });
    console.log('✅ Admin genres:', adminGenresResponse.status, adminGenresResponse.data.genres?.length || 0, 'genres');

    // Test 2: Get user genres (public)
    console.log('2. Testing GET /genres (public)');
    const userGenresResponse = await axios.get(`${BASE_URL}/genres`);
    console.log('✅ User genres:', userGenresResponse.status, userGenresResponse.data.genres?.length || 0, 'genres');

    // Test 3: Create a new genre
    console.log('3. Testing POST /genres (create)');
    const newGenre = {
      name: 'Test Genre',
      description: 'A test genre for endpoint testing'
    };
    const createResponse = await axios.post(`${BASE_URL}/genres`, newGenre, { headers });
    console.log('✅ Create genre:', createResponse.status, createResponse.data.message);
    const genreId = createResponse.data.genre.id;

    // Test 4: Update the genre via admin endpoint
    console.log('4. Testing PUT /admin/genres/:id (update)');
    const updateData = {
      name: 'Updated Test Genre',
      description: 'Updated description',
      isActive: false
    };
    const updateResponse = await axios.put(`${BASE_URL}/admin/genres/${genreId}`, updateData, { headers });
    console.log('✅ Update genre:', updateResponse.status, updateResponse.data.message);

    // Test 5: Get genre by ID via admin endpoint
    console.log('5. Testing GET /admin/genres/:id');
    const getByIdResponse = await axios.get(`${BASE_URL}/admin/genres/${genreId}`, { headers });
    console.log('✅ Get genre by ID:', getByIdResponse.status, getByIdResponse.data.genre.name);

    // Test 6: Delete the genre via admin endpoint
    console.log('6. Testing DELETE /admin/genres/:id');
    const deleteResponse = await axios.delete(`${BASE_URL}/admin/genres/${genreId}`, { headers });
    console.log('✅ Delete genre:', deleteResponse.status, deleteResponse.data.message);

    console.log('\n✅ All genre endpoints working correctly!');

  } catch (error) {
    console.error('❌ Error testing endpoints:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }
}

testGenreEndpoints();
