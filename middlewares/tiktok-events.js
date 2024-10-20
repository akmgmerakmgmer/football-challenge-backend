const axios = require('axios');

const loginHandler = (req, res, next) => {
    axios.post(
        'https://business-api.tiktok.com/open_api/v1.3/event/track/',
        {
            "event_source": "web",
            "event_source_id": "CS99IHJC77UFDI751310",
            "data": [
                {
                    "event": "ClickButton",
                    "event_time": 1729386489,
                    "user": {},
                    "properties": {},
                    "page": {
                        "url": "https://www.inzonegaming.com/ar/login"
                    }
                }
            ]
        },
        {
            headers: {
                'Access-Token': '02923c2385e6b47a84f38ae489d12b5282d36dd8',
                'Content-Type': 'application/json'
            }
        })
        .then(function (response) {
            next()
        })
        .catch(function (error) {
            next()
        });
}
const signupHandler = (req, res, next) => {
    axios.post(
        'https://business-api.tiktok.com/open_api/v1.3/event/track/',
        {
            "event_source": "web",
            "event_source_id": "CS99IHJC77UFDI751310",
            "data": [
                {
                    "event": "CompleteRegistration",
                    "event_time": 1729385500,
                    "user": {},
                    "properties": {},
                    "page": {
                        "url": "https://www.inzonegaming.com/ar/signup"
                    }
                }
            ]
        },
        {
            headers: {
                'Access-Token': '02923c2385e6b47a84f38ae489d12b5282d36dd8',
                'Content-Type': 'application/json'
            }
        })
        .then(function (response) {
            next()
        })
        .catch(function (error) {
            next()
        });
}
module.exports = { loginHandler, signupHandler }

    