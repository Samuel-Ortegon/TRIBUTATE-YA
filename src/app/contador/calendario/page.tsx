import { listarCalendario } from '@/lib/dataService';
import { GestionCalendario } from '@/components/contador/GestionCalendario';

export const dynamic = 'force-dynamic';
export default async function CalendarioPage() {
  const rangos = await listarCalendario();
  return <div className="page-content">
    <header className="page-heading"><div><p className="eyebrow">Vencimientos</p><h1>Calendario tributario</h1><p>Administre las fechas límite por año gravable y últimos dígitos.</p></div></header>
    <section className="panel-card"><GestionCalendario rangos={rangos} /></section>
  </div>;
}
