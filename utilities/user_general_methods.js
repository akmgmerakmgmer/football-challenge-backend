const User = require("../models/userModel")

const getUser = (userId, updatedUser, res, next, responseObject = false) => {
    User.findByIdAndUpdate(
        { _id: userId }, 
        updatedUser, 
        { new: true } // Ensure you get the updated document
    )
    .populate('perks.id')
    .populate('rank')
    .populate('system_info')
    .populate({ path: 'prev_seasons_ranks', select: 'image title' })
    .populate('season_results.results')
    .populate({ path: 'season_results.results.player', select: 'username selectedAvatar' })
    .then(user => responseObject ? res.status(200).send({ user }) : res.status(200).send(user)) // FIXED
    .catch(next);
}

const findUser = async (userId) => {
    const user = await User.findById({ _id: userId }).populate('perks.id').populate('rank').populate('system_info').populate({
        path: 'prev_seasons_ranks',
        select: 'image title',
    }).populate('season_results.results').populate({
        path: 'season_results.results.player',
        select: 'username selectedAvatar',
    })
    return user
}

const updateAndGetUser = async (userId, updatedUser) => {
    const user = await User.findByIdAndUpdate({ _id: userId }, updatedUser, { new: true }).populate('perks.id').populate('rank').populate('system_info').populate({
        path: 'prev_seasons_ranks',
        select: 'image title',
    }).populate('season_results.results').populate({
        path: 'season_results.results.player',
        select: 'username selectedAvatar',
    })
    return user
}

module.exports = { getUser, findUser, updateAndGetUser }