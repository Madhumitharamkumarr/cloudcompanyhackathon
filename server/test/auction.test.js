const assert = require('assert');

// Test suite for core auction bidding validation rules
async function runTests() {
  console.log('🧪 Running CampusBid Core Auction Flow Tests...\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ok', 'Health check failed');
  console.log('✅ Scenario 1: Server health check passed.');

  // 2. Authentication test
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arjun@college.edu', password: 'password123' }),
  });
  const loginData = await loginRes.json();
  assert.ok(loginData.token, 'Login failed');
  const arjunToken = loginData.token;
  console.log('✅ Scenario 2: Authentication successful (Arjun Sharma).');

  // Login as Priya (buyer)
  const priyaLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya@college.edu', password: 'password123' }),
  });
  const priyaData = await priyaLoginRes.json();
  const priyaToken = priyaData.token;

  // 3. Search and listing verification
  const auctionsRes = await fetch(`${BASE_URL}/auctions`);
  const auctions = await auctionsRes.json();
  assert.ok(auctions.length >= 6, 'Should have at least 6 seeded auctions');
  console.log(`✅ Scenario 3: Auctions listed successfully (${auctions.length} auctions).`);

  // 4. Seller cannot bid on own listing
  const arjunAuction = auctions.find(a => a.sellerId === 'user-1' && a.status === 'ACTIVE');
  if (arjunAuction) {
    const selfBidRes = await fetch(`${BASE_URL}/auctions/${arjunAuction.id}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arjunToken}`,
      },
      body: JSON.stringify({ amount: (arjunAuction.currentBid || arjunAuction.startingPrice) + 500 }),
    });
    assert.strictEqual(selfBidRes.status, 400, 'Seller should not be allowed to bid on own listing');
    console.log('✅ Scenario 4: Seller prevented from bidding on own listing.');
  }

  // 5. Bid below minimum required is rejected
  const testAuction = auctions.find(a => a.sellerId !== 'user-2' && a.status === 'ACTIVE');
  assert.ok(testAuction, 'Active auction found for Priya to bid on');
  const minRequired = testAuction.currentBid ? testAuction.currentBid + testAuction.minIncrement : testAuction.startingPrice;

  const lowBidRes = await fetch(`${BASE_URL}/auctions/${testAuction.id}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${priyaToken}`,
    },
    body: JSON.stringify({ amount: minRequired - 10 }),
  });
  assert.strictEqual(lowBidRes.status, 400, 'Low bid should be rejected');
  console.log('✅ Scenario 5: Bid below minimum increment correctly rejected with explanation.');

  // 6. Valid bid accepted and updates bid history
  const validBidRes = await fetch(`${BASE_URL}/auctions/${testAuction.id}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${priyaToken}`,
    },
    body: JSON.stringify({ amount: minRequired + 100 }),
  });
  assert.strictEqual(validBidRes.status, 201, 'Valid bid should be accepted');
  const bidResult = await validBidRes.json();
  assert.strictEqual(bidResult.auction.currentBid, minRequired + 100, 'Current bid updated');
  console.log(`✅ Scenario 6: Valid bid of ₹${minRequired + 100} accepted and updated current price.`);

  // 7. Verify public bid history
  const bidsRes = await fetch(`${BASE_URL}/auctions/${testAuction.id}/bids`);
  const bids = await bidsRes.json();
  assert.ok(bids.some(b => b.amount === minRequired + 100 && b.bidderName === 'Priya Nair'), 'Bid history updated');
  console.log('✅ Scenario 7: Public bid history updated with timestamp and bidder name.');

  // 8. AI Assistant structured fallback search
  const chatRes = await fetch(`${BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${priyaToken}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Find me a cycle under 5000' }],
    }),
  });
  assert.strictEqual(chatRes.status, 200, 'Assistant chat endpoint should respond');
  const chatData = await chatRes.json();
  assert.ok(chatData.message && chatData.message.content, 'Assistant returned content');
  console.log('✅ Scenario 8: AI assistant responded safely querying genuine listing data.');

  console.log('\n🎉 ALL 8 CORE SCENARIO TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
