const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const url = 'mongodb://localhost:27017';

const dbName = 'mydatabase';

const collectionName = 'events';


const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });


app.listen(3000, () => {
  console.log('Server started on port 3000');
});

client.connect((url)).then(() => {
  console.log("success");

}).catch(() => {
  console.log("no conn");
});

const db = client.db(dbName);


async function collectionCreate() {
  try {
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some((c) => c.name === collectionName);
    if (!collectionExists) {
      db.createCollection(collectionName, (err, result) => {
        if (err) {
          console.error('Error creating collection:', err);
          return;
        }
        console.log('Collection created:', collectionName);
      });
    } else {
      console.log('Collection already exists:', collectionName);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

collectionCreate();
const database = client.db(dbName);
const collection = database.collection(collectionName);

app.post('/api/v3/app/events', async (req, res) => {
  try {
    const eventData = req.body;
    console.log(eventData);
    const result = await collection.insertOne(eventData);
    res.status(201).send(result)

  } catch (error) {
    console.error('Error schema not created', error);
    throw error;
  }
})



//  /api/v3/app/events?id=64913f7c2f634899d02ed951
app.get('/api/v3/app/events', async (req, res) => {
  try {
    const eventId = req.query.id;
    console.log(eventId);
    const data = await collection.findOne({ _id: new ObjectId(eventId) })

    if (!data) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Error schema not created', error);
    throw error;
  }
});

// http://localhost:3000/api/v3/app/event?type=latest&limit=5&page=2
app.get('/api/v3/app/event', async (req, res) => {
  try {
    const { type, limit = 5, page = 0 } = req.query;
    console.log(req.query);

    const query = type === 'latest' ? {} : {};
    const skip = (Number(page) - 1) * Number(limit);

    const data = await collection.find(query).skip(skip).limit(Number(limit)).toArray();
    // console.log(data);
    res.json(data);
  } catch (error) {
    console.error('Error retrieving events', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// localhost:3000/api/v3/app/events/_id
app.delete('/api/v3/app/events/:id', async(req, res) => {
  const eventId = req.params.id;
  console.log(eventId);
  const data = await collection.deleteOne({ _id: new ObjectId(String(eventId)) })
  console.log(data.deletedCount);
  if (data.deletedCount) {
    res.send(data)
  }
  else{
    res.send("event not found")
  }
});

// localhost:3000/api/v3/app/events/_id
app.put('/api/v3/app/events/:id', async (req, res) => {
  const eventId = req.params.id;
  const updatedEvent = req.body;
  console.log(eventId,updatedEvent);

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(eventId) },
      { $set: updatedEvent }
    );

    if (result.matchedCount) {
      res.send("Event updated successfully");
    } else {
      res.send("Event not found");
    }
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).send("An error occurred while updating the event");
  }
});


