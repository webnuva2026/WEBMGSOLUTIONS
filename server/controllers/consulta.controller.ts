import { Request, Response } from 'express';

// Fallback de demostración en caso de corte de internet en el aula de sustentación
const FALLBACK_RUCS: Record<string, any> = {
  '20609737524': {
    ruc: '20609737524',
    razonSocial: 'MG SOLUTIONS GROUP S.A.C.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'AV. PEDRO RUIZ NRO. 349 INT. 09C (MERCADO MODELO)',
    distrito: 'CHICLAYO',
    provincia: 'CHICLAYO',
    departamento: 'LAMBAYEQUE',
    ubigeo: '140101',
  },
  '20100047218': {
    ruc: '20100047218',
    razonSocial: 'BANCO DE CREDITO DEL PERU',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'JR. CENTENARIO NRO. 156 URB. LADERAS DE MELGAREJO',
    distrito: 'LA MOLINA',
    provincia: 'LIMA',
    departamento: 'LIMA',
    ubigeo: '150114',
  },
  '20131312955': {
    ruc: '20131312955',
    razonSocial: 'SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA - SUNAT',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'AV. GARCILASO DE LA VEGA NRO. 1472',
    distrito: 'LIMA',
    provincia: 'LIMA',
    departamento: 'LIMA',
    ubigeo: '150101',
  },
  '20100070970': {
    ruc: '20100070970',
    razonSocial: 'SUPERMERCADOS PERUANOS SOCIEDAD ANONIMA O S.P.S.A.',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    direccion: 'CAL. MORELLI NRO. 181 INT. P-2',
    distrito: 'SAN BORJA',
    provincia: 'LIMA',
    departamento: 'LIMA',
    ubigeo: '150130',
  },
};

const FALLBACK_DNIS: Record<string, any> = {
  '43716592': {
    dni: '43716592',
    nombres: 'MARLON WILLY',
    apellidoPaterno: 'BUSCH',
    apellidoMaterno: 'RUDAS',
    nombreCompleto: 'MARLON WILLY BUSCH RUDAS',
  },
  '71234567': {
    dni: '71234567',
    nombres: 'CARLOS ALBERTO',
    apellidoPaterno: 'RODRIGUEZ',
    apellidoMaterno: 'MENDOZA',
    nombreCompleto: 'CARLOS ALBERTO RODRIGUEZ MENDOZA',
  },
  '12345678': {
    dni: '12345678',
    nombres: 'JUAN DIEGO',
    apellidoPaterno: 'FLORES',
    apellidoMaterno: 'QUISPE',
    nombreCompleto: 'JUAN DIEGO FLORES QUISPE',
  },
};

/**
 * GET /api/consultas/ruc/:ruc
 * Consulta de RUC en SUNAT mediante API REST oficial de Perú
 */
export async function consultarRuc(req: Request, res: Response): Promise<void> {
  try {
    const ruc = String(req.params.ruc || '').trim();

    if (!/^\d{11}$/.test(ruc)) {
      res.status(400).json({
        success: false,
        message: 'El RUC debe contener exactamente 11 dígitos numéricos.',
      });
      return;
    }

    // 1. Intentar consulta en vivo a API REST Perú
    try {
      const response = await fetch(`https://api.apis.net.pe/v1/ruc?numero=${ruc}`, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.nombre) {
          const direccionCompleta = [
            data.direccion,
            data.distrito,
            data.provincia,
            data.departamento,
          ]
            .filter(Boolean)
            .join(' - ');

          res.json({
            success: true,
            source: 'SUNAT_LIVE',
            data: {
              ruc: data.numeroDocumento || ruc,
              razonSocial: data.nombre.trim(),
              estado: data.estado || 'ACTIVO',
              condicion: data.condicion || 'HABIDO',
              direccion: data.direccion ? data.direccion.trim() : direccionCompleta,
              distrito: data.distrito || '',
              provincia: data.provincia || '',
              departamento: data.departamento || '',
              ubigeo: data.ubigeo || '',
            },
          });
          return;
        }
      }
    } catch (netErr: any) {
      console.warn('Fallo en consulta SUNAT en vivo, usando respaldo local:', netErr.message);
    }

    // 2. Fallback de respaldo o demostración
    if (FALLBACK_RUCS[ruc]) {
      res.json({
        success: true,
        source: 'CACHE_DEMO',
        data: FALLBACK_RUCS[ruc],
      });
      return;
    }

    // Si no se encuentra en línea ni en demo
    res.status(404).json({
      success: false,
      message: `No se encontró información en SUNAT para el RUC ${ruc}. Verifique que el número sea correcto.`,
    });
  } catch (error: any) {
    console.error('Error al consultar RUC:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar SUNAT.' });
  }
}

/**
 * GET /api/consultas/dni/:dni
 * Consulta de DNI en RENIEC mediante API REST oficial de Perú
 */
export async function consultarDni(req: Request, res: Response): Promise<void> {
  try {
    const dni = String(req.params.dni || '').trim();

    if (!/^\d{8}$/.test(dni)) {
      res.status(400).json({
        success: false,
        message: 'El DNI debe contener exactamente 8 dígitos numéricos.',
      });
      return;
    }

    // 1. Intentar consulta en vivo a API REST RENIEC
    try {
      const response = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.nombre) {
          res.json({
            success: true,
            source: 'RENIEC_LIVE',
            data: {
              dni: data.numeroDocumento || dni,
              nombres: data.nombres || '',
              apellidoPaterno: data.apellidoPaterno || '',
              apellidoMaterno: data.apellidoMaterno || '',
              nombreCompleto: data.nombre.trim(),
            },
          });
          return;
        }
      }
    } catch (netErr: any) {
      console.warn('Fallo en consulta RENIEC en vivo, usando respaldo local:', netErr.message);
    }

    // 2. Fallback de respaldo o demostración
    if (FALLBACK_DNIS[dni]) {
      res.json({
        success: true,
        source: 'CACHE_DEMO',
        data: FALLBACK_DNIS[dni],
      });
      return;
    }

    res.status(404).json({
      success: false,
      message: `No se encontró información en RENIEC para el DNI ${dni}. Verifique que el número sea correcto.`,
    });
  } catch (error: any) {
    console.error('Error al consultar DNI:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar RENIEC.' });
  }
}
