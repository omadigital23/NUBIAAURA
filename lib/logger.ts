/**
 * Système de logging production-ready
 * Remplace les console.log par un système structuré
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev && this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      };
      
      console.error(this.formatMessage('error', message, errorContext));
      
      // En production, envoyer à Sentry
      if (!this.isDev && typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          extra: context,
        });
      }
    }
  }

  // Helpers spécifiques
  api(method: string, path: string, status: number, duration?: number): void {
    this.info('API Request', {
      method,
      path,
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  payment(event: string, data: any): void {
    this.info('Payment Event', {
      event,
      ...data,
    });
  }

  auth(event: string, userId?: string): void {
    this.info('Auth Event', {
      event,
      userId,
    });
  }
}

export const logger = new Logger();

// Helper pour mesurer la performance
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    if (duration > 1000) {
      logger.warn('Slow operation', { name, duration: `${duration.toFixed(2)}ms` });
    } else {
      logger.debug('Operation completed', { name, duration: `${duration.toFixed(2)}ms` });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error('Operation failed', error, { name, duration: `${duration.toFixed(2)}ms` });
    throw error;
  }
}
