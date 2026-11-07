import Link from 'next/link';
import { listarClientes } from '@/lib/dataService';
import { TablaClientes } from '@/components/contador/TablaClientes';
import { esquemaEstadoCliente } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
type Props = { searchParams: Promise<{ busqueda?: string; estado?: string }> };
export default async function ClientesPage({ searchParams }: Props) {
  const parametros = await searchParams;
  const estado = parametros.estado ? esquemaEstadoCliente.parse(parametros.estado) : undefined;
  const clientes = await listarClientes({
    ...(parametros.busqueda ? { busqueda: parametros.busqueda } : {}),
    ...(estado ? { estado } : {}),
  });
  return <div className="page-content">
    <header className="page-heading">
      <div><p className="eyebrow">Directorio</p><h1>Clientes</h1><p>Consulte y gestione los trámites de sus clientes.</p></div>
      <Link className="button button-primary" href="/contador/clientes/nuevo">Registrar cliente</Link>
    </header>
    <section className="panel-card"><TablaClientes clientes={clientes} /></section>
  </div>;
}
