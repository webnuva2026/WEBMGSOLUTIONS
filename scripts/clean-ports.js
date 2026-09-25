import { execSync } from 'child_process';

const PORTS = [3000, 4000];

console.log('\n🧹 ==========================================');
console.log('   MG SOLUTIONS - LIMPIEZA DE PUERTOS');
console.log('   Puertos a verificar: ' + PORTS.join(', '));
console.log('==========================================');

for (const port of PORTS) {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const lines = output.split('\n');
      const pids = new Set();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[0] === 'TCP') {
          const localAddr = parts[1];
          const state = parts[3];
          const pid = parts[4];

          if (
            (localAddr.endsWith(`:${port}`) || localAddr.includes(`:${port}`)) &&
            (state === 'LISTENING' || state === 'ESTABLISHED')
          ) {
            if (pid && pid !== '0' && pid !== String(process.pid)) {
              pids.add(pid);
            }
          }
        }
      }

      if (pids.size > 0) {
        for (const pid of pids) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`   ✅ Proceso (PID: ${pid}) en puerto ${port} finalizado.`);
          } catch {
            // Ya finalizado
          }
        }
      } else {
        console.log(`   ✨ Puerto ${port} está libre y listo.`);
      }
    } else {
      try {
        const pid = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
        if (pid) {
          execSync(`kill -9 ${pid}`);
          console.log(`   ✅ Proceso (PID: ${pid}) en puerto ${port} finalizado.`);
        } else {
          console.log(`   ✨ Puerto ${port} está libre y listo.`);
        }
      } catch {
        console.log(`   ✨ Puerto ${port} está libre y listo.`);
      }
    }
  } catch (error) {
    console.warn(`   ⚠️ Advertencia en puerto ${port}:`, error.message);
  }
}

console.log('🚀 Puertos limpios sin interferencias.\n');
