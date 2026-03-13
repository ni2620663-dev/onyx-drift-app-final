/**
 * 🛡️ OnyxGatekeeper: Access Control
 */
const OnyxGatekeeper = {
  async verifySession(user) {
    if (user) {
      console.log("🔓 OnyxGatekeeper: Session Authorized for", user.nickname);
      return "AUTHORIZED";
    }
    return "DENIED";
  }
};

export default OnyxGatekeeper;