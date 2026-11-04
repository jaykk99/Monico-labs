/* One-time owner setup. Run: node hub-worker/scripts/keygen.mjs
 * Prints three Worker secrets and the things you keep yourself.
 * Nothing is written to disk. Run it once, store the output in your
 * password manager, then paste the secrets into Cloudflare. */
import { webcrypto } from "node:crypto";
import { base32Encode, sha256Hex, randomId } from "../src/crypto.js";

const kp = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const pkcs8 = Buffer.from(await webcrypto.subtle.exportKey("pkcs8", kp.privateKey)).toString("base64");
const jwk = await webcrypto.subtle.exportKey("jwk", kp.publicKey);

const totpBytes = new Uint8Array(20);
webcrypto.getRandomValues(totpBytes);
const totp = base32Encode(totpBytes);
const recovery = `mlr-${randomId(6)}-${randomId(6)}-${randomId(6)}`;

console.log(`
=== Cloudflare Worker SECRETS (Settings -> Variables and Secrets -> type: Secret) ===
HUB_SIGNING_KEY      ${pkcs8}
OWNER_TOTP_SECRET    ${totp}
OWNER_RECOVERY_HASH  ${await sha256Hex(recovery)}

=== Keep these yourself (password manager). Do NOT put them in Cloudflare. ===
Authenticator app setup key:  ${totp}
  or scan/open:  otpauth://totp/Monico%20Labs:owner?secret=${totp}&issuer=Monico%20Labs&period=30&digits=6
Break-glass recovery code:    ${recovery}
  (logs you in if you lose your phone; rotate by re-running this script)

=== Public, safe to share: product sites pin this as MONICO_HUB_PUBLIC_KEY ===
${jwk.x}
`);
