import { FlujoAgendamiento } from '@/components/publico/FlujosPublicos';
import { MarcoPublico } from '@/components/publico/EstructuraPublica';

export default function AgendarPage() {
  return <MarcoPublico>
    <section className="public-content narrow-content">
      <p className="eyebrow">Atención tributaria</p><h1>Agende su consulta</h1>
      <p>Verifique sus datos para consultar las citas disponibles o revisar una cita activa.</p>
      <FlujoAgendamiento />
    </section>
  </MarcoPublico>;
}
