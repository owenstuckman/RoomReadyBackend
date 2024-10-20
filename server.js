import express from 'express';

import { createClient } from '@supabase/supabase-js'
import * as deepl from 'deepl-node';
import cors from 'cors';
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
// Create a single supabase client for interacting with your database
const supabase = createClient('https://tsewlrukrykkycootlsb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZXdscnVrcnlra3ljb290bHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNjcwNTUsImV4cCI6MjA0NDk0MzA1NX0.DNwdRirUSViojOqOOLHaJ_lW9u2jd1siOxqdmQWz6PU')

const translator = new deepl.Translator(process.env.TRANSLATOR_API_KEY);

const app = express();
const port = 3000;

app.use(express.json());

app.use(cors({
    origin: '*' // Allow requests from any origin (for testing purposes)
  }));
  
// https://developers.deepl.com/docs/resources/supported-languages#target-languages
async function translate(text, sourceLang, targetLang) {

    const result = await translator.translateText(text, sourceLang, targetLang);
    return result.text;
};

// Get a users language
async function getLanguage(user) {
    console.log(user)
    try {
        const { data, error } = await supabase
            .from('Users')
            .select('language') 
            .eq('userid', user);

        if (error) {
            console.log(error);
            return { success: false, error: 'Error retrieving user language' };
        }

        if (data.length === 0) {
            return { success: false, error: 'User not found' };
        }

        return data[0].language;

    } catch (err) {
        console.log(err);
        return { success: false, error: 'Server error' };
    }
}


app.get('/', (req, res) => {
    res.send('Hello, World!');
});


// Takes a message, translates it and then stores it.
app.post('/send_message', async (req, res) => {

    const { senderID, receiverID, message, conversationId } = req.body;
    console.log(req.body)

    const sourceLang = await getLanguage(senderID);
    const targetLang = await getLanguage(receiverID);

    const translatedText = await translate(message, sourceLang, targetLang);

    const { status, error } = await supabase
    .from('Message')
    .insert({ sender : senderID, receiver : receiverID, conversation : conversationId, senderBody : message, receiverBody : translatedText})
    if (error) {
        res.send(error)
        console.log(error)
    }
    else {
        res.sendStatus(status)
    }
})

// Creates a user
app.post('/create-user', async (req, res) => {

    const { firstName, lastName, language } = req.body;

    const { data, error } = await supabase
    .from('Users')
    .insert({firstName : firstName, lastName : lastName, language : language})
    .select()

    if (error) {
        console.log(error)
    }
    
    res.status(200).send(String(data[0].userid));
})

app.get('/test', async (req, res) => {
    

    
});

const example = `{
        'date': 'October 22 2024, Tuesday',
        'events': [
          {'time': '9:00AM', 'description': 'Breakfast at La Grande Boucherie'},
          {'time': '10:00AM', 'description': 'Walk at Central Park'},
          {'time': '12:00PM', 'description': 'Lunch at The Modern'},
          {'time': '1:00PM', 'description': 'Go to MoMa'},
          {'time': '5:30PM', 'description': 'Go to Manhattan Art & Antiques Center'},
          {'time': '7:00PM', 'description': 'Dinner at Ellen’s Stardust Diner'},
        ]
      },
      {
        'date': 'October 23 2024, Wednesday',
        'events': [
          {'time': '9:00AM', 'description': 'Breakfast at Levain Bakery'},
          {'time': '10:00AM', 'description': 'Go to The Metropolitan Museum of Art'},
          {'time': '12:00PM', 'description': 'Lunch at The MET Dining Room'},
          {'time': '3:00PM', 'description': 'Visit Michael Werner Gallery'},
          {'time': '6:00PM', 'description': 'Walk at 5th Avenue'},
          {'time': '7:00PM', 'description': 'Dinner at The Penrose Bar'},
        ]
      },
      {

          'date': 'October 23 2024, Wednesday',
        'events': [
          {'time': '9:00AM', 'description': 'Breakfast at Levain Bakery'},
          {'time': '10:00AM', 'description': 'Go to The Metropolitan Museum of Art'},
          {'time': '12:00PM', 'description': 'Lunch at The MET Dining Room'},
          {'time': '3:00PM', 'description': 'Visit Michael Werner Gallery'},
          {'time': '6:00PM', 'description': 'Walk at 5th Avenue'},
          {'time': '7:00PM', 'description': 'Dinner at The Penrose Bar'},
        ]
        

      },`
