/**
 * Input Sanitization Utilities for NUBIA AURA
 * 
 * Provides functions to sanitize user input and prevent XSS attacks.
 * Server-safe implementation without DOM dependencies.
 */

/**
 * Sanitize HTML content
 * Removes potentially dangerous HTML tags and attributes
 * Server-safe implementation using regex
 */
export function sanitizeHtml(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    // Remove all HTML tags except allowed ones
    const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'];
    const allowedTagsPattern = allowedTags.join('|');

    // First, remove all script tags and their content
    let cleaned = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove all event handlers (onclick, onerror, etc.)
    cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    cleaned = cleaned.replace(/javascript:/gi, '');

    // Remove dangerous tags (iframe, object, embed, etc.)
    cleaned = cleaned.replace(/<(iframe|object|embed|link|meta|base)[^>]*>/gi, '');

    // Remove all tags except allowed ones
    cleaned = cleaned.replace(new RegExp(`<\\/?(?!(${allowedTagsPattern})\\b)[^>]+>`, 'gi'), '');

    // For anchor tags, only keep href and target attributes
    cleaned = cleaned.replace(/<a\s+([^>]*?)>/gi, (_match, attrs) => {
        const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
        const targetMatch = attrs.match(/target\s*=\s*["']([^"']*)["']/i);

        let result = '<a';
        if (hrefMatch && !hrefMatch[1].match(/javascript:/i)) {
            result += ` href="${hrefMatch[1]}"`;
        }
        if (targetMatch) {
            result += ` target="${targetMatch[1]}"`;
        }
        result += '>';

        return result;
    });

    return cleaned;
}

/**
 * Sanitize plain text
 * Strips all HTML and returns plain text
 */
export function sanitizeText(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    // First, remove script tags and their content
    const cleaned = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Then remove all remaining HTML tags
    return cleaned.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize email address
 * Basic email validation and sanitization
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
        return '';
    }

    // Remove whitespace and convert to lowercase
    const cleaned = email.trim().toLowerCase();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleaned)) {
        return '';
    }

    return cleaned;
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + at the start
 */
export function sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
        return '';
    }

    // Allow + at the start, then only digits, spaces, hyphens, parentheses
    const cleaned = phone.trim().replace(/[^\d\s\-\+\(\)]/g, '');

    return cleaned;
}

/**
 * Sanitize URL
 * Validates and sanitizes URLs, only allows http/https protocols
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
        return '';
    }

    try {
        const parsed = new URL(url);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        return parsed.toString();
    } catch {
        return '';
    }
}

/**
 * Sanitize object - recursively sanitizes all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
    obj: T,
    sanitizer: (value: string) => string = sanitizeText
): T {
    const sanitized = { ...obj };

    for (const key in sanitized) {
        const value = sanitized[key];

        if (typeof value === 'string') {
            sanitized[key] = sanitizer(value) as any;
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value, sanitizer) as any;
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item: any) =>
                typeof item === 'string'
                    ? sanitizer(item)
                    : typeof item === 'object'
                        ? sanitizeObject(item, sanitizer)
                        : item
            ) as any;
        }
    }

    return sanitized;
}

/**
 * Escape SQL-like patterns (for additional safety with raw queries)
 * Note: Use parameterized queries with Supabase instead
 */
export function escapeSql(value: string): string {
    if (!value || typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
}

/**
 * Validate and sanitize file upload
 */
export function sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
        return '';
    }

    // Remove path separators and dangerous characters
    return fileName
        .replace(/[\/\\]/g, '')
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*]/g, '')
        .trim();
}

/**
 * Check if a string contains potentially dangerous content
 */
export function hasDangerousContent(value: string): boolean {
    if (!value || typeof value !== 'string') {
        return false;
    }

    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // event handlers like onclick=
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\(/i,
        /expression\(/i,
    ];

    return dangerousPatterns.some((pattern) => pattern.test(value));
}

/**
 * Sanitization middleware for API requests
 */
export function sanitizeRequestBody<T extends Record<string, any>>(
    body: T,
    config?: {
        allowHtml?: boolean;
        fields?: {
            [K in keyof T]?: 'html' | 'text' | 'email' | 'phone' | 'url';
        };
    }
): T {
    const { allowHtml = false, fields = {} } = config || {};
    const sanitized = { ...body };

    for (const key in sanitized) {
        const value = sanitized[key];
        const fieldType = fields ? (fields as any)[key] : undefined;

        if (typeof value === 'string') {
            switch (fieldType) {
                case 'html':
                    sanitized[key] = sanitizeHtml(value) as any;
                    break;
                case 'email':
                    sanitized[key] = sanitizeEmail(value) as any;
                    break;
                case 'phone':
                    sanitized[key] = sanitizePhone(value) as any;
                    break;
                case 'url':
                    sanitized[key] = sanitizeUrl(value) as any;
                    break;
                case 'text':
                default:
                    sanitized[key] = allowHtml ? sanitizeHtml(value) : sanitizeText(value) as any;
            }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeRequestBody(value, config as any) as any;
        }
    }

    return sanitized;
}
