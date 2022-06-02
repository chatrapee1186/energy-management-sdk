const router = require('express').Router()
const project = require('@mea-energy-sdk/controllers/project')

const multer = require('multer')
const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const path = require('path')
        const crypto = require('crypto')
        crypto.pseudoRandomBytes(32, (err, raw) => {
            cb(err, err ? undefined : raw.toString('hex') + path.extname(file.originalname))
        })
    },
})
const uploadMiddleware = multer({ storage })

router.post('', project.create)
router.get('/search', project.search)
router.post('/import', uploadMiddleware.single('file'), project.import)
router.put('/disable', project.disable)
router.put('/delete', project.delete)
router.get('/:projectId', project.getById)
router.put('/:projectId', project.updateById)

module.exports = router