// Takes in a tourist, local and location. 
// Creates a conversation between them.
// Returns the conversationID.
app.post('/generate-itinerary', async (req, res) => {
    try {
        console.log(req.body);
      const { location, minBudget, maxBudget, selectedInterests, _selectedStartDay, _selectedEndDay } = req.body;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: {"type" : "json_object"},
        messages: [
          {
              role: 'system',
              content: [
                  { type: 'text', text: 'You are a travel planner'}
              ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `
        I want to create an itinerary for a trip to ${location} starting from ${_selectedStartDay} to ${_selectedEndDay}. 
        My budget is between ${minBudget} and ${maxBudget} dollars. 
        My interests include ${selectedInterests.join(', ')}. 
        Can you suggest a detailed day-by-day itinerary including time slots for each event?

        Also, please suggest a list of items I should bring on the trip based on the destination and activities.
        return in a JSON format. Here is an examople ${example} make it in this format`,
              },
            ],
          },
        ],
      });
  
      res.json({ result: JSON.parse(response.choices[0].message.content) });
    } catch (error) {
      console.error('Error analyzing ingredients:', error);
      res.status(500).json({ error: 'Failed to analyze ingredients' });
    }
  });



// Helper function to parse the GPT response into a structured format
function parseItinerary(gptResponse) {
    // Here, we assume that the GPT response is in a format that can be split and parsed into a structured itinerary and items
    const itinerary = {};
    const itemsToBring = [];

    const days = gptResponse.split('Day');
    
    days.forEach(day => {
        if (day.trim()) {
            const lines = day.trim().split('\n');
            const dayKey = lines[0].trim();
            itinerary[dayKey] = [];

            lines.slice(1).forEach(line => {
                const [time, event] = line.split(':');
                if (time && event) {
                    itinerary[dayKey].push({ time: time.trim(), event: event.trim() });
                }
            });
        }
    });

    // Extracting stuff to bring from GPT response (assuming it's formatted correctly)
    const bringSection = gptResponse.split('Stuff to bring:')[1];
    if (bringSection) {
        itemsToBring.push(...bringSection.split('\n').map(item => item.trim()).filter(item => item));
    }

    return {
        itinerary,
        stuffToBring: itemsToBring
    };
}


//FIX ME

app.post('/get_conversations', async (req, res) => {
    const { userid } = req.body; 
    console.log(userid)
    try {
        const { data: conversations, error: convError } = await supabase
            .from('Conversations')
            .select('conversationID')
            .or(`tourist.eq.${userid},local.eq.${userid}`);

        if (convError) {
            console.log(convError);
            res.status(500).send('Error retrieving conversations');
            return;
        }

        if (conversations.length === 0) {
            res.status(404).send('No conversations found for this user');
            return;
        }

        res.status(200).json(conversations);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
});



// Takes a conversationID
// Returns a list of messages in oder that they were orignially sent
app.post('/get_messages', async (req, res) => {
    const { conversationID } = req.body;
    try {
        const { data, error } = await supabase
            .from('Message')
            .select('*')
            .eq('conversation', conversationID)
            .order('created_at', { ascending: true })

        if (error) {
            console.log(error);
            res.status(500).send('Error retrieving conversation');
            return;
        }

        if (data.length === 0) {
            res.status(404).send('No messages found for this conversation');
            return;
        }

        res.status(200).json(data);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
});


app.post('/create_itenerary', async (req, res) => {

    const { userId, location, minBudget, maxBudget, startDate, endDate } = req.body

})



app.listen(port, () => {
    console.log(`Server running at Port: ${port}`);
});