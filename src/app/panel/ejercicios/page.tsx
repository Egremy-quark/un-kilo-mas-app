import { Biblioteca } from './Biblioteca';

export default function PaginaEjercicios() {
  return (
    <>
      <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
        Biblioteca de <em>ejercicios</em>
      </h1>
      <Biblioteca />
    </>
  );
}
