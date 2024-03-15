const { body } = require('express-validator');

const validateNewUser = () => {
    return [
        body('email')
            .trim()
            .isEmail().withMessage('Düzgün email daxil edin'),

        body('sifre').trim()
            .isLength({ min: 6 }).withMessage('Şifrə ən azı 6 simvol olmalıdır')
            .isLength({ max: 20 }).withMessage('Şifrə ən çox 20 simvol ola bilər'),

        body('ad').trim()
            .isLength({ min: 2 }).withMessage('Ad ən azı 2 simvol olmalıdır')
            .isLength({ max: 30 }).withMessage('Ad ən çox 30 simvol ola bilər'),

        body('soyad').trim()
            .isLength({ min: 2 }).withMessage('Soyad ən azı 2 simvol olmalıdır')
            .isLength({ max: 30 }).withMessage('Soyad ən çox 30 simvol ola bilər'),
        body('resifre').trim().custom((value, { req }) => {
            if (value !== req.body.sifre) {
                throw new Error('Şifrələr eyni deyil');
            }
            return true;
        })
        
    ];
}



const validateNewPassword = () => {
    return [
       

        body('sifre').trim()
            .isLength({ min: 6 }).withMessage('Şifrə ən azı 2 simvol olmalıdır')
            .isLength({ max: 20 }).withMessage('Şifrə ən çox 20 simvol ola bilər'),

        body('resifre').trim().custom((value, { req }) => {
            if (value !== req.body.sifre) { 
                throw new Error('Şifrələr eyni deyil');
            }
            return true;
        })
    ];
}

const validateLogin = () => {
    return [
        body('email')
            .trim()
            .isEmail().withMessage('Düzgün email daxil edin'),

        body('sifre').trim()
            .isLength({ min: 6 }).withMessage('Şifrə ən azı 6 simvol olmalıdır')
            .isLength({ max: 20 }).withMessage('Şifrə ən çox 20 simvol ola bilər')

            
    ];

}


const validateEmail = () => {
    return [
        body('email')
            .trim()
            .isEmail().withMessage('Bu email qeydiyyatda deyil və ya istifadəsizdir'),
    ];

}


module.exports = {
    validateNewUser,
    validateLogin,
    validateEmail,
    validateNewPassword
}