const Player = require('../models/playersModel');
const Question = require('../models/questionModel')
const User = require('../models/userModel')
const { handleErrors } = require('../utilities/handle_errors')
const crypto = require('crypto');
const moment = require('moment');

const questionCreation = async (payload, req, res) => {
    await Question.create(payload).then(question => {
    })

}
const createChoicesQuestions = async (req, res, next, i) => {
    const questionNumber = parseInt(i) + 1
    if (req.body[i].questionMode === 'trueOrFalse') req.body[i].choices = [{ en: 'Yes/True', ar: 'نعم/صح', value: 'true' }, { en: "No/False", ar: "لا/خطأ", value: 'false' }]
    if (req.body[i].question.en === '' || req.body[i].question.ar === '') return res.status(422).send({ message: `Error in question number ${questionNumber}` })
    if (!req.body[i].answer) return res.status(422).send({ message: `No Answer for Question number ${questionNumber}` })
    if (req.body[i].questionMode === 'multipleChoices') {
        if (req.body[i].choices.length != 4) return res.status(422).send({ message: `Error in choices quantity in question number ${questionNumber}}` })
        for (let j in req.body[i].choices) {
            const currentChoice = req.body[i].choices[j]
            if (!currentChoice.en || !currentChoice.ar || !currentChoice.value) {
                return res.status(422).send({ message: `Error in choices in question number ${questionNumber}` })
            }
        }
    }
    await questionCreation(req.body[i], req, res)
}
function modifyAnswer(answer) {
    if (answer.includes('ã')) answer = answer.replace('á', 'a')
    if (answer.includes('ã')) answer = answer.replace('ã', 'a')
    if (answer.includes('à')) answer = answer.replace('à', 'a')
    if (answer.includes('é')) answer = answer.replace('é', 'e')
    if (answer.includes('ú')) answer = answer.replace('ú', 'u')
    if (answer.includes('í')) answer = answer.replace('í', 'i')
    if (answer.includes('ó')) answer = answer.replace('ó', 'o')
    if (answer.includes('ö')) answer = answer.replace('ö', 'o')
    if (answer.includes('ü')) answer = answer.replace('ü', 'u')
    if (answer.includes('ñ')) answer = answer.replace('ñ', 'n')
    if (answer.includes('č')) answer = answer.replace('č', 'c')
    if (answer.includes('ę')) answer = answer.replace('ę', 'e')
    if (answer.includes('ž')) answer = answer.replace('ž', 'z')
    if (answer.includes('ć')) answer = answer.replace('ć', 'c')
    if (answer.includes('ć')) answer = answer.replace('â', 'a')
    if (answer.includes('š')) answer = answer.replace('š', 's')
    if (answer.includes('ł')) answer = answer.replace('ł', 'l')
    return answer
}
const createHintsQuestions = async (req, res, next, i) => {
    let answer = modifyAnswer(req.body[i].answer)
    Player.findOne({ $or: [{ firstName: { $regex: answer, $options: "i" } }, { nameEn: { $regex: answer, $options: "i" } }, { nameAr: { $regex: answer, $options: "i" }, }, { fullName: { $regex: answer, $options: "i" } }] }).then(async res => {
        if (res && res.nameEn && !res.nameEn.includes('undefined') && req.body[i].hints?.length) {
            for (let j in req.body[i].hints) {
                if (req.body[i].hints[j].ar.includes('قلب دفاع')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('قلب دفاع', 'مدافع')
                if (req.body[i].hints[j].ar.includes('صندوق لصندوق')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('صندوق لصندوق', 'بوكس')
                if (req.body[i].hints[j].ar.includes('رأس حربة')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('رأس حربة', 'حربة')
                if (req.body[i].hints[j].ar.includes('ظهير ايسر')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('ظهير ايسر', 'ظهير')
                if (req.body[i].hints[j].ar.includes('ظهير ايمن')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('ظهير ايمن', 'ظهير')
                if (req.body[i].hints[j].ar.includes('تصدي للكرات')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('تصدي للكرات', 'بيصد')
                if (req.body[i].hints[j].ar.includes('حارس مرمي')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('حارس مرمي', 'حارس')
                if (req.body[i].hints[j].ar.includes('ريال مدريد')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('ريال مدريد', 'مدريد')
                if (req.body[i].hints[j].ar.includes('رقم ')) req.body[i].hints[j].ar = req.body[i].hints[j].ar.replace('رقم ', '')
                if (req.body[i].hints[j].en.includes('Number ')) req.body[i].hints[j].en = req.body[i].hints[j].en.replace('Number ', '')
                if (req.body[i].hints[j].en.includes('Legend')) {
                    req.body[i].hints[j].ar = 'اسطورة'
                    req.body[i].hints[j].en = 'Legend'
                }
                if (req.body[i].hints[j].en.includes('Captain')) {
                    req.body[i].hints[j].ar = 'Captain'
                    req.body[i].hints[j].en = 'كابتن'
                }
                if (req.body[i].hints[j].en.includes('Work-rate')) req.body[i].hints[j].ar = 'بدني'
                if (req.body[i].hints[j].en.includes('Target Man')) req.body[i].hints[j].ar = 'مهاجم'
                if (req.body[i].hints[j].en.includes('Versatile')) req.body[i].hints[j].ar = 'متنوع'
                if (req.body[i].hints[j].ar.includes('ركلة حرة')) req.body[i].hints[j].ar = 'فاولات'
            }
            console.log(res.nameEn)
            req.body[i].answer = res.nameEn
            req.body[i].choices = []
            await questionCreation(req.body[i], req, res)
        }

    })

}
function shuffleString(str) {
    const arr = str.split('');  // Convert the string to an array of characters
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));  // Generate a random index
        [arr[i], arr[j]] = [arr[j], arr[i]];  // Swap the elements
    }
    return arr;
}
const createReversedWordQuestions = async (req, res, next, i) => {
    if (req.body[i].answer.en && req.body[i].answer.ar) {
        let englishLetters = shuffleString(req.body[i].answer.en.toLowerCase())
        let arabicLetters = shuffleString(req.body[i].answer.ar.toLowerCase())
        let newEnglish = []
        let newArabic = []
        if (!englishLetters.some(letter => letter === ' ') && !arabicLetters.some(letter => letter === ' ')) {
            for (let i in englishLetters) {
                newEnglish.push({ letter: englishLetters[i], isChosen: false })
            }
            for (let i in arabicLetters) {
                newArabic.push({ letter: arabicLetters[i], isChosen: false })
            }
            req.body[i].reversedAnswer = { en: newEnglish, ar: newArabic }
            await questionCreation(req.body[i], req, res)
        }
    }

}
const create_questions = async (req, res, next) => {
    // return changeChoicesNames(res)
    if (Array.isArray(req.body)) {
        //addValue(res)
        // deleteDuplicates(res)
        console.log('----------------------------------------')
        for (let i in req.body) {
            if (req.body[i].hints?.length) await createHintsQuestions(req, res, next, i)
            else if (req.body[i].answer.en && req.body[i].answer.ar) await createReversedWordQuestions(req, res, next, i)
            else await createChoicesQuestions(req, res, next, i)
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
                    })
                }
            }

        }
        res.sendStatus(200)
    })
}

