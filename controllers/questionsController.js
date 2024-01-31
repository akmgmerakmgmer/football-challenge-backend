const Question = require('../models/questionModel')
const { handleErrors } = require('../utilities/handle_errors')

const questionCreation = async (payload) => {
    await Question.create(payload).then(question => {
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'question'))
    })
}
const create_questions = async (req, res, next) => {
    if (Array.isArray(req.body)) {
        for (let i in req.body) {
            if (req.body[i].questionMode === 'trueOrFalse') req.body[i].choices = [{ en: 'Yes', ar: 'نعم', value: 'true' }, { en: "No", ar: "لا", value: 'false' }]
            await questionCreation(req.body[i])
        }
    } else {
        if (req.body.questionMode === 'trueOrFalse') req.body.choices = [{ en: 'Yes', ar: 'نعم', value: 'true' }, { en: "No", ar: "لا", value: 'false' }]
        await questionCreation(req.body)
    }
    res.sendStatus(200)
}

const get_admin_questions = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 16
    Question.find({ $or: [{ 'question.en': { $regex: req.query.question, $options: "i" } }, { 'question.ar': { $regex: req.query.question, $options: "i" } }] }).count().then(total_questions => {
        Question.find({ $or: [{ 'question.en': { $regex: req.query.question, $options: "i" } }, { 'question.ar': { $regex: req.query.question, $options: "i" } }] }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(question => res.status(200).send({ question, total_questions, per_page })).catch(next)
    })
}

const get_questions = (req, res, next) => {
    const page = (req.query.page || 1) - 1;
    const per_page = 20;

    // Calculate the skip value based on the page number and number of documents per page
    const skip = page * per_page;

    Question.aggregate([
        { $skip: skip },                   // Skip based on pagination
        { $sample: { size: per_page } },   // Add this stage to get random questions
        { $limit: per_page }                // Limit based on pagination
    ]).then((questions) => {
        return Question.countDocuments().then((total_questions) => {
            res.status(200).send({ questions, total_questions, per_page });
        });
    }).catch((err) => {
        next(err);
    });


}

const get_single_question = (req, res, next) => {
    Question.findById({ _id: req.params.id }).then(question => res.status(200).send(question)).catch(next)
}

const delete_question = (req, res, next) => {
    Question.findByIdAndRemove({ _id: req.params.id }).then(question => {
        res.status(200).send(question)
    }).catch(next)
}

const update_question = (req, res, next) => {
    Question.findByIdAndUpdate({ _id: req.params.id }, req.body).then(question => {
        Question.findOne({ _id: req.params.id }).then(question => res.status(200).send(question))
    }).catch(next)
}

module.exports = { create_questions, get_questions, get_single_question, delete_question, update_question, get_admin_questions }