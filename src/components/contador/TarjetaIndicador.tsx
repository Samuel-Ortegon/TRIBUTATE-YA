import Link from 'next/link';

export function TarjetaIndicador({ titulo, valor, href }: { titulo: string; valor: number; href?: string }) {
  const contenido = <><span>{titulo}</span><strong>{valor}</strong></>;
  return href
    ? <Link className="indicator-card" href={href}>{contenido}</Link>
    : <div className="indicator-card">{contenido}</div>;
}
