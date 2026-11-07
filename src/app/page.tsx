import Link from 'next/link';
import { MarcoPublico } from '@/components/publico/EstructuraPublica';

export default function HomePage() {
  return <MarcoPublico>
    <section className="home-hero">
      <p className="eyebrow">Agenda tributaria para personas naturales</p>
      <h1>Su próximo paso tributario, con claridad.</h1>
      <p>Consulte fechas límite, registre sus datos y coordine una cita de orientación tributaria en un solo lugar.</p>
      <div className="home-actions"><Link className="button button-primary" href="/agendar">Agendar consulta</Link><Link className="button button-secondary" href="/consulta">Consultar fecha límite</Link></div>
    </section>
    <section className="home-cards">
      <Link href="/registro" className="home-card"><span>01</span><h2>Registre sus datos</h2><p>Comparta la información necesaria para gestionar su consulta.</p><strong>Iniciar registro →</strong></Link>
      <Link href="/consulta" className="home-card"><span>02</span><h2>Revise su fecha límite</h2><p>Consulte el vencimiento según el calendario tributario vigente.</p><strong>Consultar fecha →</strong></Link>
      <Link href="/agendar" className="home-card"><span>03</span><h2>Agende su consulta</h2><p>Verifique sus datos y seleccione un horario disponible.</p><strong>Ver horarios →</strong></Link>
    </section>
  </MarcoPublico>;
}
