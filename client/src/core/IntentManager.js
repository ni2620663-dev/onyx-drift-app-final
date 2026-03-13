/**
 * 🧠 IntentManager: Manages sensor states
 */
class IntentManager {
  constructor() {
    this.latestState = {
      gaze: { focusedElement: null },
      gesture: "NONE",
      voiceActive: false
    };
  }

  updateSensorData(type, data) {
    this.latestState[type] = data;
    // console.log(`Intent updated: ${type}`, data);
  }
}

export default new IntentManager();