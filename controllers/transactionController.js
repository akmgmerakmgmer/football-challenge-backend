require("dotenv").config()
const axios = require('axios');
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

const create_payment = async (req, res, next) => {

    const { amount, username, phoneNumber, itemBought, itemQuantity } = req.body;

    try {
        // Authentication request
        const authResponse = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const token = authResponse.data.token;

        // Order registration
        const orderResponse = await axios.post(
            'https://accept.paymobsolutions.com/api/ecommerce/orders',
            {
                auth_token: token,
                delivery_needed: false,
                amount_cents: amount,
                currency: 'EGP',
                items: [
                    {
                        name: itemBought,
                        amount_cents: amount,
                        quantity: itemQuantity,
                        description: 'Hi'
                    }
                ],
                shipping_data: {
                    first_name: username,
                    last_name: username,
                    email: 'ahmedever80@gmail.com',
                    phone_number: phoneNumber,
                },
            }
        );
        const transactionCreationPayload = {
            itemBought,
            itemQuantity,
            transactionId: orderResponse.data.id,
            username,
            number: phoneNumber
        }
        await Transaction.create(transactionCreationPayload)
        // Payment key request
        const paymentKeyResponse = await axios.post(
            'https://accept.paymobsolutions.com/api/acceptance/payment_keys',
            {
                auth_token: token,
                amount_cents: amount,
                expiration: 3600,
                order_id: orderResponse.data.id,
                integration_id: 4622714,
                currency: "EGP",
                billing_data: {
                    apartment: '52',
                    email: "inzone.gaming2023@gmail.com",
                    floor: '3',
                    first_name: "Ahmed",
                    street: 'Zahraa',
                    building: '52A',
                    last_name: 'Gharib',
                    phone_number: '+201119683676',
                    shipping_method: 'UNK',
                    postal_code: '11511',
                    city: 'Cairo',
                    country: 'Egypt',
                    state: 'Cairo'
                }
            }
        );
        res.send({ paymentKey: paymentKeyResponse.data.token });
    } catch (error) {
        next()
    }
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

module.exports = { create_payment, get_transactions, get_single_transaction, update_transaction, delete_transaction, payment_success }