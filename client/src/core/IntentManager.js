class IntentManager {
  constructor() {
    this.latestState = {
      gaze: { x: 0, y: 0, focusedElement: null },
      gesture: null,
      voiceCommand: null,
      bodyPosture: "neutral" // lean-forward, lean-back, neutral
    };
  }

  // সব সেন্সর থেকে ডেটা আপডেট করা
  updateSensorData(source, data) {
    this.latestState[source] = data;
    return this.predictIntent();
  }

  // Neural Intent Prediction Engine
  predictIntent() {
    const { gaze, gesture, voiceCommand, bodyPosture } = this.latestState;

    // Logic: Eye + Gesture + Voice Fusion
    if (gaze.focusedElement && gesture === "PINCH") {
      return { action: "SELECT_ITEM", target: gaze.focusedElement };
    }

    if (bodyPosture === "lean-forward") {
      return { action: "ZOOM_IN" };
    }

    if (voiceCommand) {
      return { action: "EXECUTE_VOICE", command: voiceCommand };
    }

    return null; // কোনো নির্দিষ্ট ইনটেন্ট পাওয়া যায়নি
  }
}

export default new IntentManager();