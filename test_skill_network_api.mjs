const BASE_URL = 'http://localhost:5000/api';

async function runSkillNetworkTests() {
  console.log('==================================================');
  console.log('🔮 RUNNING 3D SKILL NETWORK BACKEND API TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Fetch complete skill network
  let networkData = null;
  await test('GET /api/users/skill-network (Fetch Full Network Graph)', async () => {
    const res = await fetch(`${BASE_URL}/users/skill-network`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Fetch failed');
    if (!Array.isArray(json.data.skills) || !Array.isArray(json.data.users) || !Array.isArray(json.data.links)) {
      throw new Error('Response missing skills, users, or links arrays');
    }
    networkData = json.data;
  });

  // 2. Validate skill nodes
  await test('Validate Skill Nodes & Metadata', async () => {
    if (networkData.skills.length === 0) throw new Error('Skill list is unexpectedly empty');
    const firstSkill = networkData.skills[0];
    if (!firstSkill.id || !firstSkill.name || !firstSkill.category || typeof firstSkill.userCount !== 'number') {
      throw new Error('Skill node missing required properties');
    }
  });

  // 3. Validate user nodes
  await test('Validate User Nodes & Skills List', async () => {
    if (networkData.users.length === 0) throw new Error('User list is unexpectedly empty');
    const firstUser = networkData.users[0];
    if (!firstUser.id || !firstUser.name || !Array.isArray(firstUser.skills)) {
      throw new Error('User node missing required properties');
    }
  });

  // 4. Test Category Filter
  await test('GET /api/users/skill-network?category=Frontend', async () => {
    const res = await fetch(`${BASE_URL}/users/skill-network?category=Frontend`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Category filter failed');
    const allFrontend = json.data.skills.every(s => s.category.toLowerCase() === 'frontend');
    if (!allFrontend) throw new Error('Returned skills containing non-Frontend categories');
  });

  // 5. Test Search Query
  await test('GET /api/users/skill-network?search=React', async () => {
    const res = await fetch(`${BASE_URL}/users/skill-network?search=React`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Search filter failed');
    const allMatch = json.data.skills.every(s => s.name.toLowerCase().includes('react'));
    if (!allMatch) throw new Error('Returned skills did not match search query "React"');
  });

  console.log('\n==================================================');
  console.log(`🎉 ALL SKILL NETWORK API TESTS PASSED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSkillNetworkTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
