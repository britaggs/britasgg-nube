const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

function safeJSON(val) {
    if (!val) return [];
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
    }
    return val;
}

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

function luminosidad({ r, g, b }) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function temperatura({ r, g, b }) {
    return (r - b) / 255;
}

function determinarPaleta(colorPiel, colorOjos, colorCabello) {
    const piel = hexToRgb(colorPiel);
    const ojos = hexToRgb(colorOjos);
    const cabello = hexToRgb(colorCabello);

    const lumPiel = luminosidad(piel);
    const tempPiel = temperatura(piel);
    const tempCab = temperatura(cabello);
    const lumCabello = luminosidad(cabello);

    let scoreCalido = 0;
    if (tempPiel > 0.05) scoreCalido++;
    if (tempCab > 0.0) scoreCalido++;
    if (lumPiel > 0.5) scoreCalido++;
    if (ojos.g > ojos.b) scoreCalido++;

    const esCalido = scoreCalido >= 2;
    const esLuminoso = lumPiel > 0.55;
    const esOscuro = lumPiel < 0.35;
    const esCabOscuro = lumCabello < 0.3;

    let paleta, confianza;
    if (esCalido && esLuminoso) { paleta = 'primavera'; confianza = 0.85; }
    else if (!esCalido && esLuminoso) { paleta = 'verano'; confianza = 0.80; }
    else if (esCalido && (esOscuro || esCabOscuro)) { paleta = 'otono'; confianza = 0.82; }
    else { paleta = 'invierno'; confianza = 0.78; }

    return { paleta, confianza };
}

router.post('/analizar', auth, async (req, res, next) => {
    try {
        const { cliente_id, color_piel, color_ojos, color_cabello } = req.body;
        if (!color_piel || !color_ojos || !color_cabello)
            return res.status(400).json({ success: false, message: 'Los tres colores son requeridos' });

        await db.query(
            'UPDATE clientes SET color_piel=?, color_ojos=?, color_cabello=? WHERE id=?',
            [color_piel, color_ojos, color_cabello, cliente_id]
        );

        const { paleta, confianza } = determinarPaleta(color_piel, color_ojos, color_cabello);
        const [rows] = await db.query('SELECT * FROM paletas_color WHERE tipo_paleta = ?', [paleta]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Paleta no encontrada' });

        const paletaData = rows[0];

        await db.query(
            `INSERT INTO resultado_colorimetria (cliente_id, paleta_id, confianza)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE paleta_id=VALUES(paleta_id), confianza=VALUES(confianza), creado_en=NOW()`,
            [cliente_id, paletaData.id, confianza]
        );

        const [disenos] = await db.query(
            `SELECT d.*, c.nombre AS categoria FROM disenos d
       JOIN categorias_prenda c ON c.id = d.categoria_id
       JOIN diseno_paleta dp ON dp.diseno_id = d.id
       WHERE dp.paleta_id = ? AND d.activo = 1`,
            [paletaData.id]
        );

        res.json({
            success: true,
            resultado: {
                paleta: paletaData.tipo_paleta,
                descripcion: paletaData.descripcion,
                colores_ideales: safeJSON(paletaData.colores_ideales),
                colores_evitar: safeJSON(paletaData.colores_evitar),
                tono_base: paletaData.tono_base,
                confianza: Math.round(confianza * 100),
                disenos_recomendados: disenos
            }
        });
    } catch (err) { next(err); }
});

router.get('/cliente/:id', auth, async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT rc.*, p.tipo_paleta, p.descripcion, p.colores_ideales, p.colores_evitar, p.tono_base
       FROM resultado_colorimetria rc
       JOIN paletas_color p ON p.id = rc.paleta_id
       WHERE rc.cliente_id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.json({ success: true, resultado: null });
        const r = rows[0];
        res.json({
            success: true,
            resultado: {
                ...r,
                colores_ideales: safeJSON(r.colores_ideales),
                colores_evitar: safeJSON(r.colores_evitar),
            }
        });
    } catch (err) { next(err); }
});

router.get('/paletas', async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM paletas_color');
        const paletas = rows.map(p => ({
            ...p,
            colores_ideales: safeJSON(p.colores_ideales),
            colores_evitar: safeJSON(p.colores_evitar),
        }));
        res.json({ success: true, paletas });
    } catch (err) { next(err); }
});

module.exports = router;