const router = require('express').Router();
const authController = require('../controllers/auth_controller');
const validatorMiddleware = require('../middlewares/validation_middleware');


router.get('/register', authController.registerGet);
router.post('/register', authController.registerPost);


router.get('/login', authController.loginGet);
router.post('/login', authController.loginPost);


router.post('/refresh', authController.refresh);


router.get('/verify', authController.verifyGet);
router.post('/verify', authController.verifyPost);


router.get('/otp', authController.otpGet);

router.get('/', authController.index);






module.exports = router;