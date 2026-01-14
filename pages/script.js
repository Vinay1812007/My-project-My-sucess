export async function generateKeys() {
  const keys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  localStorage.setItem("privateKey", JSON.stringify(await crypto.subtle.exportKey("jwk", keys.privateKey)));
  localStorage.setItem("publicKey", JSON.stringify(await crypto.subtle.exportKey("jwk", keys.publicKey)));
}

export async function encrypt(msg, remotePub) {
  const priv = await crypto.subtle.importKey("jwk", JSON.parse(localStorage.privateKey), { name:"ECDH", namedCurve:"P-256" }, false, ["deriveKey"]);
  const pub = await crypto.subtle.importKey("jwk", remotePub, { name:"ECDH", namedCurve:"P-256" }, false, []);
  const key = await crypto.subtle.deriveKey({ name:"ECDH", public: pub }, priv, { name:"AES-GCM", length:256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(msg));
  return { iv:[...iv], data:[...new Uint8Array(data)] };
}
