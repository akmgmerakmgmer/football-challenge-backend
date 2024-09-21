require("dotenv").config()
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");


const new_payment_method = async (req, res, next) => {
    const { amount, username, userId, phoneNumber, itemBought, itemQuantity } = req.body;
    const numberOfTransactionsCount = (await Transaction.find({ username: username })).length
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Token egy_sk_test_334a79dbb597a3a561629971ba2c6689bcdde0480c138c6ce6b842af105b67e4");
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "amount": amount,
        "currency": "EGP",
        "special_reference": `${userId}${numberOfTransactionsCount + 1}`,
        "payment_methods": [
            12,
            "card",
            4622714
        ],
        "billing_data": {
            "first_name": username,
            "last_name": username,
            "phone_number": phoneNumber,
            "country": "EGY",
            "state": "Cairo"
        },

    });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch("https://accept.paymob.com/v1/intention/", requestOptions)
        .then(response => response.text())
        .then(async result => {
            const transactionCreationPayload = {
                itemBought,
                itemQuantity,
                transactionId: `${userId}${numberOfTransactionsCount + 1}`,
                username,
                number: phoneNumber
            }
            await Transaction.create(transactionCreationPayload)
            res.status(200).send(result)
        })
        .catch(next);
}

const payment_success = (req, res, next) => {
    const { id } = req.body
    Transaction.findOne({ transactionId: id }).then(transaction => {
        if (transaction && transaction.itemBought === 'coins' && !transaction.isPaid) {
            User.findOneAndUpdate(
                { username: transaction.username }, // The filter to find the user by username
                { $inc: { coins: transaction.itemQuantity } }, // The $inc operator to increment the coins
                { new: true }, // Options: return the updated document
            ).populate('perks.id').then(user => {
                Transaction.findOneAndUpdate({ transactionId: id }, { isPaid: true }, { new: true }).then(transaction => {
                    res.status(200).send({ user, transaction })
                })
            }).catch(next);

        } else {
            res.status(200).send({ transaction })
        }
    }).catch(next)
}

const get_transactions = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 50
    if (req.query.isPaid === 'all') {
        Transaction.find({}).count().then(total_transactions => {
            Transaction.find({}).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(transactions => res.status(200).send({ transactions, total_transactions, per_page })).catch(next)
        })
    } else {
        Transaction.find({ isPaid: req.query.isPaid }).count().then(total_transactions => {
            Transaction.find({ isPaid: req.query.isPaid }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(transactions => res.status(200).send({ transactions, total_transactions, per_page })).catch(next)
        })
    }
}

const get_single_transaction = (req, res, next) => {
    Transaction.findById({ _id: req.params.id }).then(transaction => res.status(200).send(transaction)).catch(next)
}

const update_transaction = (req, res, next) => {
    Transaction.findByIdAndUpdate({ _id: req.params.id }, req.body).then(transaction => {
        Transaction.findOne({ _id: req.params.id }).then(transaction => res.status(200).send(transaction))
    }).catch(next)
}

const delete_transaction = (req, res, next) => {
    Transaction.findByIdAndDelete({ _id: req.params.id }).then(transaction => {
        res.status(200).send(transaction)
    }).catch(next)
}

module.exports = { get_transactions, get_single_transaction, update_transaction, delete_transaction, payment_success, new_payment_method }