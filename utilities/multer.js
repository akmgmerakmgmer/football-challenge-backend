const multer = require('multer')
const path = require('path')

module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase()
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.webp' && ext !== '.png') {
            cb(new Error('file_not_supported'), false)
            return;
        }
        cb(null, true)
    }
})