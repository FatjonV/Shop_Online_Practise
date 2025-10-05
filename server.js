require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const errorController = require('./controllers/error');
const User = require('./models/user');

// ✅ Encode password for special characters
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = encodeURIComponent(process.env.MONGO_PASSWORD);
const MONGO_DEFAULT_DATABASE = process.env.MONGO_DEFAULT_DATABASE;

// ✅ MongoDB Atlas URI (single +srv)
const MONGO_URI = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.lfy2m4e.mongodb.net/${MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

// ✅ Express app
const app = express();

// ✅ MongoDB session store
const store = new MongoDBStore({
  uri: MONGO_URI,       // Use same URI as Mongoose
  collection: 'sessions'
});

store.on('error', function(error) {
  console.error('Session store error:', error);
});

// ✅ CSRF protection
const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

// ✅ Multer setup
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imageDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const safeTimestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, safeTimestamp + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
  cb(null, allowedTypes.includes(file.mimetype));
};

// ✅ View engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// ✅ Routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
   { flags: 'a' }
  );

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// ✅ Session
app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store
}));

// ✅ CSRF & flash
app.use(csrfProtection);
app.use(flash());

// ✅ Attach user to req.user
app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) return next();
      req.user = user;
      console.log(' req.user loaded from session:', user.email);
      next();
    })
    .catch(err => next(new Error(err)));
});

// ✅ Set res.locals for templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn || false;
  res.locals.csrfToken = req.csrfToken();
  res.locals.path = req.url;
  next();
});

// ✅ Routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// ✅ Error handling
app.get('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER HIT');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  const isAuth = req.session ? req.session.isLoggedIn : false;
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: isAuth
  });
});

// ✅ Test route
app.get('/test', (req, res) => {
  res.send('Test route is working!');
});

// ✅ Connect to MongoDB Atlas and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Connected to MongoDB Atlas');
    // https
    // .createServer({key: privateKey, cert: certificate}, app)
    //.listen(process.env.PORT || 4000);
    app.listen(process.env.PORT || 4000);
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err);
  });

  