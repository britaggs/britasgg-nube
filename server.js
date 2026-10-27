// ============================================================
//  BRITASGG SERVER.JS - VERSIÓN CORREGIDA
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const fs = require('fs');
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Frontend estático (solo lo necesario, sin exponer server.js ni .env)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.get('/logo.jpg', (req, res) => res.sendFile(path.join(__dirname, 'logo.jpg')));

const paginas = ['index', 'admin', 'analisis-color', 'avatar', 'catalogo-de-telas',
    'catalogo', 'contacto', 'explorador-disenos', 'manual-usuario',
    'personalizado', 'suscripciones'];
paginas.forEach(p => {
    app.get(`/${p}.html`, (req, res) => res.sendFile(path.join(__dirname, `${p}.html`)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Importar rutas correctamente
const clientesRouter = require('./routes/clientes');
const authRoutes = require('./routes/auth');
const colorRoutes = require('./routes/colorimetria');
const citasRoute = require('./routes/citas');
const { modelos: modelosRoute, contacto: contactoRoute } = require('./routes/modelos');

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRouter);           // ← Corregido
app.use('/api/colorimetria', colorRoutes);
app.use('/api/citas', citasRoute);
app.use('/api/modelos', modelosRoute);
app.use('/api/contacto', contactoRoute);
const suscripcionRoutes = require('./routes/suscripciones');
app.use('/api/suscripcion', suscripcionRoutes);

// Ruta de salud (verifica también la base de datos)
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', app: 'BRITASGG', version: '2.0.0', db: 'connected' });
    } catch (err) {
        console.error('[HEALTH] Error de BD:', err.message);
        res.status(503).json({ status: 'error', db: 'disconnected' });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ BRITASGG API corriendo correctamente en el puerto ${PORT}\n`);
});

module.exports = app;