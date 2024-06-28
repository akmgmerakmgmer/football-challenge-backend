const Challenge = require('../models/challengesModel')
const { handleErrors } = require('../utilities/handle_errors')

const create_challenge = async (req, res, next) => {
    Challenge.create(req.body).then(challenge => {
        res.status(200).send(challenge)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'challenge'))
    })
}

const get_challenges = (req, res, next) => {
    const page = (req.query.page || 1) - 1;
    const per_page = 40;

    // Calculate the skip value based on the page number and number of documents per page
    const skip = page * per_page;

    Challenge.aggregate([
        { $skip: skip },                   // Skip based on pagination
        { $sample: { size: per_page } },   // Add this stage to get random challenges
        { $limit: per_page }                // Limit based on pagination
    ]).then(async (challenges) => {
        const total_challenges = await Challenge.countDocuments()
        const playersChallenges = challenges.filter(challenge => challenge.type === 'playersChallenge').slice(0, 5)
        const nationalTeamsChallenge = challenges.filter(challenge => challenge.type === 'nationalTeamsChallenge').slice(0, 5)
        const teamsChallenge = challenges.filter(challenge => challenge.type === 'teamsChallenge').slice(0, 5)
        res.status(200).send({ nationalTeamsChallenge, teamsChallenge, playersChallenges, total_challenges, per_page })
    }).catch((err) => {
        next(err);
    });
}

const get_admin_challenges = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Challenge.find({ $and: [{ $or: [{ nameEn: { $regex: req.query.name, $options: "i" } }, { nameAr: { $regex: req.query.name, $options: "i" } }] }] }).count().then(total_challenges => {
        Challenge.find({ $and: [{ $or: [{ nameEn: { $regex: req.query.name, $options: "i" } }, { nameAr: { $regex: req.query.name, $options: "i" } }] }] }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(challenge => res.status(200).send({ challenge, total_challenges, per_page })).catch(next)
    })
}

const get_single_challenge = (req, res, next) => {
    Challenge.findById({ _id: req.params.id }).then(challenge => res.status(200).send(challenge)).catch(next)
}

const delete_challenge = (req, res, next) => {
    Challenge.findByIdAndDelete({ _id: req.params.id }).then(challenge => {
        res.status(200).send(challenge)
    }).catch(next)
}

const update_challenge = (req, res, next) => {
    Challenge.findByIdAndUpdate({ _id: req.params.id }, req.body).then(challenge => {
        Challenge.findOne({ _id: req.params.id }).then(challenge => res.status(200).send(challenge))
    }).catch(next)

}


module.exports = { create_challenge, get_challenges, get_single_challenge, delete_challenge, update_challenge, get_admin_challenges }