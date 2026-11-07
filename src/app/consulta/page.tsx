import { FormularioConsulta } from '@/components/publico/FlujosPublicos';
import { MarcoPublico } from '@/components/publico/EstructuraPublica';

export default function ConsultaPage() {
  return <MarcoPublico>
    <section className="public-content narrow-content">
      <p className="eyebrow">Consulta tributaria</p><h1>Consulte su fecha límite</h1>
      <p>La fecha se calcula con el calendario tributario vigente y los dos últimos dígitos de su cédula.</p>
      <FormularioConsulta />
    </section>
  </MarcoPublico>;
}
