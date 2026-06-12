"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or navigate back to the dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            <Button variant="default" size="sm" className="gap-1.5" render={<Link href="/dashboard" />}>
              <Home className="h-3.5 w-3.5" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
