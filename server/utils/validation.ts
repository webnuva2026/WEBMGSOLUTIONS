export function validarDNI(dni: string): boolean {
  if (!dni || dni.length !== 8) return false;
  return /^\d{8}$/.test(dni);
}

export function validarRUC(ruc: string): boolean {
  if (!ruc || ruc.length !== 11) return false;
  if (!/^\d{11}$/.test(ruc)) return false;

  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(ruc[i]) * factores[i];
  }

  const resto = suma % 11;
  let digitoVerificador = 11 - resto;

  if (digitoVerificador === 10) digitoVerificador = 0;
  if (digitoVerificador === 11) digitoVerificador = 1;

  return digitoVerificador === parseInt(ruc[10]);
}

export function validarDocumento(tipo: string, numero: string): { valido: boolean; mensaje?: string } {
  const limpio = numero.trim();

  switch (tipo) {
    case 'RUC':
      if (!validarRUC(limpio)) {
        return { valido: false, mensaje: 'RUC inválido (debe tener 11 dígitos y dígito verificador correcto)' };
      }
      break;
    case 'DNI':
      if (!validarDNI(limpio)) {
        return { valido: false, mensaje: 'DNI inválido (debe tener 8 dígitos numéricos)' };
      }
      break;
    case 'CE':
      if (limpio.length < 8 || limpio.length > 12) {
        return { valido: false, mensaje: 'Carnet de Extranjería inválido (8-12 caracteres)' };
      }
      break;
    default:
      return { valido: false, mensaje: 'Tipo de documento no soportado' };
  }

  return { valido: true };
}

export function normalizarRUC(ruc: string): string {
  return ruc.trim().replace(/\s+/g, '');
}

export function normalizarDNI(dni: string): string {
  return dni.trim().replace(/\s+/g, '');
}