const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que existe el directorio de uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receta-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB límite
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: Solo se permiten imágenes (jpeg, jpg, png, webp, gif)"));
    }
});

// Endpoint para subir imagen
router.post('/', upload.single('imagen'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se ha proporcionado ninguna imagen' });
        }

        // Devolver la URL relativa de la imagen para que pueda ser guardada en la BD
        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            message: 'Imagen subida correctamente',
            url: imageUrl
        });
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ success: false, message: 'Error interno al subir imagen' });
    }
});

module.exports = router;
