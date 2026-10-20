import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 에러 발생 시 보여줄 폴백. reset 콜백으로 경계 상태를 초기화할 수 있다. */
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** 외부 로깅(Sentry 등) 연동 지점 */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 렌더 단계에서 throw된 예외를 잡아 흰 화면(white screen) 대신 폴백 UI를 보여준다.
 *
 * 주의: 이벤트 핸들러/비동기 코드의 예외는 React 특성상 잡지 못한다(클래스 경계 공통).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: 추후 Sentry 등 외부 에러 로깅 연동 지점
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      return typeof fallback === "function"
        ? fallback(error, this.reset)
        : fallback;
    }

    return children;
  }
}
