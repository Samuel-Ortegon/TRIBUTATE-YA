export function enmascararCC(cc: string): string {
  return `${'*'.repeat(Math.max(0, cc.length - 4))}${cc.slice(-4)}`;
}

export function coincidenUltimos4(telefono: string, ultimos4: string): boolean {
  return /^\d{4}$/.test(ultimos4) && telefono.slice(-4) === ultimos4;
}
