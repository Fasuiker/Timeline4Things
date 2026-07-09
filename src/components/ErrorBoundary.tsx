import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Timeline4Things error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Timeline4Things 加载失败</h1>
          <p style={{ color: '#64748b', marginBottom: 12 }}>
            页面运行时出错，请尝试刷新。若仍白屏，可清除浏览器 localStorage 后重试。
          </p>
          <pre
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: 12,
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 13,
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