function shuffleArray(array) {
    let shuffledArray = array.slice(); // Create a copy of the array to avoid modifying the original
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
    }
    return shuffledArray;
}

const shuffleChoices = (res) => {
    Question.find({}).then(async questions => {
        for (let i in questions) {
            if (questions[i].questionMode === 'multipleChoices' && questions[i].choices.length === 4) {
                questions[i].choices = shuffleArray(questions[i].choices)
                await Question.findByIdAndUpdate({ _id: questions[i]._id }, questions[i]).then(question => {
                })
            }
        }
        res.sendStatus(200)
    })
}

const checkIfQuestionEnglishAndArabicAreThere = (res) => {
    Question.find({}).then(async questions => {
        for (let i in questions) {
            if (!questions[i].question || !questions[i].question.en || !questions[i].question.ar) {
            }
        }
        res.sendStatus(200)
    })
}

const changeChoicesNames = (res) => {
    Question.find({}).then(async questions => {
        for (let i in questions) {
            if (questions[i].questionMode === 'trueOrFalse') {
                questions[i].choices = [{ en: 'Yes/True', ar: 'نعم/صح', value: 'true' }, { en: "No/False", ar: "لا/خطأ", value: 'false' }]
                await Question.findByIdAndUpdate({ _id: questions[i]._id }, questions[i]).then(question => {
                })
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

const getQuestionsMethod = (req, res, next, match, user, searchName) => {
    if (searchName) {
        match.$and.push({ $or: [{ 'question.en': { $regex: searchName, $options: "i" } }, { 'question.ar': { $regex: searchName, $options: "i" } }] })
    }
    const page = (req.query.page || 1) - 1;
    const per_page = 20;

    // Calculate the skip value based on the page number and number of documents per page
    const skip = page * per_page;
    Question.aggregate([
        {
            $match: match
        },
        { $skip: skip },                   // Skip based on pagination
        { $sample: { size: per_page } },   // Add this stage to get random questions
        { $limit: per_page },              // Limit based on pagination
    ]).then(async (questions) => {
        const total_questions = await Question.countDocuments()
        // for (let i in questions) {
        //     questions[i].answer = crypto.createHash('sha256').update(questions[i].answer).digest('hex');
        // }
        const sendValues = user ? { questions, total_questions, per_page, user: user } : { questions, total_questions, per_page }
        res.status(200).send(sendValues)
    }).catch((err) => {
        next(err);
    })
}

const get_questions = async (req, res, next) => {
    let match = {}
    if (req.query.questionMode) match = { questionMode: req.query.questionMode }
    if (req.query.search && req.query.userId && req.query.name) {
        await User.findById({ _id: req.query.userId }).populate('challenges').populate('perks.id').then(async user => {
            let searchName = ''
            const payload = {
                id: req.query.search,
                lastPlayedDate: moment(new Date).format('YYYY-MM-DD'),
                index: user.challenges.length
            }
            const fetchedChallenge = user.challenges.filter(challenge => challenge.id == req.query.search)
            if (fetchedChallenge.length == 0) {
                user.challenges.push(payload)
                searchName = req.query.name
                await User.findByIdAndUpdate({ _id: req.query.userId }, user, { new: true }).populate('perks.id').then(updatedUser => {
                    getQuestionsMethod(req, res, next, match, updatedUser, searchName)
                })
                    .catch(next)
            } else {
                payload.index = fetchedChallenge[0].index
                user.challenges[fetchedChallenge[0].index] = payload
                if (fetchedChallenge[0].lastPlayedDate !== user.challenges[fetchedChallenge[0].index].lastPlayedDate || req.query.page != 1) {
                    searchName = req.query.name
                    await User.findByIdAndUpdate({ _id: req.query.userId }, user, { new: true }).populate('perks.id').then(updatedUser => {
                        getQuestionsMethod(req, res, next, match, updatedUser, searchName)
                    })
                        .catch(next)
                } else if (req.query.page == 1) {
                    return res.status(422).send({ message: 'already_played_this_challenge' })
                }
            }
        })
    } else {
        getQuestionsMethod(req, res, next, match, false, false)
    }
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