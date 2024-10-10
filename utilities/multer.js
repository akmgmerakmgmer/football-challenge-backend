const multer = require('multer')
const path = require('path')

module.exports = multer({
    storage: multer.diskStorage({}),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase()
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.webp' && ext !== '.png' && ext !== '.mp4') {
            cb(new Error('file_not_supported'), false)
            return;
        }
        cb(null, true)
    }
})