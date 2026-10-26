const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Ruta para guardar perfil desde el cliente (analisis-color.html)
// ⚠️ OJO: esta ruta tiene un problema de columnas (nombre/email/tipo_cuerpo
// no existen en `clientes`, viven en `usuarios` o no existen en absoluto).
// La dejamos intacta por ahora; avisar si se usa activamente para corregirla con el mismo patrón usuarios+clientes.
router.post('/guardar-perfil', async (req, res) => {
    try {
        const { nombre, email, color_piel, color_ojos, color_cabello, tipo_rostro, tipo_cuerpo } = req.body;

        if (!nombre || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y correo electrónico son obligatorios'
            });
        }

        const [result] = await db.query(`
            INSERT INTO clientes (nombre, email, color_piel, color_ojos, color_cabello, tipo_rostro, tipo_cuerpo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                color_piel = VALUES(color_piel),
                color_ojos = VALUES(color_ojos),
                color_cabello = VALUES(color_cabello),
                tipo_rostro = VALUES(tipo_rostro),
                tipo_cuerpo = VALUES(tipo_cuerpo)
        `, [nombre, email, color_piel, color_ojos, color_cabello, tipo_rostro, tipo_cuerpo]);

        res.json({
            success: true,
            message: 'Perfil guardado correctamente',
            cliente_id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al guardar perfil' });
    }
});

// ── CREAR clienta (admin) ── POST /api/clientes
router.post('/', async (req, res) => {
    const { nombre, email, ciudad, edad, tipo_rostro, color_piel, color_ojos, color_cabello, password } = req.body;

    if (!nombre || !email) {
        return res.status(400).json({
            success: false,
            message: 'Nombre y correo electrónico son obligatorios'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const passwordHash = password
            ? await bcrypt.hash(password, 10)
            : await bcrypt.hash(Math.random().toString(36).slice(-10), 10); // password temporal si no se envía

        const [userResult] = await connection.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol, activo, creado_en)
             VALUES (?, ?, ?, 'cliente', 1, NOW())`,
            [nombre, email, passwordHash]
        );
        const usuarioId = userResult.insertId;

        const [clienteResult] = await connection.query(
            `INSERT INTO clientes (usuario_id, edad, ciudad, tipo_rostro, color_piel, color_ojos, color_cabello, creado_en)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [usuarioId, edad, ciudad, tipo_rostro, color_piel, color_ojos, color_cabello]
        );

        await connection.commit();
        res.json({
            success: true,
            message: 'Clienta creada correctamente',
            cliente_id: clienteResult.insertId,
            usuario_id: usuarioId
        });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ese email ya está registrado' });
        }
        res.status(500).json({ success: false, message: 'Error al crear clienta' });
    } finally {
        connection.release();
    }
});

// ── EDITAR clienta (admin) ── PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params; // id de la tabla `clientes`
    const { nombre, email, ciudad, edad, tipo_rostro, color_piel, color_ojos, color_cabello, password } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [clienteRows] = await connection.query(
            'SELECT usuario_id FROM clientes WHERE id = ?', [id]
        );
        if (clienteRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Clienta no encontrada' });
        }
        const usuarioId = clienteRows[0].usuario_id;

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            await connection.query(
                'UPDATE usuarios SET nombre = ?, email = ?, password_hash = ?, actualizado_en = NOW() WHERE id = ?',
                [nombre, email, passwordHash, usuarioId]
            );
        } else {
            await connection.query(
                'UPDATE usuarios SET nombre = ?, email = ?, actualizado_en = NOW() WHERE id = ?',
                [nombre, email, usuarioId]
            );
        }

        await connection.query(
            `UPDATE clientes SET edad = ?, ciudad = ?, tipo_rostro = ?, color_piel = ?, color_ojos = ?, color_cabello = ?
             WHERE id = ?`,
            [edad, ciudad, tipo_rostro, color_piel, color_ojos, color_cabello, id]
        );

        await connection.commit();
        res.json({ success: true, message: 'Clienta actualizada correctamente' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ese email ya está registrado' });
        }
        res.status(500).json({ success: false, message: 'Error al actualizar clienta' });
    } finally {
        connection.release();
    }
});

// ── LISTAR clientas (admin) ── GET /api/clientes/admin/clientas
router.get('/admin/clientas', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.id AS cliente_id, u.nombre, u.email, c.ciudad, c.edad, c.tipo_rostro,
                   c.color_piel, c.color_ojos, c.color_cabello, c.creado_en
            FROM clientes c
            JOIN usuarios u ON u.id = c.usuario_id
            ORDER BY c.creado_en DESC
        `);
        res.json({ success: true, clientas: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al obtener clientas' });
    }
});

module.exports = router;