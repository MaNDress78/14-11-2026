'use strict';

const { Router } = require('express');
const authCtrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { updateProfileSchema, linkCodeSchema } = require('../schemas/auth.schemas');

const router = Router();

router.use(requireAuth);
router.get('/mis-codigos', authCtrl.listarMisCodigos);
router.post('/link-code', validate(linkCodeSchema), authCtrl.vincularCodigo);
router.patch('/me', validate(updateProfileSchema), authCtrl.updateMe);
router.put('/me', validate(updateProfileSchema), authCtrl.updateMe);

module.exports = router;
