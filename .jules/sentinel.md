## 2024-06-13 - [Weak PRNG in Password Generation]
**Vulnerability:** Found `Math.random()` being used to generate passwords in `src/components/admin/password-reset-dialog.tsx`.
**Learning:** `Math.random()` is not cryptographically secure and can be predictable, which makes password generation weak and susceptible to attacks.
**Prevention:** Always use `window.crypto.getRandomValues()` or `crypto.randomBytes()` (in Node.js) for any security-sensitive random value generation like passwords, tokens, or encryption keys.
