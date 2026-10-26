const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res, next) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password)
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });

        const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length)
            return res.status(409).json({ success: false, message: 'El email ya está registrado' });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'cliente')`,
            [nombre, email, hash]
        );

        await db.query(
            'INSERT INTO clientes (usuario_id) VALUES (?)',
            [result.insertId]
        );

        const token = jwt.sign(
            { id: result.insertId, rol: 'cliente' },
            process.env.JWT_SECRET || 'brittasgg_secret_2025',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            token,
            user: { id: result.insertId, nombre, email, rol: 'cliente' }
        });
    } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });

        const [rows] = await db.query(
            `SELECT u.*, c.id AS cliente_id FROM usuarios u
             LEFT JOIN clientes c ON c.usuario_id = u.id
             WHERE u.email = ? AND u.activo = 1`,
            [email]
        );

        if (!rows.length)
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

        const token = jwt.sign(
            { id: user.id, rol: user.rol, cliente_id: user.cliente_id },
            process.env.JWT_SECRET || 'brittasgg_secret_2025',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                cliente_id: user.cliente_id
            }
        });
    } catch (err) { next(err); }
});

module.exports = router;