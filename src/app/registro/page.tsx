import { FormularioRegistro } from '@/components/publico/FlujosPublicos';
import { MarcoPublico } from '@/components/publico/EstructuraPublica';

export default function RegistroPage() {
  return <MarcoPublico>
    <section className="public-content narrow-content">
      <p className="eyebrow">Atención tributaria</p><h1>Regístrese</h1>
      <p>Ingrese sus datos para gestionar su consulta y recibir información relacionada.</p>
      <FormularioRegistro />
    </section>
  </MarcoPublico>;
}
