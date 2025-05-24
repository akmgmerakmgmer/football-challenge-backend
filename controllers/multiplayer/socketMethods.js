const Room = require('../../models/roomModel');
const Question = require('../../models/questionModel');
const crypto = require('crypto');

async function findAndJoinRoom(player, code, isCasual, questionMode) {
    let filter = {
        isJoinable: true,
        isCasual: isCasual,
        'players.1': { $exists: false },
    };

    if (code) {
        filter.code = code;
    } else {
        filter.questionMode = questionMode;
    }

    let room = await Room.findOneAndUpdate(
        filter,
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

function generateRandomNumbers() {
    return Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
}

async function createNewRoom(player, questionMode, hostRoom, isCasual) {
    let code = hostRoom ? generateRandomNumbers() : '';
    if (hostRoom) {
        let roomExistantBefore = false;
        while (!roomExistantBefore) {
            const hostRoomAvail = await Room.findOne({ code: code, questionMode: questionMode });
            if (!hostRoomAvail) roomExistantBefore = true;
        }
    }
    const room = new Room({ code: code, isCasual: isCasual, questionMode: questionMode });
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
    return (await room.save()).populate({
        path: 'players.userId',
        select: 'username selectedAvatar rank',
        populate: {
            path: 'rank',
            select: 'image'
        }
    });
}

async function handleJoinRoom(socket, io, { userId, questionMode = "", coinsPayed = false, code = "", hostRoom = false, isCasual = false }) {
    try {
        const player = {
            userId: userId,
        };

        let room;
        if (!hostRoom) {
            room = await findAndJoinRoom(player, code, isCasual, questionMode);
        }

        if (!room) {
            if (code) return socket.emit('joinRoomError', { message: { en: "Match code doesn't exist", ar: "لا توجد مباراة بهذا الرقم السري" } });
            room = await createNewRoom(player, questionMode, hostRoom, isCasual);
        }

        const roomId = room._id.toString();
        socket.join(roomId);

        io.to(roomId).emit('joinRoomSuccess', { room: room, coinsPayed: coinsPayed });

        if (room.players.length === room.numberOfPlayers) {
            setTimeout(() => {
                io.to(roomId).emit('navigateToGameListener', room);
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
    
    if (room.players.length) {
        io.to(roomId).emit('leaveRoomEarlyListener', { room: room });
    } else {
        room = await Room.findByIdAndDelete({ _id: roomId }, { new: true });
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

function handleTimeDone(io, { userId, roomId }) {
    io.to(roomId).emit('timeDoneListener', { userId });
}

module.exports = {
    handleJoinRoom,
    handleLeaveRoomEarly,
    handleLeaveRoom,
    handleGameDone,
    handleSendPoints,
    handleTimeDone
}; 