const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const xssClean = require("xss-clean");
const compression = require("compression");
const { Server } = require('socket.io'); // Correctly import Server
const http = require("http");
const Room = require('./models/roomModel.js');
const User = require('./models/userModel.js');
const Question = require('./models/questionModel.js');
require("dotenv").config();
const server = http.createServer(app);
const io = new Server(server);

// const UglifyJS = require('uglify-js');
// const fs = require('fs');
// const result = UglifyJS.minify(fs.readFileSync('./routes/api.js', 'utf8'));
// fs.writeFileSync('./routes/api.min.js', result.code);

// const UglifyJS = require('uglify-js');
// const fs = require('fs');
// const result = UglifyJS.minify(fs.readFileSync('./controllers/ranksController.js', 'utf8'));
// fs.writeFileSync('./controllers/ranksController.min.js', result.code);

// User.collection.getIndexes().then(res=>{
//     console.log(res)
// })
// User.collection.dropIndex({ "user_points.yearlyPoints.points": -1 })
//Database Connection
const port = process.env.PORT || 4000
const database = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.yyqyr.mongodb.net/?retryWrites=true&w=${process.env.MONGO_DATABASE}`

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
    console.log('A user connected:', socket.id);

    // Listen for messages from the client
    socket.on('joinRoom', async ({ userId }) => {
        try {
            let room = await Room.findOne({ isJoinable: true })
            const player = {
                userId: userId,
            }
            if (room) {
                room.players.push(player)
                if (room.players.length >= 2) room.isJoinable = false
                room = await Room.findByIdAndUpdate({ _id: room._id }, room, { new: true }).populate({
                    path: 'players.userId', // Path to populate
                    select: 'username selectedAvatar'      // Only include the username field
                })
            } else {
                room = new Room()
                const questions_per_room = 10
                const questions = await Question.aggregate([
                    {
                        $match: {}
                    },
                    { $sample: { size: questions_per_room } },
                    { $limit: questions_per_room },
                ])
                room.players.push(player)
                room.questions = questions
                room = await (await room.save()).populate({
                    path: 'players.userId', // Path to populate
                    select: 'username selectedAvatar'      // Only include the username field
                })
            }
            const roomId = room._id.toString()
            socket.join(roomId)
            io.to(roomId).emit('joinRoomSuccess', room)
            if (room.players.length === room.numberOfPlayers) {
                setTimeout(() => {
                    io.to(roomId).emit('navigateToGameListener', true)
                }, 5000)
            }
        } catch (e) {
            console.log(`Error ${e}`)
        }
    });
    socket.on('sendPoints', (emittedData) => {
        const emitData = {
            userId: emittedData.userId,
            points: emittedData.points
        }
        io.to(emittedData.roomId).emit('sendPointsListener', emitData)
    })
    socket.on('timeDone', (emittedData) => {
        io.to(emittedData.roomId).emit('timeDoneListener', { userId: emittedData.userId })
    })
    socket.on('leaveRoom', ({ roomPlayers, roomId, fullRoom }) => {
        socket.leave(roomId)
        io.to(roomId).emit('leaveRoomListener', { roomPlayers, fullRoom })
    })
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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
app.use('/api', require('./routes/api.js'));

// Global error handler
app.use((err, req, res, next) => {
    res.status(400).send({ error: err.message || 'server_error' });
});
