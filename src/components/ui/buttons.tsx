import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonStyleProps = {
    variant?:   'primary' | 'secondary';
    fullWidth?: boolean;
};

export type ButtonProps = ButtonStyleProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export type ButtonLinkProps = ButtonStyleProps & {
    href:       string;
    className?: string;
    children:   React.ReactNode;
};

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon:  LucideIcon;
    /** The accessible name (an icon has no text) */
    label: string;
};

const VARIANTS = {
    primary:   'bg-forest text-ivory',
    secondary: 'border border-forest text-forest',
} as const;

function buttonClassName({ variant = 'primary', fullWidth = false }: ButtonStyleProps, className?: string): string {
    return cn(
        'inline-flex min-h-11 select-none items-center justify-center gap-2 px-6 text-label uppercase',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
    );
}

export function Button({ variant, fullWidth, type = 'button', className, ...props }: ButtonProps) {
    return <button type={type} className={buttonClassName({ variant, fullWidth }, className)} {...props} />;
}

export function ButtonLink({ href, variant, fullWidth, className, children }: ButtonLinkProps) {
    return <Link href={href} className={buttonClassName({ variant, fullWidth }, className)}>{children}</Link>;
}

export function IconButton({ icon: Icon, label, className, type = 'button', ...props }: IconButtonProps) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            className={cn('inline-flex size-11 shrink-0 items-center justify-center text-forest', className)}
            {...props}
        >
            <Icon size={20} aria-hidden />
        </button>
    );
}
