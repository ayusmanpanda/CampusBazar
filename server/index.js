require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { setupSocket } = require('./socket');
const { startCronJobs } = require('./jobs');
const { errorHandler, notFound } = require('./middleware/error');

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true, service: 'campusbazaar-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true }
});
setupSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    startCronJobs();
    server.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
  } catch (err) {
    console.error('[server] failed to start', err);
    process.exit(1);
  }
})();
