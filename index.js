
const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const helmet = require('helmet')
const xssClean = require("xss-clean")
const compression = require("compression")
require("dotenv").config()


// const UglifyJS = require('uglify-js');
// const fs = require('fs');
// const result = UglifyJS.minify(fs.readFileSync('./routes/api.js', 'utf8'));
// fs.writeFileSync('./routes/api.min.js', result.code);

// const UglifyJS = require('uglify-js');
// const fs = require('fs');
// const result = UglifyJS.minify(fs.readFileSync('./controllers/questionsController.js', 'utf8'));
// fs.writeFileSync('./controllers/questionsController.min.js', result.code);

//Database Connection
const port = process.env.PORT || 4000
const database = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.0nhrwlp.mongodb.net/?retryWrites=true&w=${process.env.MONGO_DATABASE}`
mongoose.connect(database, { writeConcern: { w: 'majority', j: true, wtimeout: 1000 } }).then(res => {
    const server = app.listen(port, () => {

    });
    // Set server timeout to 60 seconds
    server.timeout = 60000;
    server.keepAliveTimeout = 60000
})

//Middlewares

app.set('trust proxy', 1)
app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Origin'],
    origin: '*',
    exposedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Origin']
}));

app.use(helmet())
app.use(compression())
app.use(xssClean())
app.use('/images', express.static('images'))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.json({ limit: '500mb' }))
app.use('/api', require('./routes/api.min.js'))


app.use((err, req, res, next) => {
    res.status(400).send({ error: err.message || 'server_error' })
})
