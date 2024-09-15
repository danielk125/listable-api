const express = require('express');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../connection');
const argon2 = require('argon2');
const router = express.Router();
const jwt = require('jsonwebtoken');
const verifyToken = require('../verify.js');

require('dotenv').config();

// create a new user
router.post('/', async (req, res) => {
    try {
        const db = await getDatabase();
        const usersCollection = db.collection('users');

        const hashedPassword = await argon2.hash(req.body.password);

        const newUser = {
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email
        }

        const user = await usersCollection.findOne({ email: req.body.email });

        if(user){
            return res.status(400).send({ error: 'Email is already in use' });
        }

        const result = await usersCollection.insertOne(newUser);
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({ error: 'Failed to create user' });
    }
});

// validate user
router.post('/login', async (req, res) => {
    try {
        const db = await getDatabase();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email: req.body.email });

        if(!user){
            return res.status(404).send({ error: 'Email not recognized' });
        }

        const isMatch = await argon2.verify(user.password, req.body.password);
        console.log(isMatch);

        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid password' });
        }

        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN)
        res.status(200).send({ message: 'Login successful', accessToken: accessToken, user: user });
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})

// get one user
router.get('/:userId', async (req, res) => {
    try {
        const db = await getDatabase();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: req.params.userId });
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch user' });
    }
});

// update a user
router.patch('/update_user/:userId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const usersCollection = db.collection('users');

        const updates = {};

        if (req.body.username) {
            updates['username'] = req.body.username;
        }

        if (req.body.password) {
            const hashedPassword = await argon2.hash(req.body.password);
            updates['password'] = hashedPassword;
        }

        if (req.body.email) {
            updates['email'] = req.body.email;
        }

        const userUpdates = {
            $set: updates
        }

        const result = await usersCollection.updateOne({ _id: new ObjectId(req.params.userId) }, userUpdates);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ error: 'Failed to update user' })
    }
})

// delete a user
router.delete('/delete_user/:userId', verifyToken, async (req, res) => {
    try {
        const db = await getDatabase();
        const usersCollection = db.collection('users');
        const listsCollection = db.collection('lists');
        const itemsCollection = db.collection('items');

        const result1 = await usersCollection.deleteOne({ _id: new ObjectId(req.params.userId) });
        const result2 = await listsCollection.deleteMany({ user_id: req.params.userId });
        const result3 = await itemsCollection.deleteMany({ user_id: req.params.userId });
        res.status(200).send({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to remove user' });
    }
})

module.exports = router;
