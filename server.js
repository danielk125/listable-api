const express = require('express');
const userRoutes = require('./routes/users.js');
const listRoutes = require('./routes/lists.js');
const cors = require('cors');

require('dotenv').config();
console.log(process.env.PORT)
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());  

app.use('/users', userRoutes); // routes starting in /users should use userRoutes routing file
app.use('/lists', listRoutes); // same logic ^^^^

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});