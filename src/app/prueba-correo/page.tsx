import { notFound } from 'next/navigation';

import PruebaCorreoFormulario from './PruebaCorreoFormulario';

export default function PruebaCorreoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <PruebaCorreoFormulario />;
}
