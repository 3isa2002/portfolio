/**
 * Reply Twin demo data (SPEC §6 "Interactive demos"): sample incoming messages and the replies
 * the real local model drafted for them, recorded once and replayed in the browser.
 * TODO(mohamed): replace with real pre-generated pairs from the model (anonymised).
 */
export const replyTwinDemo = {
  contact: "Karim",
  samples: [
    {
      incoming: "Are we still on for tomorrow at 7?",
      reply: "Yes, 7 works 👍 I'll be there 10 minutes early, want me to book a table?",
    },
    {
      incoming: "Can you send me the slides from today?",
      reply: "Sure, give me 5 minutes, I'm cleaning them up and I'll send the PDF right after.",
    },
    {
      incoming: "Did the ESP32 board arrive?",
      reply:
        "Arrived this morning! Flashing it tonight, I'll tell you if the sensor readings look sane.",
    },
  ],
} as const;
