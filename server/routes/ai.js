import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from 'openai';
import auth from "../middleware/auth.js";
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { spawn } from 'child_process';
import textToSpeech from '@google-cloud/text-to-speech';

const router = express.Router();

// AI ক্লায়েন্ট সেটআপ
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ttsClient = new textToSpeech.TextToSpeechClient();

// ফোল্ডার চেক
if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');

// --- ১. AI Voiceover Generator (Text-to-Speech) ---
router.post("/generate-voiceover", auth, async (req, res) => {
  const { text, voiceType = 'en-US-Neural2-F' } = req.body;
  if (!text) return res.status(400).json({ msg: "Text is required" });

  try {
    const request = {
      input: { text: text },
      voice: { languageCode: 'en-US', name: voiceType },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const fileName = `voiceover_${Date.now()}.mp3`;
    const audioPath = `./temp/${fileName}`;
    
    fs.writeFileSync(audioPath, response.audioContent, 'binary');
    
    // নোট: এখানে আপনার স্ট্যাটিক ফাইল সার্ভিং ইউআরএল দিতে হবে
    res.json({ success: true, audioUrl: `/temp/${fileName}` });
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ msg: "Voiceover generation failed" });
  }
});

// --- ২. Multi-Clip Merge (ভিডিও ক্লিপ জোড়া দেওয়া) ---
router.post("/merge-clips", auth, async (req, res) => {
  const { videoPaths } = req.body; // Array of paths
  if (!videoPaths || videoPaths.length < 2) return res.status(400).json({ msg: "At least 2 clips required" });

  const outputPath = `./temp/merged_${Date.now()}.mp4`;
  let command = ffmpeg();

  videoPaths.forEach(path => {
    command = command.input(path);
  });

  command
    .on('error', (err) => res.status(500).json({ msg: "Merging failed: " + err.message }))
    .on('end', () => res.json({ success: true, videoUrl: outputPath }))
    .mergeToFile(outputPath, './temp');
});

// --- ৩. AI Text-to-Edit Command (Gemini) ---
router.post("/process-command", auth, async (req, res) => {
  const { command, currentFilters } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a professional video editor AI. Convert this command: "${command}" into JSON video filters. 
    Possible keys: brightness, contrast, saturate, exposure, temperature, blur. 
    Current: ${JSON.stringify(currentFilters)}.
    Return ONLY JSON. Example: {"brightness": 120, "temperature": 10}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const filterUpdate = JSON.parse(text.replace(/```json|```/g, ""));
    res.json({ success: true, newFilters: { ...currentFilters, ...filterUpdate } });
  } catch (error) {
    res.status(500).json({ msg: "Neural Command Failed" });
  }
});

// --- ৪. অডিও থেকে অটো-ক্যাপশন (Whisper AI) ---
router.post('/auto-caption', auth, async (req, res) => {
  try {
    const { videoPath } = req.body;
    const audioPath = `./temp/extracted_audio_${Date.now()}.mp3`;

    ffmpeg(videoPath)
      .toFormat('mp3')
      .on('error', (err) => res.status(500).json({ msg: "Audio extraction failed" }))
      .on('end', async () => {
        try {
          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["word"]
          });

          const captionLayers = transcription.words.map(item => ({
            id: `caption-${Math.random().toString(36).substr(2, 9)}`,
            type: 'text',
            content: item.word,
            startTime: item.start,
            endTime: item.end,
            x: 50, y: 80,
            style: { color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }
          }));

          fs.unlinkSync(audioPath);
          res.json({ success: true, layers: captionLayers });
        } catch (error) {
          res.status(500).json({ msg: "AI Transcription failed" });
        }
      })
      .save(audioPath);
  } catch (error) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// --- ৫. Text-to-Video (Veo/Gen-AI) ---
