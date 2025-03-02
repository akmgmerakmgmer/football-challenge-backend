const Advertisment = require("../models/advertismentModel");
const Challenge = require("../models/challengesModel");
const Event = require("../models/eventsModel");
const moment = require('moment');
const System = require("../models/systemModel");

const get_advertisments = async () => {
    const advertismentsFetch = await Advertisment.aggregate([{ $sample: { size: 10 } }])
    const bestOffersAds = advertismentsFetch.filter(ad => ad.advertiseAt == 'bestOffers')
    const advertisments = advertismentsFetch.filter(ad => ad.advertiseAt == 'websitePages')
    const videoAds = advertismentsFetch.filter(ad => ad.advertiseAt == 'videoAds')
    return { bestOffersAds, advertisments, videoAds }
}

const get_events = async () => {
    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    const events = await Event.find({ active: true, endDate: { $gte: currentDate } }).lean()
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
const get_system = async () => {
    const system = await System.find({})
    return system[0]
}
const inital_fetch = async (req, res, next) => {
    const advertisments = await get_advertisments()
    const events = await get_events()
    const challenges = await get_challenges()
    const system = await get_system()
    res.status(200).send({ advertisments, events, challenges, system })
}

const initiateSystem = async (req, res, next) => {
    const system = await System.find({})
    if (!system.length) {
        const payload = {
            current_season: {
                title: {
                    en: 'Season 1',
                    ar: 'الموسم 1'
                },
                endDate: '11-1-2025'
            }
        }
        System.create(payload).then(res => {
            return res.status(200).send(res)
        })
    }
    return res.status(200)
}



function getLastDayOfNextMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const year = lastDay.getFullYear();
    const month = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const changeSystemInfo = async () => {
    let system = await System.find({})
    system = system[0]
    const englishNameSplit = system.current_season.title.en.split(' ')
    const arabicNameSplit = system.current_season.title.ar.split(' ')
    const newNumber = parseInt(englishNameSplit[1]) + 1
    system.current_season.title.en = `${englishNameSplit[0]} ${newNumber}`
    system.current_season.title.ar = `${arabicNameSplit[0]} ${newNumber}`
    system.current_season.endDate = getLastDayOfNextMonth()
    console.log(system,'dsadsadasdasdasdasdasdasdas')
    system = await System.findByIdAndUpdate({ _id: system._id }, system, { new: true })
    return system
}
module.exports = { inital_fetch, initiateSystem, changeSystemInfo }