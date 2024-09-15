const express = require('express');
const { ObjectId } = require('mongodb');
const {getDatabase} = require('../connection.js');
const router = express.Router();
const verifyToken = require('../verify.js');

// create new list
router.post('/create/:userId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const listsCollection = db.collection('lists');

        const newList = {
            user_id: req.params.userId,
            title: 'untitled',
            item_ids: [] 
        };

        const result = await listsCollection.insertOne(newList);
        res.status(201).send(result);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to create list' });
    }
});

// create new item in a list
router.post('/:userId/new_item/:listId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const listsCollection = db.collection('lists');
        const itemsCollection = db.collection('items');

        const newItem = {
            title: 'untitled',
            user_id: req.params.userId,
            striked: false,
            description: ''
        }
        const result = await itemsCollection.insertOne(newItem);

        const itemId = result.insertedId;
        await listsCollection.updateOne(
            { user_id: req.params.userId, _id: new ObjectId(req.params.listId) },
            { $push: { item_ids: itemId } }
        );

        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({ error: 'Failed to add item to list' });
    }
});

// get all lists assosiate with a user
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const listsCollection = db.collection('lists');
        const userLists = await listsCollection.find({ user_id: req.params.userId }).toArray();
        res.status(200).send(userLists);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to fetch lists' });
    }
});

// get all items assosiate with a specific list
router.get('/:userId/get_items/:listId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const listsCollection = db.collection('lists');
        const itemsCollection = db.collection('items');

        const list = await listsCollection.findOne({ user_id: req.params.userId, _id: new ObjectId(req.params.listId) });

        if (!list) {
            return res.status(404).send({ error: 'List not found' });
        }

        const items = await itemsCollection.find({ _id: { $in: list.item_ids } }).toArray();

        const listWithItems = { ...list, items };

        res.status(200).send(listWithItems);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch list with items' });
    }
});

// update a list
router.patch('/:userId/update_list/:listId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const listsCollection = db.collection('lists');

        const updates = {
            $set: {
                title: req.body.title
            }
        }

        const result = await listsCollection.updateOne({ user_id: req.params.userId, _id: new ObjectId(req.params.listId)}, updates);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ error: 'Failed to update list' });
    }
})

// update an item in a list
router.patch('/:userId/:listId/update_item/:itemId', async (req, res) => {
    try {
        const db = await getDatabase();
        const itemsCollection = db.collection('items');

        let itemUpdates = {}

        if(req.body.title){
            itemUpdates['title'] = req.body.title;
        }

        if(req.body.hasOwnProperty('striked')){
            itemUpdates['striked'] = req.body.striked;
        }

        if(req.body.description){
            itemUpdates['description'] = req.body.description;
        }

        if(req.body.user_id){
            itemUpdates['user_id'] = req.body.user_id;
        }

        const updates = {
            $set: itemUpdates
        }

        const result = await itemsCollection.updateOne({ _id: new ObjectId(req.params.itemId) }, updates);
        res.status(200).send(result);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to update item' });
    }
})

// delete one item
router.delete('/:userId/:listId/delete_item/:itemId', async (req, res) => {
    try {
        const db = await getDatabase();
        const itemsCollection = db.collection('items');
        const listsCollection = db.collection('lists')

        const result = await itemsCollection.deleteOne({ _id: new ObjectId(req.params.itemId) });
        await listsCollection.updateOne(
            { user_id: req.params.userId, _id: new ObjectId(req.params.listId) },
            { $pull: { item_ids: new ObjectId(req.params.itemId) } }
        );
        res.status(200).send({ message: 'Item removed successfully' })
    } catch (error) {
        res.status(500).send({ error: 'Failed to delete item' })
    }
})

// delete one list
router.delete('/:userId/delete_list/:listId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const listsCollection = db.collection('lists');
        const itemsCollection = db.collection('items');

        const list = await listsCollection.findOne({ user_id: req.params.userId, _id: new ObjectId(req.params.listId) });

        if (!list) {
            return res.status(404).send({ error: 'List not found' });
        }

        const result1 = await itemsCollection.deleteMany({ _id: { $in: list.item_ids } });
        const result2 = await listsCollection.deleteOne({ user_id: req.params.userId, _id: new ObjectId(req.params.listId) });
        res.status(200).send({ message: 'List removed successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to delete list' });
    }
})

module.exports = router;