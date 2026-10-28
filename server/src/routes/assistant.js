const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { db } = require('../data/store');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 30000;

function getActiveAuctions() {
  return db.getAuctions().filter(a => a.status === 'ACTIVE').map(a => ({
    id: a.id, title: a.title, category: a.category, condition: a.condition,
    currentBid: a.currentBid, startingPrice: a.startingPrice, minIncrement: a.minIncrement,
    bidCount: a.bidCount, closingTime: a.closingTime, sellerName: a.sellerName,
  }));
}

function searchAuctions(query) {
  const auctions = getActiveAuctions();
  const { keywords, category, maxPrice, condition } = query;
  return auctions.filter(a => {
    const matchesKeyword = !keywords || a.title.toLowerCase().includes(keywords.toLowerCase()) || a.category.toLowerCase().includes(keywords.toLowerCase());
    const matchesCategory = !category || a.category.toLowerCase() === category.toLowerCase();
    const matchesPrice = !maxPrice || (a.currentBid || a.startingPrice) <= maxPrice;
    const matchesCondition = !condition || a.condition.toLowerCase() === condition.toLowerCase();
    return matchesKeyword && matchesCategory && matchesPrice && matchesCondition;
  });
}

router.post('/chat', authenticate, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

  const activeAuctions = getActiveAuctions();
  const systemPrompt = `You are CampusBid Assistant, a helpful AI for a campus auction marketplace. 
You help students find items, understand bidding, and navigate the platform.

Current active auctions (${activeAuctions.length} total):
${JSON.stringify(activeAuctions, null, 2)}

IMPORTANT RULES:
- Only reference real auctions from the list above. NEVER invent auctions, prices, or listings.
- Do not expose any user's private data, passwords, or contact information.
- When a user wants to bid, show the auction details and ask for explicit confirmation. NEVER bid automatically.
- Format prices in Indian Rupees (₹).
- For auction search queries, extract keywords, category, maxPrice, and condition from the user's message.
- Be friendly, concise, and helpful.
- If asked to search for items, show the matching auctions from the list above with their IDs, current prices, and time remaining.
- Always remind users that bids require explicit confirmation through the platform.

Platform info:
- Students can sell items and bid on others' items.
- Auctions have a minimum bid increment.
- Anti-sniping: last-second bids extend the deadline by 60 seconds.
- Closing auctions go to PENDING_SELLER_APPROVAL, then the seller approves or rejects.`;

  if (!apiKey) {
    // Fallback: keyword search without AI
    const lastMessage = messages[messages.length - 1]?.content || '';
    const words = lastMessage.toLowerCase().split(' ');
    const categories = ['Cycles', 'Calculators', 'Books', 'Electronics', 'Accessories'];
    const foundCategory = categories.find(c => words.some(w => c.toLowerCase().includes(w)));
    const priceMatch = lastMessage.match(/(\d+)/);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : null;

    const results = searchAuctions({ keywords: words.join(' '), category: foundCategory, maxPrice });
    const responseText = results.length > 0
      ? `I found ${results.length} matching auction(s):\n\n${results.map(a => `• **${a.title}** (${a.category}) — Current price: ₹${(a.currentBid || a.startingPrice).toLocaleString('en-IN')} | ${a.bidCount} bids`).join('\n')}\n\n*Note: AI assistant requires an OpenRouter API key. Showing keyword search results.*`
      : 'No matching auctions found for your search. *Note: AI assistant requires an OpenRouter API key configured on the server.*';

    return res.json({ message: { role: 'assistant', content: responseText }, fallback: true });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'CampusBid',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-10)],
        max_tokens: 1000,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 429) return res.status(429).json({ error: 'Rate limit reached. Please try again later.' });
      if (response.status === 401) return res.status(401).json({ error: 'Invalid OpenRouter API key.' });
      return res.status(502).json({ error: errData.error?.message || 'AI service error' });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) return res.status(502).json({ error: 'No response from AI model' });

    res.json({ message, model: data.model });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'AI request timed out' });
    console.error('OpenRouter error:', err.message);
    res.status(502).json({ error: 'Failed to connect to AI service' });
  }
});

module.exports = router;
