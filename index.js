const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Importar rutas serverless
const verificarRouter = require('./api/verificar');
const historialRouter = require('./api/historial');

// Montar rutas
app.use('/api/verificar', verificarRouter);
app.use('/api/historial', historialRouter);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        mensaje: 'TrazaPREP API - Hackathon Ciberdemocracia 2026',
        endpoints: {
            verificar: 'POST /api/verificar { hash }',
            historial: 'GET /api/historial/:idCasilla'
        }
    });
});

// Exportar para Vercel
module.exports = app;

// Solo escuchar si no estamos en Vercel
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`TrazaPREP API corriendo en puerto ${PORT}`);
    });
}