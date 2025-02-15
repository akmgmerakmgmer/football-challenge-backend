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
const cron = require('node-cron');
const cronController = require('./controllers/cronController.min.js')
const systemController = require('./controllers/systemController.min.js')

// const UglifyJS = require('uglify-js');
// const fs = require('fs');
// const result = UglifyJS.minify(fs.readFileSync('./routes/api.js', 'utf8'));
// fs.writeFileSync('./routes/api.min.js', result.code);

const UglifyJS = require('uglify-js');
const fs = require('fs');
const result = UglifyJS.minify(fs.readFileSync('./controllers/usersController.js', 'utf8'));
fs.writeFileSync('./controllers/usersController.min.js', result.code);

// User.collection.getIndexes().then(res=>{
//     console.log(res)
// })
// User.collection.dropIndex({ "user_points.yearlyPoints.points": -1 })
//Database Connection
const port = process.env.PORT || 4000
const database = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.yyqyr.mongodb.net/?retryWrites=true&w=${process.env.MONGO_DATABASE}`

// cron.schedule('* * * * *', () => {
//     // cronController.get_rankings('daily')
//     systemController.changeSystemInfo()
// });

// 1. Daily at 12 AM
cron.schedule('0 0 * * *', () => {
    cronController.get_rankings('daily')
});

// 2. Weekly on Saturday at 12 AM
cron.schedule('10 0 * * 6', () => {
    cronController.get_rankings('weekly')
});

// 3. Monthly on the 1st day of the month at 12 AM
cron.schedule('20 0 1 * *', () => {
    cronController.get_rankings('monthly')
    systemController.changeSystemInfo()
});

// 4. Yearly on January 1st at 12 AM
cron.schedule('30 0 1 1 *', () => {
    cronController.get_rankings('yearly')
});

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
    socket.on('joinRoom', async ({ userId, questionMode }) => {
        try {
            const player = {
                userId: userId,
            }

            // First attempt: try to find and join an existing room
            let room = await findAndJoinRoom(player);

            // If no existing room found or room was full, create a new one
            if (!room) {
                room = await createNewRoom(player, questionMode);
            }

            const roomId = room._id.toString();
            socket.join(roomId);

            // Emit success since we're guaranteed to have either joined or created a room
            io.to(roomId).emit('joinRoomSuccess', room);

            if (room.players.length === room.numberOfPlayers) {
                setTimeout(() => {
                    io.to(roomId).emit('navigateToGameListener', room);
                }, 5000);
            }
        } catch (e) {
            console.log(`Error ${e}`);
            socket.emit('joinRoomError', { message: 'Failed to join room' });
        }
    });

    // Helper function to find and join an available room
    async function findAndJoinRoom(player) {
        // First, find a joinable room with less than 2 players
        let room = await Room.findOneAndUpdate(
            {
                isJoinable: true,
                'players.1': { $exists: false } // Ensures there's less than 2 players
            },
            {
                isJoinable: false,
                $push: { players: player }
            },
            {
                new: true,
                runValidators: true
            }
        ).populate({
            path: 'players.userId',
            select: 'username selectedAvatar rank',
            populate: {
                path: 'rank',
                select: 'image'
            }
        });
        return room;
    }

    // Helper function to create a new room
    async function createNewRoom(player) {
        const room = new Room();
        const questions_per_room = 50;
        const questions = await Question.aggregate([
            { $sample: { size: questions_per_room } },
            { $limit: questions_per_room },
        ]);
        room.players.push(player);
        room.questions = questions;

        return (await room.save()).populate({
            path: 'players.userId',
            select: 'username selectedAvatar rank',
            populate: {
                path: 'rank',
                select: 'image'
            }
        });
    }
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
    socket.on('leaveRoomEarly', async ({ userId, roomId }) => {
        socket.leave(roomId)
        let room = await Room.findByIdAndUpdate({ _id: roomId }, { isJoinable: true, $pull: { players: { userId: userId } } }, { new: true }).populate({
            path: 'players.userId',
            select: 'username selectedAvatar'
        });
        if (room.players.length) io.to(roomId).emit('leaveRoomEarlyListener', { room: room })
        else room = await Room.findByIdAndDelete({ _id: roomId }, { new: true })
    })
    socket.on('leaveRoom', ({ roomPlayers, roomId, fullRoom }) => {
        socket.leave(roomId)
        io.to(roomId).emit('leaveRoomListener', { roomPlayers, fullRoom })
    })
    socket.on('gameDone', ({ roomId }) => {
        socket.leave(roomId)
    })
    socket.on('disconnect', () => {
        socket.disconnect(true);
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
app.use('/api', require('./routes/api.min.js'));

// Global error handler
app.use((err, req, res, next) => {
    res.status(400).send({ error: err.message || 'server_error' });
});
