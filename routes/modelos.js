// ── routes/modelos.js — Catálogo de modelos GLB ──────────────
const express = require('express');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/modelos — listar modelos (con filtro opcional ?tipo=vestido)
router.get('/', async (req, res, next) => {
    try {
        const { tipo } = req.query;
        let sql = 'SELECT * FROM modelos_glb WHERE activo = 1';
        const params = [];
        if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
        sql += ' ORDER BY nombre';
        const [rows] = await db.query(sql, params);
        const modelos = rows.map(m => ({
            ...m,
            colores_hex: typeof m.colores_hex === 'string' ? JSON.parse(m.colores_hex || '[]') : (m.colores_hex || [])
        }));
        res.json({ success: true, modelos });
    } catch (err) { next(err); }
});

// GET /api/modelos/:id
router.get('/:id', async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM modelos_glb WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Modelo no encontrado' });
        const m = rows[0];
        res.json({ success: true, modelo: { ...m, colores_hex: typeof m.colores_hex === 'string' ? JSON.parse(m.colores_hex || '[]') : (m.colores_hex || []) } });
    } catch (err) { next(err); }
});

// POST /api/modelos — agregar nuevo modelo (admin)
router.post('/', auth, adminOnly, async (req, res, next) => {
    try {
        const { nombre, archivo_glb, tipo, colores_hex, descripcion } = req.body;
        const [r] = await db.query(
            'INSERT INTO modelos_glb (nombre, archivo_glb, tipo, colores_hex, descripcion) VALUES (?,?,?,?,?)',
            [nombre, archivo_glb, tipo, JSON.stringify(colores_hex || []), descripcion]
        );
        res.status(201).json({ success: true, id: r.insertId });
    } catch (err) { next(err); }
});

// DELETE /api/modelos/:id (soft delete)
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
    try {
        await db.query('UPDATE modelos_glb SET activo = 0 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { next(err); }
});

module.exports = router;

// ── routes/contacto.js ────────────────────────────────────────
const express2 = require('express');
const router2 = express2.Router();

router2.post('/', async (req, res, next) => {
    try {
        const db2 = require('../config/db');
        const { nombre, email, mensaje } = req.body;
        if (!nombre || !email || !mensaje)
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
        await db2.query(
            'INSERT INTO contacto_mensajes (nombre, email, mensaje) VALUES (?,?,?)',
            [nombre, email, mensaje]
        );
        res.status(201).json({ success: true, message: '¡Mensaje recibido! Te responderemos pronto.' });
    } catch (err) { next(err); }
});

module.exports = { modelos: router, contacto: router2 };