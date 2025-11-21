'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useParams } from 'next/navigation';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component with i18n support
 * Catches React rendering errors and displays fallback UI
 */
class ErrorBoundaryClass extends Component<Props & { locale: string }, State> {
    constructor(props: Props & { locale: string }) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }

        // Send error to Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Load translations
            const translations = {
                fr: {
                    title: "Oups ! Quelque chose s'est mal passé",
                    message: "Nous sommes désolés, mais une erreur inattendue s'est produite. Notre équipe a été notifiée et travaille pour résoudre le problème.",
                    reload: "Recharger la page",
                    home: "Retour à l'accueil",
                },
                en: {
                    title: "Oops! Something went wrong",
                    message: "We're sorry, but an unexpected error occurred. Our team has been notified and is working to resolve the issue.",
                    reload: "Reload page",
                    home: "Back to home",
                },
            };

            const locale = this.props.locale as 'fr' | 'en';
            const t = translations[locale] || translations.fr;

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="mb-8">
                            <svg
                                className="mx-auto h-16 w-16 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            {t.title}
                        </h1>

                        <p className="text-gray-600 mb-8">
                            {t.message}
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-800 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C4A037] transition-colors"
                            >
                                {t.reload}
                            </button>

                            <button
                                onClick={() => (window.location.href = `/${locale}`)}
                                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                {t.home}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Wrapper to get locale from Next.js params
 */
export function ErrorBoundary({ children, fallback }: Props) {
    const params = useParams();
    const locale = (params?.locale as string) || 'fr';

    return (
        <ErrorBoundaryClass locale={locale} fallback={fallback}>
            {children}
        </ErrorBoundaryClass>
    );
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
