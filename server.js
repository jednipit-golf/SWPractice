const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const sanitizeMiddleware = require('./middleware/sanitizeMiddleware');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const limiter = require('./middleware/rateLimiter');
const hpp = require('hpp');
const cors = require('cors');

//Route files
const authRouthes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

//Load env vars
dotenv.config({ path: './config/config.env' });

//Connect to Database
connectDB();

const app = express();

//body parser
app.use(express.json());

//Cookie parser
app.use(cookieParser());

//Sanitize data
app.use(sanitizeMiddleware);

//Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

// Apply rate limiter 
app.use(limiter);

//Prevent http param pollutions
app.use(hpp());

//Enable CORS
app.use(cors());

app.use('/api/v1/auth/', authRouthes);
app.use('/api/v1/reservation/', reservationRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unhandled promise rejections 
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process 
    server.close(() => process.exit(1));
});