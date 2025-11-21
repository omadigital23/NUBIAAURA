import {
    sanitizeEmail,
    sanitizeText,
    sanitizeHtml,
    sanitizePhone,
    sanitizeUrl,
    hasDangerousContent,
    sanitizeFileName,
} from '@/lib/sanitize';

describe('sanitize utilities', () => {
    describe('sanitizeEmail', () => {
        it('should normalize email to lowercase', () => {
            expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
        });

        it('should trim whitespace', () => {
            expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
        });

        it('should return empty string for invalid email', () => {
            expect(sanitizeEmail('invalid-email')).toBe('');
            expect(sanitizeEmail('test@')).toBe('');
            expect(sanitizeEmail('@example.com')).toBe('');
        });

        it('should handle empty input', () => {
            expect(sanitizeEmail('')).toBe('');
            expect(sanitizeEmail(null as any)).toBe('');
            expect(sanitizeEmail(undefined as any)).toBe('');
        });
    });

    describe('sanitizeText', () => {
        it('should strip all HTML tags', () => {
            expect(sanitizeText('<p>Hello</p>')).toBe('Hello');
            expect(sanitizeText('<script>alert("xss")</script>')).toBe('');
        });

        it('should handle plain text', () => {
            expect(sanitizeText('Hello World')).toBe('Hello World');
        });

        it('should handle empty input', () => {
            expect(sanitizeText('')).toBe('');
            expect(sanitizeText(null as any)).toBe('');
        });
    });

    describe('sanitizeHtml', () => {
        it('should allow safe HTML tags', () => {
            const input = '<p>Hello <strong>World</strong></p>';
            const output = sanitizeHtml(input);
            expect(output).toContain('Hello');
            expect(output).toContain('World');
        });

        it('should remove dangerous tags', () => {
            expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('');
            expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe('');
        });

        it('should remove event handlers', () => {
            const input = '<a onclick="alert(1)">Click</a>';
            const output = sanitizeHtml(input);
            expect(output).not.toContain('onclick');
        });

        it('should handle empty input', () => {
            expect(sanitizeHtml('')).toBe('');
        });
    });

    describe('sanitizePhone', () => {
        it('should preserve numbers and formatting characters', () => {
            expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
        });

        it('should remove invalid characters', () => {
            expect(sanitizePhone('+1abc555def1234')).toBe('+15551234');
        });

        it('should trim whitespace', () => {
            expect(sanitizePhone('  +1 555 1234  ')).toBe('+1 555 1234');
        });

        it('should handle empty input', () => {
            expect(sanitizePhone('')).toBe('');
        });
    });

    describe('sanitizeUrl', () => {
        it('should allow valid HTTP URLs', () => {
            expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
        });

        it('should allow valid HTTPS URLs', () => {
            expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
        });

        it('should reject non-HTTP protocols', () => {
            expect(sanitizeUrl('javascript:alert(1)')).toBe('');
            expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
            expect(sanitizeUrl('ftp://example.com')).toBe('');
        });

        it('should handle invalid URLs', () => {
            expect(sanitizeUrl('not-a-url')).toBe('');
            expect(sanitizeUrl('')).toBe('');
        });
    });

    describe('hasDangerousContent', () => {
        it('should detect script tags', () => {
            expect(hasDangerousContent('<script>alert(1)</script>')).toBe(true);
            expect(hasDangerousContent('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
        });

        it('should detect javascript: protocol', () => {
            expect(hasDangerousContent('javascript:alert(1)')).toBe(true);
            expect(hasDangerousContent('JavaScript:alert(1)')).toBe(true);
        });

        it('should detect event handlers', () => {
            expect(hasDangerousContent('<div onclick="alert(1)"></div>')).toBe(true);
            expect(hasDangerousContent('<img onerror="alert(1)" />')).toBe(true);
        });

        it('should detect dangerous tags', () => {
            expect(hasDangerousContent('<iframe src="evil.com"></iframe>')).toBe(true);
            expect(hasDangerousContent('<object data="evil.swf"></object>')).toBe(true);
            expect(hasDangerousContent('<embed src="evil.swf"></embed>')).toBe(true);
        });

        it('should return false for safe content', () => {
            expect(hasDangerousContent('Hello World')).toBe(false);
            expect(hasDangerousContent('<p>Safe content</p>')).toBe(false);
        });

        it('should handle empty input', () => {
            expect(hasDangerousContent('')).toBe(false);
            expect(hasDangerousContent(null as any)).toBe(false);
        });
    });

    describe('sanitizeFileName', () => {
        it('should remove path separators', () => {
            expect(sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
            expect(sanitizeFileName('..\\..\\windows\\system32')).toBe('windowssystem32');
        });

        it('should remove dangerous characters', () => {
            expect(sanitizeFileName('file<>:"|?*.txt')).toBe('file.txt');
        });

        it('should trim whitespace', () => {
            expect(sanitizeFileName('  file.txt  ')).toBe('file.txt');
        });

        it('should handle normal filenames', () => {
            expect(sanitizeFileName('document.pdf')).toBe('document.pdf');
            expect(sanitizeFileName('image_2024.jpg')).toBe('image_2024.jpg');
        });

        it('should handle empty input', () => {
            expect(sanitizeFileName('')).toBe('');
        });
    });
});
