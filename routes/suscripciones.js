const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/suscripcion/prueba
router.post('/prueba', auth, async (req, res) => {
    try {
        const usuarioId = req.user?.id || req.user?.usuario_id;

        if (!usuarioId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // Verificar si ya tiene suscripción activa
        const [existentes] = await db.query(
            `SELECT id, fecha_vencimiento FROM suscripciones 
             WHERE usuario_id = ? AND estado = 'activa' AND fecha_vencimiento > NOW()
             LIMIT 1`,
            [usuarioId]
        );

        if (existentes.length > 0) {
            const fechaFin = new Date(existentes[0].fecha_vencimiento).toLocaleDateString('es-CO');
            return res.json({
                success: false,
                message: `Ya tienes una suscripción activa hasta el ${fechaFin}`,
                yaActiva: true
            });
        }

        // Crear prueba de 7 días
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 7);

        await db.query(
            `INSERT INTO suscripciones (usuario_id, plan, estado, fecha_inicio, fecha_vencimiento)
             VALUES (?, 'prueba', 'activa', ?, ?)`,
            [usuarioId, fechaInicio, fechaFin]
        );

        res.json({
            success: true,
            message: '¡Prueba gratis activada! Tienes 7 días de acceso completo.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al activar prueba: ' + err.message });
    }
});


// POST /api/suscripcion/estandar
router.post('/estandar', auth, async (req, res) => {
    try {
        const usuarioId = req.user?.id || req.user?.usuario_id;

        if (!usuarioId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // Verificar si ya tiene suscripción activa
        const [existentes] = await db.query(
            `SELECT id, fecha_vencimiento FROM suscripciones 
             WHERE usuario_id = ? AND estado = 'activa' AND fecha_vencimiento > NOW()
             LIMIT 1`,
            [usuarioId]
        );

        if (existentes.length > 0) {
            const fechaFin = new Date(existentes[0].fecha_vencimiento).toLocaleDateString('es-CO');
            return res.json({
                success: false,
                message: `Ya tienes una suscripción activa hasta el ${fechaFin}`,
                yaActiva: true
            });
        }

        // Crear plan estándar de 30 días
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 30);

        await db.query(
            `INSERT INTO suscripciones (usuario_id, plan, estado, fecha_inicio, fecha_vencimiento)
             VALUES (?, 'estandar', 'activa', ?, ?)`,
            [usuarioId, fechaInicio, fechaFin]
        );

        res.json({
            success: true,
            message: '¡Suscripción Estándar activada! Tienes 30 días de acceso completo.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al activar suscripción: ' + err.message });
    }
});

module.exports = router;