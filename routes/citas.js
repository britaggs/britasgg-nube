// ============================================================
//  BRITASGG — Rutas adicionales para el proyecto con avatar 3D
//  Agregar en server.js existente
// ============================================================

// ── routes/citas.js ──────────────────────────────────────────
const express = require('express');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/citas — Agendar cita (público)
router.post('/', async (req, res, next) => {
    try {
        const { nombre, telefono, fecha, servicio, email } = req.body;
        if (!nombre || !telefono || !fecha || !servicio)
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });

        const [r] = await db.query(
            'INSERT INTO citas (nombre, telefono, email, fecha_preferida, servicio) VALUES (?,?,?,?,?)',
            [nombre, telefono, email || null, fecha, servicio]
        );
        res.status(201).json({ success: true, id: r.insertId, message: '¡Cita agendada! Te contactaremos pronto.' });
    } catch (err) { next(err); }
});

// GET /api/citas — Listar citas (solo admin)
router.get('/', auth, adminOnly, async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM citas ORDER BY creado_en DESC');
        res.json({ success: true, citas: rows });
    } catch (err) { next(err); }
});

// PUT /api/citas/:id/estado
router.put('/:id/estado', auth, adminOnly, async (req, res, next) => {
    try {
        await db.query('UPDATE citas SET estado=? WHERE id=?', [req.body.estado, req.params.id]);
        res.json({ success: true });
    } catch (err) { next(err); }
});

module.exports = router;