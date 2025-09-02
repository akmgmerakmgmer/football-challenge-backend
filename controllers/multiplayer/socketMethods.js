const Room = require('../../models/roomModel');
const Question = require('../../models/questionModel');
const crypto = require('crypto');
const cron = require('node-cron');

async function findAndJoinRoom(player, code, isCasual, questionMode, numberOfPlayers, gameDuration) {
    let filter = {
        isJoinable: true,
        isCasual: isCasual,
        gameDuration: gameDuration
    };

    if (code) filter.code = code;
    if (questionMode && !code) filter.questionMode = questionMode;
    if (numberOfPlayers && !code) filter.numberOfPlayers = numberOfPlayers;

    // Find a room that is joinable and not full
    let room = await Room.findOne(filter);

    // Check if the room exists and has space
    if (room && room.players.length < room.numberOfPlayers) {
        room.isJoinable = room.players.length + 1 < room.numberOfPlayers;
        room.players.push(player);
        await room.save();
        room = await Room.findById(room._id).populate({
            path: 'players.userId',
            select: 'username selectedAvatar rank',
            populate: {
                path: 'rank',
                select: 'image'
            }
        });
        return room;
    }

    // No available room found
    return null;
}

function generateRandomNumbers() {
    return Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
}

function deleteRoom(gameDuration, id) {
    const totalMinutes = Number(gameDuration) + 10;
    const delayMs = totalMinutes * 60 * 1000;
    setTimeout(async () => {
        await Room.findByIdAndDelete(id);
        console.log(`Room ${id} deleted after ${totalMinutes} minutes`);
    }, delayMs);
}

async function createNewRoom(player, questionMode, hostRoom, isCasual, numberOfPlayers, gameDuration) {
    let code = hostRoom ? generateRandomNumbers() : '';
    if (hostRoom) {
        let roomExistantBefore = false;
        while (!roomExistantBefore) {
            const hostRoomAvail = await Room.findOne({ code: code, questionMode: questionMode, numberOfPlayers: numberOfPlayers });
            if (!hostRoomAvail) roomExistantBefore = true;
        }
    }
    const room = new Room({ code, isCasual, questionMode, numberOfPlayers, gameDuration });
    const questions_per_room = 50;
    const pipeline = [];
    if (questionMode) {
        pipeline.push({ $match: { questionMode } });
    }

    pipeline.push(
        { $sample: { size: questions_per_room } },
        { $limit: questions_per_room }
    );
    const questions = await Question.aggregate(pipeline);
    for (let i in questions) {
        if (questions[i].questionMode === 'reversedWords') {
            questions[i].answer.en = crypto.createHash('sha256').update(questions[i].answer.en.toLowerCase()).digest('hex');
            questions[i].answer.ar = crypto.createHash('sha256').update(questions[i].answer.ar).digest('hex');
        } else {
            questions[i].answer = crypto.createHash('sha256').update(questions[i].answer).digest('hex');
        }
    }
    room.players.push(player);
    room.questions = questions;
    const savedRoom = await room.save();
    deleteRoom(gameDuration, savedRoom._id)


    return savedRoom.populate({
        path: 'players.userId',
        select: 'username selectedAvatar rank',
        populate: {
            path: 'rank',
            select: 'image'
        }
    });
}

async function handleJoinRoom(socket, io, { userId, questionMode = "", coinsPayed = false, code = "", hostRoom = false, isCasual = false, numberOfPlayers = 2, gameDuration = 90 }) {
    try {
        const player = {
            userId: userId,
        };

        let room;
        if (!hostRoom) {
            room = await findAndJoinRoom(player, code, isCasual, questionMode, numberOfPlayers, gameDuration);
        }

        if (!room) {
            if (code) return socket.emit('joinRoomError', { message: { en: "Match code doesn't exist", ar: "لا توجد مباراة بهذا الرقم السري" } });
            room = await createNewRoom(player, questionMode, hostRoom, isCasual, numberOfPlayers, gameDuration);
        }

        const roomId = room._id.toString();
        socket.join(roomId);

        io.to(roomId).emit('joinRoomSuccess', { room: room, coinsPayed: coinsPayed });

        if (room.players.length === room.numberOfPlayers) {
            setTimeout(() => {
                io.to(roomId).emit('navigateToGameListener', room);
                Room.findByIdAndDelete({ _id: roomId }, { new: true }).then(res => { });
                let countdown = gameDuration - 1;
                const intervalId = setInterval(() => {
                    io.to(roomId).emit('gameCountdown', countdown);
                    countdown--;
                    if (countdown < 0) {
                        clearInterval(intervalId);
                    }
                }, 1000);
            }, 5000);
        }
    } catch (e) {
        console.log(`Error ${e}`);
        socket.emit('joinRoomError', { message: 'Failed to join room' });
    }
}

async function handleLeaveRoomEarly(socket, io, { userId, roomId }) {
    socket.leave(roomId);
    let room = await Room.findByIdAndUpdate(
        { _id: roomId },
        { isJoinable: true, $pull: { players: { userId: userId } } },
        { new: true }
    ).populate({
        path: 'players.userId',
        select: 'username selectedAvatar'
    });
    if (!room) {
        return
    }
    if (room.players.length) {
        io.to(roomId).emit('leaveRoomEarlyListener', { room: room });
    } else {
        room = await Room.findByIdAndDelete({ _id: roomId }, { new: true }).then(res => { });
    }
}

function handleLeaveRoom(socket, io, { roomPlayers, roomId, fullRoom }) {
    socket.leave(roomId);
    io.to(roomId).emit('leaveRoomListener', { roomPlayers, fullRoom });
}

function handleGameDone(socket, { roomId }) {
    socket.leave(roomId);
}

function handleSendPoints(io, { userId, points, roomId }) {
    const emitData = { userId, points };
    io.to(roomId).emit('sendPointsListener', emitData);
}

module.exports = {
    handleJoinRoom,
    handleLeaveRoomEarly,
    handleLeaveRoom,
    handleGameDone,
    handleSendPoints,
}; 