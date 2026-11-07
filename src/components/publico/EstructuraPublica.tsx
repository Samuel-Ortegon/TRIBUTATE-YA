import Link from 'next/link';

export function EncabezadoPublico() {
  return <header className="public-header"><Link href="/" className="public-brand"><span className="brand-mark">T</span>Tributate Ya</Link><Link href="/login">Acceso del contador</Link></header>;
}
export function PiePublico() {
  return <footer className="public-footer">
    <p>Sus datos personales se utilizan para gestionar su consulta y contactarle sobre ella. Puede solicitar su consulta, actualización o supresión al contador, conforme a la Ley 1581 de 2012.</p>
  </footer>;
}
export function MarcoPublico({ children }: { children: React.ReactNode }) {
  return <div className="public-shell"><EncabezadoPublico /><main className="public-main">{children}</main><PiePublico /></div>;
}
