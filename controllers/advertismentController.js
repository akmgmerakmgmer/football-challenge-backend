const Advertisment = require('../models/advertismentModel')
const { handleErrors } = require('../utilities/handle_errors')

const create_advertisment = async (req, res, next) => {
    Advertisment.findOne({ priority: req.body.priority, status: 'active', advertiseAt: req.body.advertiseAt }).then(advertisment => {
        Advertisment.create(req.body).then(advertisment => {
            res.status(200).send(advertisment)
        }).catch(err => {
            res.status(422).send(handleErrors(err, req, 'advertisment'))
        })
    })

}

const get_advertisment = (req, res, next) => {
    const page = (req.query.page || 1) - 1;
    const per_page = 100;

    // Calculate the skip value based on the page number and number of documents per page
    const skip = page * per_page;

    Advertisment.aggregate([
        // {
        //     $match: {
        //         advertiseAt: 'gamePage'
        //     }
        // },
        { $skip: skip },                   // Skip based on pagination
        { $sample: { size: per_page } },   // Add this stage to get random questions
        { $limit: per_page }                // Limit based on pagination
    ]).then(async (advertisments) => {
        const total_advertisments = await Advertisment.countDocuments()
        const bestOffersAds = advertisments.filter(ad => ad.advertiseAt == 'bestOffers')
        const realAds = advertisments.filter(ad => ad.advertiseAt == 'websitePages')
        const videoAds = advertisments.filter(ad => ad.advertiseAt == 'videoAds')
        res.status(200).send({ advertisments: realAds, bestOffers: bestOffersAds, videoAds: videoAds, total_advertisments, per_page })
    }).catch((err) => {
        next(err);
    });
}

const get_admin_advertisments = (req, res, next) => {
    Advertisment.find({ 'company': { $regex: req.query.company, $options: "i" } }).then(async (advertisments) => {
        res.status(200).send({ advertisments })
    }).catch((err) => {
        next(err);
    });
}

const get_single_advertisment = (req, res, next) => {
    Advertisment.findById({ _id: req.params.id }).then(advertisment => res.status(200).send(advertisment)).catch(next)
}

const delete_advertisment = (req, res, next) => {
    Advertisment.findByIdAndDelete({ _id: req.params.id }).then(advertisment => {
        res.status(200).send(advertisment)
    }).catch(next)
}

const update_advertisment = (req, res, next) => {
    Advertisment.findByIdAndUpdate({ _id: req.params.id }, req.body).then(advertisment => {
        Advertisment.findOne({ _id: req.params.id }).then(advertisment => res.status(200).send(advertisment))
    }).catch(next)
}

const ad_clicked = (req, res, next) => {
    Advertisment.findByIdAndUpdate({ _id: req.params.id }, { $inc: { clicks: 1 } }).then(advertisment => res.status(200).send(advertisment)).catch(next)
}

module.exports = { create_advertisment, get_advertisment, get_single_advertisment, delete_advertisment, update_advertisment, ad_clicked, get_admin_advertisments }