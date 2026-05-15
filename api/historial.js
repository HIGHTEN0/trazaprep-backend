const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

const CONTRACT_ADDRESS = "0xTU_DIRECCION_DEL_CONTRATO"; // ← CAMBIAR
const SEPOLIA_RPC = "https://rpc.sepolia.org";

const ABI = [
    "function consultarHistorial(string memory _idCasilla) public view returns (tuple(string idCasilla, bytes32 hashActa, uint8 tipoEvento, uint256 timestamp)[] memory)"
];

const ETAPAS = ['CAPTURA', 'TRANSMISIÓN', 'VALIDACIÓN', 'PUBLICACIÓN'];

// Endpoint: GET /api/historial/:idCasilla
router.get('/:idCasilla', async (req, res) => {
    try {
        const { idCasilla } = req.params;

        if (!idCasilla || idCasilla.trim() === '') {
            return res.status(400).json({ error: 'ID de casilla requerido' });
        }

        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
        const contrato = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        const eventos = await contrato.consultarHistorial(idCasilla);

        // Formatear respuesta
        const historial = eventos.map(ev => ({
            idCasilla: ev.idCasilla,
            hashActa: ev.hashActa,
            tipoEvento: ETAPAS[ev.tipoEvento] || 'DESCONOCIDO',
            timestamp: new Date(Number(ev.timestamp) * 1000).toISOString()
        }));

        return res.json({
            idCasilla: idCasilla,
            totalEventos: historial.length,
            historial: historial,
            estado: historial.length > 0 ? 'ÍNTEGRO' : 'SIN DATOS'
        });

    } catch (error) {
        console.error('Error en /api/historial:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
});

module.exports = router;