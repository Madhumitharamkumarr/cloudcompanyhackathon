const BASE = '/api';

function getToken() {
  return localStorage.getItem('campusbid_token');
}

async function req(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

export const api = {
  // Auth
  register: (body) => req('POST', '/auth/register', body),
  login: (body) => req('POST', '/auth/login', body),
  me: () => req('GET', '/auth/me'),

  // Auctions
  getAuctions: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
    return req('GET', `/auctions${qs ? '?' + qs : ''}`);
  },
  getAuction: (id) => req('GET', `/auctions/${id}`),
  createAuction: (body) => req('POST', '/auctions', body),
  updateAuction: (id, body) => req('PATCH', `/auctions/${id}`, body),
  cancelAuction: (id) => req('POST', `/auctions/${id}/cancel`),
  placeBid: (id, amount) => req('POST', `/auctions/${id}/bids`, { amount }),
  getBids: (id) => req('GET', `/auctions/${id}/bids`),
  setAutoBid: (id, maxAmount) => req('POST', `/auctions/${id}/auto-bid`, { maxAmount }),
  makeDecision: (id, decision) => req('POST', `/auctions/${id}/decision`, { decision }),
  handover: (id, status) => req('POST', `/auctions/${id}/handover`, { status }),

  // Questions
  getQuestions: (auctionId) => req('GET', `/auctions/${auctionId}/questions`),
  askQuestion: (auctionId, question) => req('POST', `/auctions/${auctionId}/questions`, { question }),
  answerQuestion: (questionId, answer) => req('POST', `/questions/${questionId}/answer`, { answer }),

  // Saved searches
  getSavedSearches: () => req('GET', '/saved-searches'),
  createSavedSearch: (body) => req('POST', '/saved-searches', body),
  deleteSavedSearch: (id) => req('DELETE', `/saved-searches/${id}`),

  // Notifications
  getNotifications: () => req('GET', '/notifications'),
  markRead: (id) => req('PATCH', `/notifications/${id}/read`),
  markAllRead: () => req('PATCH', '/notifications/read-all'),

  // AI
  chat: (messages) => req('POST', '/assistant/chat', { messages }),
};
