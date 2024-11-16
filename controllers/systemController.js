const Advertisment = require("../models/advertismentModel");
const Challenge = require("../models/challengesModel");
const Event = require("../models/eventsModel");
const moment = require('moment');

const get_advertisments = async () => {
    const advertismentsFetch = await Advertisment.aggregate([{ $sample: { size: 10 } }])
    const bestOffersAds = advertismentsFetch.filter(ad => ad.advertiseAt == 'bestOffers')
    const advertisments = advertismentsFetch.filter(ad => ad.advertiseAt == 'websitePages')
    const videoAds = advertismentsFetch.filter(ad => ad.advertiseAt == 'videoAds')
    return { bestOffersAds, advertisments, videoAds }
}

const get_events = async () => {
    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    const events = await Event.find({ active: true, endDate: { $gt: currentDate } })
    return events
}

const get_challenges = async () => {
    const challengesFetch = await Challenge.aggregate([{ $sample: { size: 30 } }])
    const playersChallenges = challengesFetch.filter(challenge => challenge.type === 'playersChallenge').slice(0, 5)
    const nationalTeamsChallenge = challengesFetch.filter(challenge => challenge.type === 'nationalTeamsChallenge').slice(0, 5)
    const teamsChallenge = challengesFetch.filter(challenge => challenge.type === 'teamsChallenge').slice(0, 5)
    const homeChallenges = challengesFetch.slice(0, 5)
    return { playersChallenges, nationalTeamsChallenge, teamsChallenge, homeChallenges }
}
const inital_fetch = async (req, res, next) => {
    const advertisments = await get_advertisments()
    const events = await get_events()
    const challenges = await get_challenges()
    res.status(200).send({ advertisments, events, challenges, lowestBuildNumber: '25' })
}
module.exports = { inital_fetch }