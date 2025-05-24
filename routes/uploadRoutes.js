const express = require('express');
const router = express.Router();
const upload = require('../utilities/multer');
const cloudinary = require('../utilities/cloudinary');
const tinify = require('tinify');
require('dotenv').config();

tinify.key = process.env.TINIFY_KEY;

const compressImage = function (req, res, next) {
    const source = tinify.fromFile(req.file.path);
    source.toFile(req.file.path, function () {
        next();
    });
};

router.post('/single', upload.single('image'), compressImage, async (req, res) => {
    if (!req.file) {
        res.send({ code: 422, msg: 'field_required' });
    } else {
        const result = await cloudinary.uploader.upload(req.file.path);
        res.status(200).send(result);
    }
});

router.post('/video', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(422).send({ code: 422, msg: 'field_required' });
    }
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'video' });
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ code: 500, msg: 'upload_error', error: err.message });
    }
});

module.exports = router; 