router.post("/generate-video", auth, async (req, res) => {
  const { prompt } = req.body;
  try {
    // এখানে আপনার ভিডিও জেনারেশন এপিআই কল হবে
    const generatedVideoUrl = "https://example.com/ai-generated-sample.mp4"; 
    res.json({ success: true, videoUrl: generatedVideoUrl });
  } catch (error) {
    res.status(500).json({ msg: "Video Generation Failed" });
  }
});
// --- ১. AI Viral Predictor & Scene Analysis ---
router.post("/analyze-viral-score", auth, async (req, res) => {
  const { videoData, currentTitle } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are a social media growth expert. Analyze this video metadata:
    Title: "${currentTitle}"
    Technical Data: ${JSON.stringify(videoData)}
    
    Tasks:
    1. Give a Viral Score (0-100).
    2. Identify "Boring Zones" (where users might skip).
    3. Suggest 3 improvements for better retention.
    
    Return ONLY JSON:
    { "score": 85, "boring_zones": ["0:15-0:20"], "tips": ["Add a hook at 0:02", "Fast cut at 0:30"] }`;

    const result = await model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text().replace(/```json|```/g, ""));
    
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ msg: "Viral Analysis Failed" });
  }
});

// --- ২. AI Relighting & Neural Grading ---
router.post("/apply-neural-relighting", auth, async (req, res) => {
  const { videoPath, style = 'cyberpunk' } = req.body;
  const outputPath = `./temp/relighted_${Date.now()}.mp4`;

  // বিভিন্ন স্টাইলের জন্য FFmpeg LUT/Filter Configuration
  const styles = {
    'cyberpunk': "eq=brightness=0.05:contrast=1.3:saturation=1.8, hue=h=20",
    'vintage': "curves=vintage, noise=alls=10:allf=t+u",
    'cinematic': "colortemperature=temperature=5000, eq=contrast=1.2:saturation=1.1",
    'horror': "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3, eq=brightness=-0.1:contrast=1.5"
  };

  const filter = styles[style] || styles['cinematic'];

  ffmpeg(videoPath)
    .videoFilters(filter)
    .on('error', (err) => res.status(500).json({ msg: "Relighting Failed" }))
    .on('end', () => res.json({ success: true, videoUrl: outputPath }))
    .save(outputPath);
});
// --- Speech-to-Emotion & Auto-Grading Engine ---
router.post("/emotion-based-editing", auth, async (req, res) => {
  const { videoPath, audioPath } = req.body;
  const outputPath = `./temp/emotion_final_${Date.now()}.mp4`;

  // ১. অডিও এনালাইসিস করে মুড বোঝা (Gemini AI এর মাধ্যমে)
  // ২. মুড অনুযায়ী FFmpeg ফিল্টার নির্ধারণ
  const moodFilter = "eq=contrast=1.3:saturation=1.5"; // উদাহরণস্বরূপ একটি ফিল্টার

  ffmpeg(videoPath)
    .input(audioPath) // অডিও ইনপুট
    .complexFilter([
      // অডিওর উপর ভিত্তি করে ভিজ্যুয়াল ইফেক্টস মাস্কিং
      "[0:v]eq=saturation=1.5[v]"
    ])
    .outputOptions([
      "-map [v]",
      "-map 1:a", // অডিও ম্যাপ করা
      "-c:v libx264",
      "-c:a aac"
    ])
    .on('end', () => res.json({ success: true, videoUrl: outputPath }))
    .save(outputPath);
});

// --- ৬. AI Background Removal (Python Script Bridge) ---
router.post('/remove-background', auth, async (req, res) => {
  const { videoPath } = req.body;
  const outputPath = `./temp/processed_${Date.now()}.mp4`;

  const pythonProcess = spawn('python3', ['./scripts/remove_bg.py', videoPath, outputPath]);

  pythonProcess.on('close', (code) => {
    if (code === 0) res.json({ success: true, processedVideo: outputPath });
    else res.status(500).json({ msg: "Background removal failed" });
  });
});

// --- ৭. ভাইরাল ক্যাপশন জেনারেটর (Gemini) ---
router.post("/generate-caption", auth, async (req, res) => {
  const { prompt } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `Generate 3 short, viral social media captions for: "${prompt}". Use cyberpunk tone and hashtags.`;
    const result = await model.generateContent(fullPrompt);
    res.json({ captions: result.response.text() });
  } catch (error) {
    res.status(500).json({ msg: "AI Link failed" });
  }
});

export default router;