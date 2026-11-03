require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mg_solutions_super_secret_jwt_key_2024_secure_and_encrypted_chiclayo';

// Crear token para admin
const token = jwt.sign(
  {
    userId: 1,
    username: 'superadmin',
    rol: 'ADMIN',
    modulosPermitidos: ['*'],
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

(async () => {
  console.log('--- TEST E2E: MG SOLUTIONS VENTAS & GARANTÍAS ---');

  // 1. Probar Listado de Ventas
  const vRes = await fetch('http://localhost:4000/api/ventas', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const vData = await vRes.json();
  console.log('1. Historial de Ventas en MySQL:', {
    total: vData.total,
    ventas: vData.ventas?.map(v => ({
      comprobante: v.codigoComprobante,
      cliente: v.cliente?.nombre,
      total: 'S/ ' + v.total,
      fecha: v.fechaVenta,
    }))
  });

  // 2. Probar Garantía Caso 1: VIGENTE
  const g1Res = await fetch('http://localhost:4000/api/garantias/verificar?serie=LNV-X1C-2026-001', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const g1 = await g1Res.json();
  console.log('\n2. Garantía Caso 1 (LNV-X1C-2026-001):', {
    encontrado: g1.encontrado,
    estado: g1.estado,
    diasRestantes: g1.diasRestantes,
    cliente: g1.cliente?.nombre,
    producto: g1.producto?.nombre,
    modelo: g1.producto?.modelo,
    especificaciones: g1.producto?.caracteristicas,
  });

  // 3. Probar Garantía Caso 2: POR VENCER (15 días)
  const g2Res = await fetch('http://localhost:4000/api/garantias/verificar?serie=EPS-L3250-X58821', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const g2 = await g2Res.json();
  console.log('\n3. Garantía Caso 2 (EPS-L3250-X58821):', {
    encontrado: g2.encontrado,
    estado: g2.estado,
    diasRestantes: g2.diasRestantes,
    cliente: g2.cliente?.nombre,
    producto: g2.producto?.nombre,
    modelo: g2.producto?.modelo,
  });

  // 4. Probar Garantía Caso 3: VENCIDA (-55 días)
  const g3Res = await fetch('http://localhost:4000/api/garantias/verificar?serie=LNV-GB15-994101', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const g3 = await g3Res.json();
  console.log('\n4. Garantía Caso 3 (LNV-GB15-994101):', {
    encontrado: g3.encontrado,
    estado: g3.estado,
    diasVencida: g3.diasVencida,
    cliente: g3.cliente?.nombre,
    producto: g3.producto?.nombre,
  });

  // 5. Probar Creación de Nueva Venta en POS
  console.log('\n5. Probando creación de venta POS con serie física nueva...');
  const nuevaVentaRes = await fetch('http://localhost:4000/api/ventas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      clienteId: 1, // Arnold Cachay
      tipoComprobanteId: 1, // BOLETA
      metodoPagoId: 1, // EFECTIVO
      sucursalId: 1,
      items: [
        {
          productoId: 1,
          cantidad: 1,
          precioUnitario: 3899.00,
          series: ['LNV-X1C-2026-999'],
        }
      ],
      observaciones: 'Venta de prueba automatizada E2E con garantía'
    })
  });
  const nuevaVentaData = await nuevaVentaRes.json();
  console.log('Resultado Venta POS:', nuevaVentaData);

  // 6. Verificar inmediatamente la garantía de la serie recién vendida
  if (nuevaVentaData.success) {
    const gNuevaRes = await fetch('http://localhost:4000/api/garantias/verificar?serie=LNV-X1C-2026-999', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const gNueva = await gNuevaRes.json();
    console.log('\n6. Garantía de producto recién vendido en POS (LNV-X1C-2026-999):', {
      encontrado: gNueva.encontrado,
      estado: gNueva.estado,
      diasRestantes: gNueva.diasRestantes,
      comprobante: gNueva.comprobante,
      cliente: gNueva.cliente?.nombre
    });
  }
})();
