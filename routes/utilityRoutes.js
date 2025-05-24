const express = require('express');
const router = express.Router();
const translate = require('translate-google');

router.post('/translate', (req, res, next) => {
    translate(req.body.msg, { from: req.body.from, to: req.body.to })
        .then(response => {
            res.status(200).send(response);
        })
        .catch(next);
});

module.exports = router; 