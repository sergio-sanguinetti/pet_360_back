const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { validationResult } = require('express-validator');

// Registro de usuario
const registrar = async (req, res) => {
  try {
    // Validar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { email, password, nombre, rol } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre: nombre || null,
        rol: rol || 'vendedor',
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true
      }
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      },
      process.env.JWT_SECRET || 'secret_key_default',
      {
        expiresIn: '24h'
      }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario: nuevoUsuario,
        token
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    // Validar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacta al administrador'
      });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      process.env.JWT_SECRET || 'secret_key_default',
      {
        expiresIn: '24h'
      }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener perfil del usuario autenticado
const perfil = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { usuario }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// --- CLIENTES ---

// Registro de cliente
const registrarCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
    }

    const { email, password, nombre, telefono } = req.body;

    const clienteExistente = await prisma.cliente.findUnique({ where: { email } });
    if (clienteExistente) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado como cliente' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoCliente = await prisma.cliente.create({
      data: {
        email,
        password: passwordHash,
        nombre: nombre || 'Nuevo Cliente',
        ...(telefono ? { telefono } : {}),
        status: 'activo'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        status: true,
        wizardCompletado: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: nuevoCliente.id, email: nuevoCliente.email, rol: 'cliente' },
      process.env.JWT_SECRET || 'secret_key_default',
      { expiresIn: '24h' }
    );

    res.status(201).json({ success: true, message: 'Cliente registrado exitosamente', data: { cliente: nuevoCliente, token } });
  } catch (error) {
    console.error('Error en registro cliente:', error);
    res.status(500).json({ success: false, message: 'Error al registrar cliente', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Login de cliente
const loginCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
    }

    const { email, password } = req.body;

    const cliente = await prisma.cliente.findUnique({ where: { email } });
    if (!cliente || !cliente.password) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o cuenta sin contraseña' });
    }

    if (cliente.status !== 'activo') {
      return res.status(401).json({ success: false, message: 'Cuenta inactiva. Contacta soporte.' });
    }

    const passwordValida = await bcrypt.compare(password, cliente.password);
    if (!passwordValida) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, rol: 'cliente' },
      process.env.JWT_SECRET || 'secret_key_default',
      { expiresIn: '24h' }
    );

    res.json({ success: true, message: 'Login cliente exitoso', data: { cliente: { id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: 'cliente', wizardCompletado: cliente.wizardCompletado }, token } });
  } catch (error) {
    console.error('Error en login cliente:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLoginCliente = async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    if (!googleToken) {
      return res.status(400).json({ success: false, message: 'Google token es requerido' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let cliente = await prisma.cliente.findUnique({ where: { email } });

    if (!cliente) {
      // Crear nuevo cliente si no existe
      cliente = await prisma.cliente.create({
        data: {
          email,
          nombre: name || 'Nuevo Cliente',
          status: 'activo',
          // Google login accounts might not have a standalone password. For now, we leave it null or dummy
        },
      });
    }

    if (cliente.status !== 'activo') {
      return res.status(401).json({ success: false, message: 'Cuenta inactiva. Contacta soporte.' });
    }

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, rol: 'cliente' },
      process.env.JWT_SECRET || 'secret_key_default',
      { expiresIn: '24h' }
    );

    res.json({ success: true, message: 'Login con Google exitoso', data: { cliente: { id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: 'cliente', wizardCompletado: cliente.wizardCompletado }, token } });
  } catch (error) {
    console.error('Error en login con Google:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión con Google', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  registrar,
  login,
  perfil,
  registrarCliente,
  loginCliente,
  googleLoginCliente
};

