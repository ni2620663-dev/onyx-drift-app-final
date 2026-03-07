import express from 'express';
import { google } from 'googleapis';
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.post('/schedule', async (req, res) => {
  const { summary, startTime, endTime } = req.body;
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      resource: { summary, start: { dateTime: startTime }, end: { dateTime: endTime } }
    });
    res.json({ status: "SUCCESS", message: "Meeting scheduled!", event: event.data });
  } catch (error) {
    res.status(500).json({ error: "Neural Grid Breakdown: Could not sync calendar." });
  }
});

export default router;