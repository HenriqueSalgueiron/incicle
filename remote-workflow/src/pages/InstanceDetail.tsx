import { useParams } from 'react-router-dom';

export default function InstanceDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h2>Detalhe da Instância</h2>
      <p>ID: {id}</p>
    </div>
  );
}
