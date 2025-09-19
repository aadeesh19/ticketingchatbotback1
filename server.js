const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Enable CORS (allow all origins; modify for production as needed)
app.use(cors());

// Parse incoming JSON requests
app.use(bodyParser.json());

const maxTickets = 10;
const supportedLanguages = ['Marathi', 'Hindi', 'Punjabi', 'Malayalam', 'English'];
let bookings = [];
const completedBookings = {};

function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
  if (!valid) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function formatLanguageKey(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const messages = {
  // (Insert all multilingual messages exactly as you previously provided)
  English: {
    greeting: "Hello! Which language would you like to talk in?",
    howCanIHelp: "How can I help you today?",
    askName: "Please tell me your name.",
    askTickets: `How many tickets do you want? (1-${maxTickets})`,
    askDate: "Please provide the visit date in YYYY-MM-DD format.",
    askPlace: "Where would you like to visit? Please choose one.",
    confirmBooking: (name, tickets, date, place) => `Great! ✨ Booking ${tickets} tickets for ${name} on ${date} to visit ${place}. Please confirm with YES or cancel with NO.`,
    bookingConfirmed: "Your booking is confirmed! 🎉 Thank you!",
    bookingCancelled: "Booking cancelled. You can start anytime.",
    invalidDate: "Sorry, the date is invalid or in the past. Please input a valid date.",
    invalidTickets: `Please enter a number of tickets between 1 and ${maxTickets}.`,
    tourOptions: [
      "Dilli Ki Darohar (Morning Circuit-1)",
      "Dilli ka Rahasya (Morning Circuit-2)",
      "Rashtrapati Bhawan (Change of Guard Ceremony Morning Tour - Dilli ka Raisina House)"
    ],
    bookLink: "https://delhitourism.gov.in/ebooking/DekhoMeriDilli",
    cancelLink: "https://delhitourism.gov.in/ebooking/cancellation"
  },
  // Add other languages similarly...
};

app.post('/chat', (req, res, next) => {
  try {
    const { message = '', userId } = req.body;
    if (!userId) return res.status(400).json({ reply: 'Missing userId', quickReplies: [] });

    let userBooking = bookings.find(b => b.userId === userId);

    if (!userBooking && !completedBookings[userId]) {
      const langChoice = formatLanguageKey(message.trim());
      const langMsgs = messages[langChoice] || messages['English'];

      if (!message.trim() || !supportedLanguages.includes(langChoice)) {
        return res.json({
          reply: langMsgs.greeting + " " + supportedLanguages.join(', '),
          quickReplies: supportedLanguages
        });
      }

      userBooking = { userId, step: 1, data: { language: langChoice } };
      bookings.push(userBooking);

      return res.json({
        reply: langMsgs.howCanIHelp,
        quickReplies: []
      });
    }

    if (!userBooking) {
      return res.json({ reply: `Hello! Please select a language: ${supportedLanguages.join(', ')}`, quickReplies: supportedLanguages });
    }

    const lang = userBooking.data.language;
    const langMsgs = messages[lang] || messages['English'];

    switch (userBooking.step) {
      case 1:
        userBooking.data.name = message.trim();
        userBooking.step++;
        return res.json({ reply: langMsgs.askTickets, quickReplies: Array.from({ length: maxTickets }, (_, i) => (i + 1).toString()) });

      case 2:
        const ticketCount = parseInt(message);
        if (isNaN(ticketCount) || ticketCount <= 0 || ticketCount > maxTickets)
          return res.json({ reply: langMsgs.invalidTickets, quickReplies: Array.from({ length: maxTickets }, (_, i) => (i + 1).toString()) });
        userBooking.data.tickets = ticketCount;
        userBooking.step++;
        return res.json({ reply: langMsgs.askDate, quickReplies: ["2025-12-25", "2026-01-01", "2026-05-15"] });

      case 3:
        if (!isValidDate(message)) return res.json({ reply: langMsgs.invalidDate, quickReplies: ["2025-12-25", "2026-01-01", "2026-05-15"] });
        userBooking.data.date = message;
        userBooking.step++;
        return res.json({ reply: langMsgs.askPlace, quickReplies: ["Delhi", "Kerala"] });

      case 4:
        if (!["Delhi", "Kerala"].includes(message)) return res.json({ reply: langMsgs.askPlace, quickReplies: ["Delhi", "Kerala"] });
        userBooking.data.visitPlace = message;
        userBooking.step++;
        if (message === "Delhi") {
          return res.json({ reply: "Please select a tour option:", quickReplies: langMsgs.tourOptions });
        } else {
          userBooking.step = 99;
          return res.json({ reply: langMsgs.confirmBooking(userBooking.data.name, userBooking.data.tickets, userBooking.data.date, message), quickReplies: ["YES", "NO"] });
        }

      case 5:
        if (!langMsgs.tourOptions.includes(message))
          return res.json({ reply: "Please select a valid tour option.", quickReplies: langMsgs.tourOptions });
        userBooking.step = 99;
        return res.json({ reply: `You selected "${message}". Book your ticket here: ${langMsgs.bookLink}`, quickReplies: ["Cancel my booking", "New booking"] });

      case 99:
        if (message.toLowerCase().includes("cancel")) {
          bookings = bookings.filter(b => b.userId !== userId);
          return res.json({ reply: `Cancel your ticket here: ${langMsgs.cancelLink}`, quickReplies: supportedLanguages });
        } else if (message.toLowerCase().includes("new")) {
          bookings = bookings.filter(b => b.userId !== userId);
          return res.json({ reply: "Starting new booking...", quickReplies: supportedLanguages });
        } else {
          return res.json({ reply: langMsgs.howCanIHelp, quickReplies: supportedLanguages });
        }

      default:
        bookings = bookings.filter(b => b.userId !== userId);
        return res.json({ reply: langMsgs.howCanIHelp, quickReplies: supportedLanguages });
    }
  } catch (err) {
    next(err);
  }
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ reply: 'Internal server error. Please try again later.', quickReplies: [] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend is running on port ${PORT}`));
