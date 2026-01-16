export default {
  async fetch(req, env) {
    await env.OTP_STORE.put("debug@test.com", "999999", { expirationTtl: 300 });
    const v = await env.OTP_STORE.get("debug@test.com");
    return new Response("KV TEST: " + v);
  }
};
