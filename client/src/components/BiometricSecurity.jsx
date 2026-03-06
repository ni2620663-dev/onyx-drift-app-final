// src/components/BiometricSecurity.jsx
export const requestFingerprintAuth = async () => {
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([/* ইউনিক চ্যালেঞ্জ কোড */]),
        userVerification: "required"
      }
    });
    return !!credential;
  } catch (e) {
    console.error("Fingerprint failed", e);
    return false;
  }
};