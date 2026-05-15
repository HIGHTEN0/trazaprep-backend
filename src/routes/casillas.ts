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
    const bitacora = await contrato.obtenerBitacora(clave);
    
    const resultado = bitacora.map((evento: any) => ({
      casillaClave: evento.casillaClave,
      hashSHA256: evento.hashSHA256,
      tipo: evento.tipo,
      tipoLabel: tipoLabel[evento.tipo] || "DESCONOCIDO",
      timestamp: Number(evento.timestamp),
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
    const total = await contrato.totalCasillas();
    const casillas = [];
    for (let i = 0; i < total; i++) {
      casillas.push(await contrato.casillasRegistradas(i));
    }
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

    // ⚠️ totalEventos omitido por límite de Alchemy Free
    res.json({
      totalCasillas,
      totalEventos: 0, // temporal, ver alternativas abajo
      bloqueActual,
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
    const total = await contrato.totalCasillas();
    const resumen: any[] = [];

    for (let i = 0; i < total; i++) {
      const clave = await contrato.casillasRegistradas(i);
      const bitacora = await contrato.obtenerBitacora(clave);

      if (bitacora.length === 0) {
        // Si no hay eventos (caso extraño), devolvemos vacío con totalEventos = 0
        resumen.push({
          clave,
          ultimoHash: null,
          ultimoTipo: null,
          ultimoTipoLabel: null,
          ultimoTimestamp: null,
          totalEventos: 0,
        });
      } else {
        const ultimo = bitacora[bitacora.length - 1];
        resumen.push({
          clave,
          ultimoHash: ultimo.hashSHA256,
          ultimoTipo: ultimo.tipo,
          ultimoTipoLabel: tipoLabel[ultimo.tipo] || "DESCONOCIDO",
          ultimoTimestamp: Number(ultimo.timestamp),
          totalEventos: bitacora.length,
        });
      }
    }

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
    const [coincide, timestamp] = await contrato.verificarHash(clave, hash);
    res.json({
      coincide,
      timestamp: coincide ? timestamp.toString() : null,
      mensaje: coincide
        ? " El hash coincide con el acta registrada"
        : " El hash no coincide con ningún registro",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al verificar el hash" });
  }
});

export default router;