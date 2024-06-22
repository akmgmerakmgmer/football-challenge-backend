const Question = require('../models/questionModel')
const { handleErrors } = require('../utilities/handle_errors')

const questionCreation = async (payload, req, res) => {
    await Question.create(payload).then(question => {
    })

}
const create_questions = async (req, res, next) => {
    if (Array.isArray(req.body)) {
        //addValue(res)
        // deleteDuplicates(res)
        for (let i in req.body) {
            if (req.body[i].questionMode === 'trueOrFalse') req.body[i].choices = [{ en: 'Yes', ar: 'نعم', value: 'true' }, { en: "No", ar: "لا", value: 'false' }]
            await questionCreation(req.body[i], req, res)
        }
        res.sendStatus(200)
    } else {
        if (req.body.questionMode === 'passwordChallenge') {
            req.body.question.en = 'Password Challenge'
            req.body.question.ar = 'كلمة السر'
        }
        if (req.body.questionMode === 'guessThePlayer') {
            req.body.question.en = 'Guess The Player'
            req.body.question.ar = 'خمن اللاعب'
        }
        if (req.body.questionMode === 'guessTheTeam') {
            req.body.question.en = 'Guess The Team'
            req.body.question.ar = 'خمن الفريق'
        }
        if (req.body.questionMode === 'trueOrFalse') req.body.choices = [{ en: 'Yes', ar: 'نعم', value: 'true' }, { en: "No", ar: "لا", value: 'false' }]
        await questionCreation(req.body, req, res)
    }
}
const addValue = (res) => {
    Question.find({}).then(async questions => {
        for (let i in questions) {
            if (questions[i].questionMode == 'multipleChoices' && !questions[i].choices[0].value) {
                for (let j in questions[i]['choices']) {
                    questions[i]['choices'][j].value = questions[i]['choices'][j].en
                }
                await Question.findOneAndUpdate({ _id: questions[i]['_id'] }, questions[i]).then(response => {
                })
            }
        }
        res.sendStatus(200)
    })
}
const deleteDuplicates = async (res) => {
    const questionsDeleted = [];
    Question.find({}).then(async questions => {
        for (let i in questions) {
            for (let j in questions) {
                if ((questions[i].questionMode == 'trueOrFalse' || questions[i].questionMode == 'multipleChoices') && questions[i].question.en == questions[j].question.en && i != j && questionsDeleted.indexOf(questions[i].question.en) == -1) {
                    await Question.findByIdAndDelete({ _id: questions[i]._id }).then(question => {
                        questionsDeleted.push(questions[i].question.en)
                        console.log(questions[i].question.en)
                    })
                }
            }

        }
        res.sendStatus(200)
    })
}
const get_admin_questions = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Question.find({ $and: [{ $or: [{ 'question.en': { $regex: req.query.question, $options: "i" } }, { 'question.ar': { $regex: req.query.question, $options: "i" } }] }, { questionMode: { $regex: req.query.questionMode, $options: "i" } }] }).count().then(total_questions => {
        Question.find({ $and: [{ $or: [{ 'question.en': { $regex: req.query.question, $options: "i" } }, { 'question.ar': { $regex: req.query.question, $options: "i" } }] }, { questionMode: { $regex: req.query.questionMode, $options: "i" } }] }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(question => res.status(200).send({ question, total_questions, per_page })).catch(next)
    })
}

const get_questions = (req, res, next) => {
    const page = (req.query.page || 1) - 1;
    const per_page = 20;

    // Calculate the skip value based on the page number and number of documents per page
    const skip = page * per_page;
    const match = { $and: [{ questionMode: { $in: ["trueOrFalse", "multipleChoices"] } }] }
    if (req.query.search) {
        match.$and.push({ $or: [{ 'question.en': { $regex: req.query.search, $options: "i" } }, { 'question.ar': { $regex: req.query.search, $options: "i" } }] })
    }
    Question.aggregate([
        {
            $match: match
        },
        { $skip: skip },                   // Skip based on pagination
        { $sample: { size: per_page } },   // Add this stage to get random questions
        { $limit: per_page }                // Limit based on pagination
    ]).then(async (questions) => {
        const total_questions = await Question.countDocuments()
        res.status(200).send({ questions, total_questions, per_page })
    }).catch((err) => {
        next(err);
    });
}

const get_single_question = (req, res, next) => {
    Question.findById({ _id: req.params.id }).then(question => res.status(200).send(question)).catch(next)
}

const delete_question = (req, res, next) => {
    Question.findByIdAndDelete({ _id: req.params.id }).then(question => {
        res.status(200).send(question)
    }).catch(next)
}

const update_question = (req, res, next) => {
    Question.findByIdAndUpdate({ _id: req.params.id }, req.body).then(question => {
        Question.findOne({ _id: req.params.id }).then(question => res.status(200).send(question))
    }).catch(next)
}

module.exports = { create_questions, get_questions, get_single_question, delete_question, update_question, get_admin_questions }