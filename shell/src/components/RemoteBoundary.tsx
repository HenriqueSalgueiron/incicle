import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RemoteBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RemoteBoundary] Falha ao carregar módulo remoto:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Módulo indisponível</h2>
          <p>Não foi possível carregar o módulo de workflow.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RemoteBoundary;
