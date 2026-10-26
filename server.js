// ============================================================
//  BRITASGG SERVER.JS - VERSIÓN CORREGIDA
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'BRITASGG',
        version: '2.0.0',
        message: 'Servidor funcionando correctamente'
    });
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
    console.log(`\n✅ BRITASGG API corriendo correctamente`);
    console.log(`   → Local (computadora): http://localhost:${PORT}`);
    console.log(`   → Celular / Otros dispositivos: http://192.168.0.124:${PORT}`);
    console.log(`   → Admin: http://192.168.0.124:${PORT}/admin.html\n`);
});

module.exports = app;