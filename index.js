const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const xssClean = require("xss-clean");
const compression = require("compression");
const { Server } = require('socket.io');
const http = require("http");
const { initializeScheduledTasks } = require('./controllers/cron/scheduledTasks.min.js');
const socketMethods = require('./controllers/multiplayer/socketMethods.min.js');
require("dotenv").config();

const server = http.createServer(app);
const io = new Server(server);

// const UglifyJS = require('uglify-js');
// const fs = require('fs');
// const result = UglifyJS.minify(fs.readFileSync('./controllers/users/userGame.js', 'utf8'));
// fs.writeFileSync('./controllers/users/userGame.min.js', result.code);

// User.collection.getIndexes().then(res=>{
//     console.log(res)
// })
// User.collection.dropIndex({ "user_points.yearlyPoints.points": -1 })
//Database Connection
const port = process.env.PORT || 4000
const database = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.yqj8bb.mongodb.net/?retryWrites=true&w=${process.env.MONGO_DATABASE}`

// Initialize scheduled tasks
initializeScheduledTasks();

mongoose.connect(database, { writeConcern: { w: 'majority', j: true, wtimeout: 1000 } })
    .then(() => {
        // Start the server
        server.listen(port, () => {
        });
        // Set server timeout to 60 seconds
        server.timeout = 60000;
        server.keepAliveTimeout = 60000;
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });

io.on('connection', (socket) => {
    socket.on('joinRoom', (data) => socketMethods.handleJoinRoom(socket, io, data));
    socket.on('sendPoints', (data) => socketMethods.handleSendPoints(io, data));
    socket.on('leaveRoomEarly', (data) => socketMethods.handleLeaveRoomEarly(socket, io, data));
    socket.on('leaveRoom', (data) => socketMethods.handleLeaveRoom(socket, io, data));
    socket.on('gameDone', (data) => socketMethods.handleGameDone(socket, data));
    socket.on('disconnect', () => {
        socket.disconnect(true);
    });
});

// Middlewares
app.set('trust proxy', 1);
app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Origin'],
    origin: '*',
    exposedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Origin']
}));

// app.use(cors({
//     credentials: true,
//     allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
//     origin: function (origin, callback) {
//         if (origin === 'https://www.inzonegaming.com' || origin === 'https://admin-football.vercel.app' || !origin) {
//             // Allow requests from your website and mobile apps (which may not have an origin header)
//             callback(null, true);
//         } else {
//             // Block other origins
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     exposedHeaders: ['Content-Type', 'Authorization', 'Accept']
// }));

app.use(helmet())
app.use(compression())
app.use(xssClean())
app.use('/images', express.static('images'))
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use('/api', require('./routes/api.min.js'));

// Global error handler
app.use((err, req, res, next) => {
    res.status(400).send({ error: err.message || 'server_error' });
});
