const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registrar, login, perfil, registrarCliente, loginCliente, googleLoginCliente, forgotPasswordCliente, resetPasswordCliente } = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

// Validaciones para registro
const validacionesRegistro = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('rol')
    .optional()
    .isIn(['administrador', 'vendedor'])
    .withMessage('Rol no válido. Solo se permiten: administrador o vendedor')
];

// Validaciones para login
const validacionesLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

const validacionesForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
];

const validacionesResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('El token es requerido'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Rutas
router.post('/registro', validacionesRegistro, registrar);
router.post('/login', validacionesLogin, login);
router.get('/perfil', verificarToken, perfil);

// Rutas de clientes
router.post('/cliente/registro', validacionesRegistro, registrarCliente);
router.post('/cliente/login', validacionesLogin, loginCliente);
router.post('/cliente/google', googleLoginCliente);
router.post('/cliente/forgot-password', validacionesForgotPassword, forgotPasswordCliente);
router.post('/cliente/reset-password', validacionesResetPassword, resetPasswordCliente);

module.exports = router;

