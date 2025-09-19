const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

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
  today.setHours(0,0,0,0);
  return date >= today;
}

function formatLanguageKey(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const messages = {
  English: {
    greeting: "Hello! Which language would you like to talk in?",
    howCanIHelp: "How can I help you today?",
    askName: "Please tell me your name.",
    askTickets: `How many tickets do you want? (1-${maxTickets})`,
    askDate: "Please provide the visit date in YYYY-MM-DD format.",
    askPlace: "Where would you like to visit? Please choose one.",
    confirmBooking: (name,tickets,date,place) => `Great! ✨ Booking ${tickets} tickets for ${name} on ${date} to visit ${place}. Please confirm with YES or cancel with NO.`,
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
  Marathi: {
    greeting: "नमस्कार! आपण कोणती भाषा बोलू इच्छिता?",
    howCanIHelp: "मी तुम्हाला आज कशी मदत करू शकतो?",
    askName: "कृपया आपले नाव सांगा.",
    askTickets: "तुम्हाला किती तिकीटे हवे आहेत?",
    askDate: "कृपया भेटीचा दिवस YYYY-MM-DD स्वरूपात सांगा.",
    askPlace: "कुठे भेट देऊ इच्छिता? कृपया खालीलपैकी एक निवडा.",
    confirmBooking: (name,tickets,date,place) => `छान! ✨ ${name} साठी ${tickets} तिकीटे ${date} रोजी ${place} साठी नोंदणी करीत आहे. कृपया YES म्हणून पुष्टी करा किंवा NO म्हणून रद्द करा.`,
    bookingConfirmed: "तुमची नोंदणी पुष्टी करण्यात आली आहे! 🎉 धन्यवाद!",
    bookingCancelled: "नोंदणी रद्द करण्यात आली. तुम्हाला कधीही पुन्हा प्रारंभ करता येईल.",
    invalidDate: "वाईट वाटते, दिलेला दिनांक चुकीचा/भूतकाळाचा आहे. कृपया योग्य दिनांक द्या.",
    invalidTickets: `कृपया 1 ते ${maxTickets} दरम्यान तिकीटांची योग्य संख्या द्या.`,
    tourOptions: [
      "दिल्ली की धरोहर (सकाळी सर्किट-1)",
      "दिल्ली का रहस्य (सकाळी सर्किट-2)",
      "राष्ट्रपती भवन (गार्ड बदल समारोह - दिल्ली का रेसिना हाऊस)"
    ],
    bookLink: "https://delhitourism.gov.in/ebooking/DekhoMeriDilli",
    cancelLink: "https://delhitourism.gov.in/ebooking/cancellation"
  },
  Hindi: {
    greeting: "नमस्ते! आप किस भाषा में बात करना चाहेंगे?",
    howCanIHelp: "मैं आपकी कैसे मदद कर सकता हूँ?",
    askName: "कृपया अपना नाम बताएं।",
    askTickets: "आप कितनी टिकटें लेना चाहते हैं?",
    askDate: "जानकारी के लिए कृपया YYYY-MM-DD फॉर्मेट में तारीख बताएं।",
    askPlace: "आप कहाँ जाना चाहते हैं? कृपया नीचे से चुनें।",
    confirmBooking: (name,tickets,date,place) => `शानदार! ✨ ${name} के लिए ${tickets} टिकटें ${date} को ${place} में बुक की जा रही हैं। कृपया YES कहें पुष्टि करने के लिए या NO कहें रद्द करने के लिए।`,
    bookingConfirmed: "आपकी बुकिंग पुष्टि हो गई है! 🎉 धन्यवाद!",
    bookingCancelled: "बुकिंग रद्द कर दी गई है। आप कभी भी फिर से शुरू कर सकते हैं।",
    invalidDate: "क्षमा करें, तारीख गलत है या पहले की है। कृपया सही तारीख दें।",
    invalidTickets: `कृपया 1 से ${maxTickets} के बीच टिकटों की संख्या दें।`,
    tourOptions: [
      "दिल्ली की धरोहर (सकाळी सर्किट-1)",
      "दिल्ली का रहस्य (सकाळी सर्किट-2)",
      "राष्ट्रपति भवन (गार्ड बदल समारोह - दिल्ली का रेसिना हाउस)"
    ],
    bookLink: "https://delhitourism.gov.in/ebooking/DekhoMeriDilli",
    cancelLink: "https://delhitourism.gov.in/ebooking/cancellation"
  },
  Punjabi: {
    greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਸੀਂ ਕਿਹੜੀ ਭਾਸ਼ਾ ਵਿਚ ਗੱਲ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    howCanIHelp: "ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    askName: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਨਾਮ ਦੱਸੋ।",
    askTickets: "ਤੁਸੀਂ ਕਿੰਨੀ ਟਿਕਟਾਂ ਲੈਣੀ ਚਾਹੁੰਦੇ ਹੋ?",
    askDate: "ਕਿਰਪਾ ਕਰਕੇ YYYY-MM-DD ਫਾਰਮੈਟ ਵਿੱਚ ਦਿਨਾਂਕ ਦੱਸੋ।",
    askPlace: "ਤੁਸੀਂ ਕਿੱਥੇ ਜਾਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂੋਂ ਚੁਣੋ।",
    confirmBooking: (name,tickets,date,place) => `ਵਧੀਆ! ✨ ${name} ਲਈ ${tickets} ਟਿਕਟਾਂ ${date} ਨੂੰ ${place} ਵਿੱਚ ਬੁਕ ਕੀਤੀਆਂ ਜਾ ਰਹੀਆਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਲਈ YES ਕਰੋ ਜਾਂ ਰੱਦ ਕਰਨ ਲਈ NO।`,
    bookingConfirmed: "ਤੁਹਾਡੀ ਬੁਕਿੰਗ ਪੁਸ਼ਟੀ ਹੋ ਗਈ ਹੈ! 🎉 ਧੰਨਵਾਦ!",
    bookingCancelled: "ਬੁਕਿੰਗ ਰੱਦ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਤੁਸੀਂ ਕਦੇ ਵੀ ਫਿਰ ਸ਼ੁਰੂ ਕਰ ਸਕਦੇ ਹੋ।",
    invalidDate: "ਮਾਫ਼ ਕਰਨਾ, ਦਿਤੀ ਗਈ ਤਾਰੀਖ ਗਲਤ ਜਾਂ ਪਹਿਲਾਂ ਦੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਤਾਰੀਖ ਦਿਓ।",
    invalidTickets: `ਕਿਰਪਾ ਕਰਕੇ 1 ਤੋਂ ${maxTickets} ਵਿਚਕਾਰ ਟਿਕਟਾਂ ਦੀ ਗਿਣਤੀ ਦਿਓ।`,
    tourOptions: [
      "ਦਿੱਲੀ ਕੀ ਧਰੋਹਰ (ਸਵੇਰੇ ਸਰਕਿਟ-1)",
      "ਦਿੱਲੀ ਦਾ ਰਾਜ (ਸਵੇਰੇ ਸਰਕਿਟ-2)",
      "ਰਾਸ਼ਟਰਪਤੀ ਭਵਨ (ਗਾਰਡ ਬਦਲ ਸਮਾਰੋਹ - ਦਿੱਲੀ ਦਾ ਰੈਸੀਨਾ ਹਾਊਸ)"
    ],
    bookLink: "https://delhitourism.gov.in/ebooking/DekhoMeriDilli",
    cancelLink: "https://delhitourism.gov.in/ebooking/cancellation"
  },
  Malayalam: {
    greeting: "നമസ്കാരം! നിങ്ങൾക്ക് ഏത് ഭാഷയിൽ സംസാരിക്കണമെന്നാണ് ഇച്ഛിക്കുന്നത്?",
    howCanIHelp: "ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
    askName: "ദയവായി നിങ്ങളുടെ പേര് പറയാമോ?",
    askTickets: "നിങ്ങൾക്ക് എത്ര ടിക്കറ്റ് വേണമെന്നാണ് പറയാൻ പോകുന്നത്?",
    askDate: "സന്ദർശന തിയതി YYYY-MM-DD ഫോർമാറ്റിൽ നൽകുക.",
    askPlace: "സന്ദർശിക്കാൻ നിങ്ങൾക്ക് ആഗ്രഹിക്കുന്നിടം തിരഞ്ഞെടുക്കുക.",
    confirmBooking: (name,tickets,date,place) => `✨ ${name} ${date} ന് ${place} സന്ദർശിക്കാൻ ${tickets} ടിക്കറ്റുകൾ ബുക്ക് ചെയ്യുന്നു. ദയവായി YES എന്ന് സ്ഥിരീകരിക്കാൻ അല്ലെങ്കിൽ NO എന്ന് റദ്ദാക്കാൻ പറഞ്ഞു.`,
    bookingConfirmed: "നിങ്ങളുടെ ബുക്കിംഗ് സ്ഥിരീകരിച്ചിരിക്കുന്നു! 🎉 നന്ദി!",
    bookingCancelled: "ബുക്കിംഗ് റദ്ദാക്കി. നിങ്ങൾക്ക് എവിടെ വേണെയോ തുടർന്നു ആരംഭിക്കാം.",
    invalidDate: "ക്ഷമിക്കണം, നൽകിയ തീയതി തെറ്റായതാണ് അല്ലെങ്കിൽ പഴയ തീയതിയാണ്. ദയവായി ശരിയായ തീയതി നൽകുക.",
    invalidTickets: `ദയവായി 1 മുതൽ ${maxTickets} വരെ ടിക്കറ്റ് എണ്ണം നൽകുക.`,
    tourOptions: [
      "[ദിവസം] ദില്ലി കി ധരോഹർ (മോണിങ് സർക്യൂട്ട്-1)",
      "[ദിവസം] ദില്ലി ക റഹസ്യ (മോണിങ് സർക്യൂട്ട്-2)",
      "[ദിവസം] രാഷ്ട്രപതി ഭവൻ (ചേഞ്ച് ഓഫ് ഗാർഡ് സെറിമണി - ദില്ലി ക റൈസീന ഹൗസ്)"
    ],
    bookLink: "https://delhitourism.gov.in/ebooking/DekhoMeriDilli",
    cancelLink: "https://delhitourism.gov.in/ebooking/cancellation"
  }
};

// Chat endpoint
app.post('/chat', (req, res) => {
  try {
    const { message = '', userId } = req.body;
    if(!userId) return res.status(400).json({reply:'Missing userId', quickReplies:[]});

    let userBooking = bookings.find(b => b.userId === userId);

    if(!userBooking && !completedBookings[userId]){
      const langChoice = formatLanguageKey(message.trim());
      const langMsgs = messages[langChoice] || messages['English'];

      if(!message.trim() || !supportedLanguages.includes(langChoice)){
        return res.json({
          reply: langMsgs.greeting + " " + supportedLanguages.join(', '),
          quickReplies: supportedLanguages
        });
      }

      userBooking = {userId, step:1, data:{language:langChoice}};
      bookings.push(userBooking);

      return res.json({
        reply: langMsgs.howCanIHelp,
        quickReplies:[]
      });
    }

    if(!userBooking){
      return res.json({reply:`Hello! Please select a language: ${supportedLanguages.join(', ')}`, quickReplies:supportedLanguages});
    }

    const lang = userBooking.data.language;
    const langMsgs = messages[lang] || messages['English'];

    switch(userBooking.step){
      case 1:
        userBooking.data.name = message.trim();
        userBooking.step++;
        return res.json({reply: langMsgs.askTickets, quickReplies:Array.from({length:maxTickets},(_,i)=>(i+1).toString())});

      case 2:
        const ticketCount = parseInt(message);
        if(isNaN(ticketCount)||ticketCount<=0||ticketCount>maxTickets)
          return res.json({reply: langMsgs.invalidTickets, quickReplies:Array.from({length:maxTickets},(_,i)=>(i+1).toString())});
        userBooking.data.tickets = ticketCount;
        userBooking.step++;
        return res.json({reply: langMsgs.askDate, quickReplies:["2025-12-25","2026-01-01","2026-05-15"]});

      case 3:
        if(!isValidDate(message)) return res.json({reply: langMsgs.invalidDate, quickReplies:["2025-12-25","2026-01-01","2026-05-15"]});
        userBooking.data.date = message;
        userBooking.step++;
        return res.json({reply: langMsgs.askPlace, quickReplies:["Delhi","Kerala"]});

      case 4:
        if(!["Delhi","Kerala"].includes(message)) return res.json({reply: langMsgs.askPlace, quickReplies:["Delhi","Kerala"]});
        userBooking.data.visitPlace = message;
        userBooking.step++;
        if(message==="Delhi"){
          return res.json({reply:"Please select a tour option:", quickReplies: langMsgs.tourOptions});
        }else{
          userBooking.step = 99;
          return res.json({reply: langMsgs.confirmBooking(userBooking.data.name,userBooking.data.tickets,userBooking.data.date,message), quickReplies:["YES","NO"]});
        }

      case 5:
        if(!langMsgs.tourOptions.includes(message))
          return res.json({reply:"Please select a valid tour option.", quickReplies: langMsgs.tourOptions});
        userBooking.step = 99;
        return res.json({reply:`You selected "${message}". Book your ticket here: ${langMsgs.bookLink}`, quickReplies:["Cancel my booking","New booking"]});

      case 99:
        if(message.toLowerCase().includes("cancel")){
          bookings = bookings.filter(b=>b.userId!==userId);
          return res.json({reply:`Cancel your ticket here: ${langMsgs.cancelLink}`, quickReplies: supportedLanguages});
        }else if(message.toLowerCase().includes("new")){
          bookings = bookings.filter(b=>b.userId!==userId);
          return res.json({reply:"Starting new booking...", quickReplies: supportedLanguages});
        }else{
          return res.json({reply: langMsgs.howCanIHelp, quickReplies: supportedLanguages});
        }

      default:
        bookings = bookings.filter(b=>b.userId!==userId);
        return res.json({reply: langMsgs.howCanIHelp, quickReplies: supportedLanguages});
    }

  }catch(err){
    console.error(err);
    return res.status(500).json({reply:"Something went wrong.", quickReplies:[]});
  }
});

const PORT = 3000;
app.listen(PORT, ()=>console.log(`🚀 Backend is running! Use POST /chat for chatbot messages.`));
