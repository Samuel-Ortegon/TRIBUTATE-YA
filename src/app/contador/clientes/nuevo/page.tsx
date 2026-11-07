import Link from 'next/link';
import { FormularioCliente } from '@/components/contador/FormularioCliente';

export default function NuevoClientePage() {
  return <div className="page-content narrow-content">
    <header className="page-heading"><div><p className="eyebrow">Directorio</p><h1>Registrar cliente</h1><p>Los campos son necesarios para gestionar la consulta y el contacto.</p></div></header>
    <FormularioCliente />
    <Link className="text-link back-link" href="/contador/clientes">Volver a clientes</Link>
  </div>;
}
