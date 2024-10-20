import express from 'express';

import { createClient } from '@supabase/supabase-js'
import * as deepl from 'deepl-node';

// Create a single supabase client for interacting with your database
const supabase = createClient('https://tsewlrukrykkycootlsb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZXdscnVrcnlra3ljb290bHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNjcwNTUsImV4cCI6MjA0NDk0MzA1NX0.DNwdRirUSViojOqOOLHaJ_lW9u2jd1siOxqdmQWz6PU')

const translator = new deepl.Translator(process.env.TRANSLATOR_API_KEY);

const app = express();
const port = 3000;

app.use(express.json());

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
    .insert({firstNmae : firstName, lastName : lastName, language : language})
    .select()

    if (error) {
        console.log(error)
    }
    
    res.status(200).send(String(data[0].userid));
})

app.get('/test', async (req, res) => {
    

    
});

// Takes in a tourist, local and location. 
// Creates a conversation between them.
// Returns the conversationID.
app.post('/create_conversations', async (req, res) => {
    const { touristID, localID, location } = req.body

    const { data, error } = await supabase
    .from('Conversations')
    .insert({location: location, tourist : touristID, local : localID})
    .select()

    if (error) {
        console.log(error)
    }
    
    res.status(200).send(String(data[0].conversationID));

})

//FIX ME

app.get('/get_conversations', async (req, res) => {
    const { userid } = req.body; 

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

        const conversationIDs = conversations.map(conv => conv.conversationID);

        const { data: recentMessages, error: msgError } = await supabase
            .from('Message')
            .select('conversation, sender, receiver, senderBody, receiverBody, created_at')
            .in('conversation', conversationIDs) // Get messages for all user's conversations
            .order('created_at', { ascending: false }) // Order by latest message time
            .filter('conversation', 'in', `(${conversationIDs.join(',')})`) // Fetch all messages in user's conversations
            .limit(1, { partitionBy: 'conversation' }); // Get only the latest message per conversation

        if (msgError) {
            console.log(msgError);
            res.status(500).send('Error retrieving recent messages');
            return;
        }

        res.status(200).json(recentMessages);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
});



// Takes a conversationID
// Returns a list of messages in oder that they were orignially sent
app.get('/get_messages', async (req, res) => {
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




app.get('/create_itenerary', async (req, res) => {

    const { userId, location, minBudget, maxBudget, startDate, endDate } = req.body

})



app.listen(port, () => {
    console.log(`Server running at Port: ${port}`);
});