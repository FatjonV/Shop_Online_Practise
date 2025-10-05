require('dotenv').config();
const mongoose = require('mongoose');

const encodedPassword = encodeURIComponent(process.env.MONGO_PASSWORD);

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${encodedPassword}` +
  `@cluster0.lfy2m4e.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Mongoose connected successfully!'))
  .catch(err => console.log('❌ Mongoose connection error:', err));
