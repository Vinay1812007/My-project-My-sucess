async function send(provider, feature, prompt, imageUrl=null) {
  const res = await fetch("/api/router", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, feature, prompt, imageUrl })
  });
  return await res.json();
}
