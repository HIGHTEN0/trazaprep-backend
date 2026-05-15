import { Router, Request, Response } from "express";
import { contrato, provider } from "../contrato";

const router = Router();

// Mapeo de tipo numérico a etiqueta legible
const tipoLabel: Record<number, string> = {
  0: "CAPTURA",
  1: "TRANSMISION",
  2: "VALIDACION",
  3: "PUBLICACION",
};

// GET /casilla/:clave - bitácora completa de una casilla
router.get("/casilla/:clave", async (req: Request, res: Response) => {
  try {
    const { clave } = req.params;

    // Intentamos obtener la bitácora; si revierte (clave sin eventos), devolvemos []
    let bitacora;
    try {
      bitacora = await contrato.obtenerBitacora(clave);
    } catch (errorContrato) {
      console.warn(`La casilla ${clave} no tiene eventos o no existe.`);
      return res.json([]);
    }

    const resultado = bitacora.map((evento: any) => ({
      casillaClave: evento.casillaClave,
      hashSHA256: (evento.hashSHA256 as string).startsWith("0x")
        ? evento.hashSHA256
        : "0x" + evento.hashSHA256,
      tipo: Number(evento.tipo),                 // ← BigInt → Number
      tipoLabel: tipoLabel[Number(evento.tipo)] || "DESCONOCIDO",
      timestamp: Number(evento.timestamp),       // ← BigInt → Number
      registrador: evento.registrador,
    }));

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la bitácora" });
  }
});
// GET /casillas - lista de todas las casillas registradas
router.get("/casillas", async (_req: Request, res: Response) => {
  try {
    const total = Number(await contrato.totalCasillas());
    const indices = Array.from({ length: total }, (_, i) => i);
    const casillas = await Promise.all(
      indices.map(i => contrato.casillasRegistradas(i))
    );
    res.json(casillas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las casillas" });
  }
});

// GET /stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const totalCasillas = (await contrato.totalCasillas()).toString();
    const bloqueActual = await provider.getBlockNumber();

    // totalEventos temporalmente en 0 (limitación Alchemy Free)
    res.json({
      totalCasillas,
      totalEventos: "0",  // string para el frontend
      bloqueActual: bloqueActual.toString(),
      contractAddress: process.env.CONTRACT_ADDRESS,
      network: "Sepolia",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// GET /resumen - resumen de la última actividad de cada casilla
router.get("/resumen", async (_req: Request, res: Response) => {
  try {
    const total = Number(await contrato.totalCasillas());
    const indices = Array.from({ length: total }, (_, i) => i);

    // Todas las claves en paralelo
    const claves = await Promise.all(
      indices.map(i => contrato.casillasRegistradas(i))
    );

    // Todas las bitácoras en paralelo
    const bitacoras = await Promise.all(
      claves.map(clave => contrato.obtenerBitacora(clave))
    );

    const resumen = claves.map((clave, i) => {
      const eventos = bitacoras[i];
      const count = eventos.length;
      const estado = count === 0 ? "sin-registro" : count >= 4 ? "completa" : "en-proceso";
      return {
        clave,
        estado,
        eventosCount: count,
        ultimoTimestamp: count > 0 ? Number(eventos[count - 1].timestamp) : null,
      };
    });

    res.json(resumen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el resumen" });
  }
});

// POST /verificar - verifica coincidencia de hash
router.post("/verificar", async (req: Request, res: Response) => {
  try {
    const { clave, hash } = req.body;
    // El frontend manda el hash sin "0x", lo añadimos
    const hashConPrefijo = "0x" + hash;
    const [coincide, timestamp] = await contrato.verificarHash(clave, hashConPrefijo);
    const timestampISO = coincide
      ? new Date(Number(timestamp) * 1000).toISOString()
      : null;
    res.json({
      coincide,
      timestamp: timestampISO,
      mensaje: coincide
        ? "El hash coincide con el acta registrada."
        : "El hash no coincide con ningún registro.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al verificar el hash" });
  }
});

export default router;