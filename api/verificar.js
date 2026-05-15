const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

// Configuración del contrato
const CONTRACT_ADDRESS = "0xTU_DIRECCION_DEL_CONTRATO"; // ← CAMBIAR
const SEPOLIA_RPC = "https://rpc.sepolia.org";

// ABI mínimo
const ABI = [
    "function verificarHash(bytes32 _hashActa) public view returns (bool existe, uint256 totalApariciones)",
    "function consultarHistorial(string memory _idCasilla) public view returns (tuple(string idCasilla, bytes32 hashActa, uint8 tipoEvento, uint256 timestamp)[] memory)"
];

// Endpoint: POST /api/verificar
router.post('/', async (req, res) => {
    try {
        const { hash } = req.body;

        // Validación básica
        if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
            return res.status(400).json({
                error: 'Hash inválido. Debe ser 32 bytes en formato hexadecimal (0x...)'
            });
        }

        // Conectar al contrato
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
        const contrato = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        // Verificar hash
        const [existe, totalApariciones] = await contrato.verificarHash(hash);

        return res.json({
            hash: hash,
            existe: existe,
            totalApariciones: Number(totalApariciones),
            mensaje: existe 
                ? 'El documento COINCIDE con el registro oficial en blockchain' 
                : 'El documento NO coincide con ningún registro oficial'
        });

    } catch (error) {
        console.error('Error en /api/verificar:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
});

module.exports = router;