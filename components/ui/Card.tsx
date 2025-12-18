'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export function Card({
    children,
    className,
    padding = 'md',
    hover = false,
    onClick,
}: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div
            className={clsx(
                'bg-white dark:bg-nubia-dark rounded-xl border border-gray-200 dark:border-gray-700',
                'shadow-sm',
                paddings[padding],
                hover && 'transition-all duration-200 hover:shadow-md hover:border-nubia-gold/50',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}

export interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={clsx('mb-4', className)}>
            {children}
        </div>
    );
}

export interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h3 className={clsx('text-lg font-semibold text-nubia-black dark:text-nubia-white', className)}>
            {children}
        </h3>
    );
}

export interface CardDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={clsx('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>
            {children}
        </p>
    );
}

export interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
    return <div className={className}>{children}</div>;
}

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={clsx('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)}>
            {children}
        </div>
    );
}
