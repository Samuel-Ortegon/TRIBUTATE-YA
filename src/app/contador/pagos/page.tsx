import { listarPagosEnRevision } from '@/lib/dataService';
import { TablaPagosRevision } from '@/components/contador/TablaPagosRevision';

export const dynamic = 'force-dynamic';
export default async function PagosPage() {
  const pagos = await listarPagosEnRevision();
  return <div className="page-content">
    <header className="page-heading"><div><p className="eyebrow">Revisión manual</p><h1>Pagos en revisión</h1><p>Los pagos por encima del valor esperado requieren aprobación o anulación.</p></div></header>
    <section className="panel-card"><TablaPagosRevision pagos={pagos} /></section>
  </div>;
}
