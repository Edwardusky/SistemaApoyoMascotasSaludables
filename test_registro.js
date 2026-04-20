const API = 'http://localhost:8080/api';

async function testRegistro() {
  console.log('1. Registrando ciudadano...');
  const curp = 'TEST' + Date.now().toString().slice(-14);
  const regRes = await fetch(`${API}/usuarios/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curp, nombre: 'Test', telefono: '1234567890', password: 'password123' })
  });
  if (!regRes.ok) throw new Error(await regRes.text());
  console.log('✓ Ciudadano registrado');

  console.log('2. Haciendo login...');
  const logRes = await fetch(`${API}/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curp, password: 'password123' })
  });
  const { token } = await logRes.json();
  console.log('✓ Login exitoso. Token:', token.substring(0, 20) + '...');

  console.log('3. Creando solicitud (como lo hace el Frontend)...');
  const payload = {
    dueno: { curp, nombre: 'Test', telefono: '1234567890' },
    mascota: {
      nombre: 'Firulais', tipoId: 1, razaId: 1, tamanoId: 4, pesoActualKg: 35,
      pesoIdealKg: 32, ima: 1.09, clasificacionIMA: 'Peso ideal'
    }
  };
  
  const solRes = await fetch(`${API}/solicitudes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  
  const solText = await solRes.text();
  console.log(`Resultado (${solRes.status}):`, solText);
}

testRegistro().catch(err => console.error('Error del Test:', err));
