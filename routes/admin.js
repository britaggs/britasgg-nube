// routes/admin.js — CRUD completo de clientas para el panel admin
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── STATS ────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', auth, requireAdmin, async (req, res, next) => {
    try {
        const [[{ total_clientas }]] = await db.query('SELECT COUNT(*) AS total_clientas FROM clientes');
        const [[{ con_colorimetria }]] = await db.query('SELECT COUNT(*) AS con_colorimetria FROM resultado_colorimetria');
        const [[{ con_medidas }]] = await db.query('SELECT COUNT(DISTINCT cliente_id) AS con_medidas FROM medidas_corporales');
        const [[{ nuevas_mes }]] = await db.query(
            `SELECT COUNT(*) AS nuevas_mes FROM clientes
             WHERE creado_en >= DATE_FORMAT(NOW(), '%Y-%m-01')`
        );
        res.json({ success: true, stats: { total_clientas, con_colorimetria, con_medidas, nuevas_mes } });
    } catch (err) { next(err); }
});

// ── LISTAR CLIENTAS ──────────────────────────────────────
// GET /api/admin/clientas
router.get('/clientas', auth, requireAdmin, async (req, res, next) => {
    try {
        const [clientas] = await db.query(`
            SELECT
                c.id, c.usuario_id, u.nombre, u.email, u.rol,
                c.edad, c.ciudad, c.foto_perfil,
                c.color_piel, c.color_ojos, c.color_cabello, c.tipo_rostro,
                u.creado_en,
                p.tipo_paleta,
                m.busto, m.cintura, m.cadera, m.espalda, m.talla
            FROM clientes c
            JOIN usuarios u ON u.id = c.usuario_id
            LEFT JOIN resultado_colorimetria rc ON rc.cliente_id = c.id
            LEFT JOIN paletas_color p ON p.id = rc.paleta_id
            LEFT JOIN (
                SELECT cliente_id, busto, cintura, cadera, espalda, talla
                FROM medidas_corporales
                WHERE id IN (
                    SELECT MAX(id) FROM medidas_corporales GROUP BY cliente_id
                )
            ) m ON m.cliente_id = c.id
            WHERE u.rol = 'cliente'
            ORDER BY u.creado_en DESC
        `);
        res.json({ success: true, clientas });
    } catch (err) { next(err); }
});

// ── VER UNA CLIENTA ──────────────────────────────────────
// GET /api/admin/clientas/:id
router.get('/clientas/:id', auth, requireAdmin, async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.id, c.usuario_id, u.nombre, u.email,
                c.edad, c.ciudad, c.foto_perfil,
                c.color_piel, c.color_ojos, c.color_cabello, c.tipo_rostro,
                u.creado_en, p.tipo_paleta,
                m.busto, m.cintura, m.cadera, m.espalda, m.talla
            FROM clientes c
            JOIN usuarios u ON u.id = c.usuario_id
            LEFT JOIN resultado_colorimetria rc ON rc.cliente_id = c.id
            LEFT JOIN paletas_color p ON p.id = rc.paleta_id
            LEFT JOIN medidas_corporales m ON m.cliente_id = c.id
            WHERE c.id = ?
            ORDER BY m.creado_en DESC LIMIT 1
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ success: false, message: 'Clienta no encontrada' });
        res.json({ success: true, clienta: rows[0] });
    } catch (err) { next(err); }
});

// ── CREAR CLIENTA ────────────────────────────────────────
// POST /api/admin/clientas
router.post('/clientas', auth, requireAdmin, async (req, res, next) => {
    try {
        const { nombre, email, password, ciudad, edad, tipo_rostro, color_piel, color_ojos, color_cabello } = req.body;

        if (!nombre || !email || !password)
            return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son requeridos' });

        // Verificar email único
        const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length)
            return res.status(409).json({ success: false, message: 'Ya existe un usuario con ese email' });

        const hash = await bcrypt.hash(password, 10);

        const [userResult] = await db.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'cliente')`,
            [nombre, email, hash]
        );

        await db.query(
            `INSERT INTO clientes (usuario_id, ciudad, edad, tipo_rostro, color_piel, color_ojos, color_cabello)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userResult.insertId, ciudad || null, edad || null, tipo_rostro || null,
            color_piel || null, color_ojos || null, color_cabello || null]
        );

        res.status(201).json({ success: true, message: 'Clienta creada correctamente', usuario_id: userResult.insertId });
    } catch (err) { next(err); }
});

// ── ACTUALIZAR CLIENTA ───────────────────────────────────
// PUT /api/admin/clientas/:id
router.put('/clientas/:id', auth, requireAdmin, async (req, res, next) => {
    try {
        const { nombre, email, password, ciudad, edad, tipo_rostro, color_piel, color_ojos, color_cabello } = req.body;
        const clienteId = req.params.id;

        // Obtener usuario_id
        const [rows] = await db.query('SELECT usuario_id FROM clientes WHERE id = ?', [clienteId]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Clienta no encontrada' });

        const usuarioId = rows[0].usuario_id;

        // Actualizar usuario
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await db.query('UPDATE usuarios SET nombre=?, email=?, password_hash=? WHERE id=?', [nombre, email, hash, usuarioId]);
        } else {
            await db.query('UPDATE usuarios SET nombre=?, email=? WHERE id=?', [nombre, email, usuarioId]);
        }

        // Actualizar cliente
        await db.query(
            `UPDATE clientes SET ciudad=?, edad=?, tipo_rostro=?, color_piel=?, color_ojos=?, color_cabello=?
             WHERE id=?`,
            [ciudad || null, edad || null, tipo_rostro || null,
            color_piel || null, color_ojos || null, color_cabello || null,
                clienteId]
        );

        res.json({ success: true, message: 'Clienta actualizada correctamente' });
    } catch (err) { next(err); }
});

// ── ELIMINAR CLIENTA ─────────────────────────────────────
// DELETE /api/admin/clientas/:id
router.delete('/clientas/:id', auth, requireAdmin, async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT usuario_id FROM clientes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Clienta no encontrada' });

        // Al eliminar el usuario, el CASCADE borra clientes, medidas y colorimetría
        await db.query('DELETE FROM usuarios WHERE id = ?', [rows[0].usuario_id]);

        res.json({ success: true, message: 'Clienta eliminada correctamente' });
    } catch (err) { next(err); }
});

module.exports = router;