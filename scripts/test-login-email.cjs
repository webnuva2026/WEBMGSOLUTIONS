const fetch = globalThis.fetch;

async function testLogin() {
  const url = 'http://localhost:4000/api/auth/login';

  console.log('--- Test 1: Intento con username antiguo (debe fallar requiriendo correo) ---');
  let r1 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'CambiarEsto2026!' }),
  });
  let d1 = await r1.json();
  console.log('Status:', r1.status, '| Respuesta:', d1.message);

  console.log('\n--- Test 2: Intento con correo inexistente ---');
  let r2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'noexiste@mgsolutions.pe', password: 'CambiarEsto2026!' }),
  });
  let d2 = await r2.json();
  console.log('Status:', r2.status, '| Respuesta:', d2.message);

  console.log('\n--- Test 3: Login exitoso con correo superadmin@mgsolutions.pe ---');
  let r3 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@mgsolutions.pe', password: 'CambiarEsto2026!' }),
  });
  let d3 = await r3.json();
  console.log('Status:', r3.status, '| Éxito:', d3.success, '| Usuario:', d3.user?.email, '| Rol:', d3.user?.rol);

  console.log('\n--- Test 4: Login con mayúsculas SUPERADMIN@MGSOLUTIONS.PE ---');
  let r4 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'SUPERADMIN@MGSOLUTIONS.PE', password: 'CambiarEsto2026!' }),
  });
  let d4 = await r4.json();
  console.log('Status:', r4.status, '| Éxito:', d4.success, '| Usuario:', d4.user?.email);
}

testLogin().catch(console.error);
