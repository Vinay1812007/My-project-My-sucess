import { sendOTP, verifyOTP } from './auth.js';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === '/auth/send' && req.method === 'POST') {
      return sendOTP(req, env);
    }

    if (url.pathname === '/auth/verify' && req.method === 'POST') {
      return verifyOTP(req, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};
