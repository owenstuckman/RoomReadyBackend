import express from 'express';
import { db } from './lib/firebase.js';
import { runTransaction, doc } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';


const app = express();
const port = 3000;

app.use(express.json());

const counterRef = doc(db, 'Test', 'cnRYVdFslzEtWdl8LRPY');

app.get('/', (req, res) => {
    res.send('Hello, World!');
});


app.post('/send_message', async (req, res) => {
    const { senderID, recieverID, message, time } = req.body;

    try {
        await runTransaction(db, async (transaction) => {
            const docSnapshot = await transaction.get(counterRef);
            if (!docSnapshot.exists()) {
                throw new Error("Document does not exist!");
            }
            const newValue = (docSnapshot.data().value || 0) + 1;
            transaction.update(counterRef, { value: newValue });
        });
        console.log("Transaction successfully committed!");
    } catch (error) {
        console.error("Transaction failed: ", error);
    }

})

app.get('/test', async (req, res) => {
    try {
        await runTransaction(db, async (transaction) => {
            const docSnapshot = await transaction.get(counterRef);
            if (!docSnapshot.exists()) {
                throw new Error("Document does not exist!");
            }
            const newValue = docSnapshot.data().Sample || "doesn't work";
            res.send(newValue);
        });
        console.log("Transaction successfully committed!");
    } catch (error) {
        console.error("Transaction failed: ", error);
        res.status(500).send("Transaction failed");
    }
});


app.get('/message_history', async (req, res) => {
    const { userId } = req.body
})

app.get('/create_itenerary', async (req, res) => {

    const { userId } = req.body

})



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});