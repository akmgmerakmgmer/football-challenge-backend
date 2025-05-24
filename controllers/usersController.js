const userBasic = require('./users/userBasic.min');
const userPoints = require('./users/userPoints.min');
const userGame = require('./users/userGame.min');
const userPurchases = require('./users/userPurchases.min');
const userEvents = require('./users/userEvents.min');

module.exports = {
    ...userBasic,
    ...userPoints,
    ...userGame,
    ...userPurchases,
    ...userEvents
};