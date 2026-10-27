'use client';

import { useEffect, useRef } from 'react';
import { COPY } from '@/lib/copy';

type Bound = { min: number | null; max: number | null };

/**
 * A two-handle slider made of two overlaid native range inputs. Moving a handle only updates the draft;
 * the native change event (release, not input) commits. A value at its bound is reported as null, so it
 * adds no param. The inputs carry the API's units (cents, millimetres), so the GET form sends them as is.
 */
export function RangeSlider({ names, bounds, step, value, label, format, readout, onDraft, onCommit }: {
    names:    { min: string; max: string };
    bounds:   { min: number; max: number };
    step:     number;
    value:    Bound;
    label:    string;
    format:   (n: number) => string;
    readout:  (min: string, max: string) => string;
    onDraft:  (v: Bound) => void;
    onCommit: (v: Bound) => void;
}) {
    const track = useRef<HTMLDivElement>(null);
    const lo = value.min ?? bounds.min;
    const hi = value.max ?? bounds.max;
    const report = (min: number, max: number): Bound => ({ min: min === bounds.min ? null : min, max: max === bounds.max ? null : max });

    // React's onChange is the input event; the native change event fires on release (Pitfall 8)
    useEffect(() => {
        const el = track.current;
        if (!el) return;
        const done = () => onCommit(value);
        el.addEventListener('change', done);
        return () => el.removeEventListener('change', done);
    }, [onCommit, value]);

    const span = bounds.max - bounds.min;
    const left = ((lo - bounds.min) / span) * 100;
    const right = 100 - ((hi - bounds.min) / span) * 100;
    // Two handles at one end overlap: the one that can still move must be on top
    const minOnTop = lo > bounds.min + span / 2;

    return (
        <div>
            <p className="text-base">{readout(format(lo), format(hi))}</p>
            <div ref={track} className="range-dual relative mt-2 h-11">
                {/* The inputs' thumbs are 44px, so their centres travel 22px in from each edge: the visual track does too */}
                <div aria-hidden="true" className="absolute inset-x-[22px] top-1/2 h-1 -translate-y-1/2 bg-stone">
                    <div className="absolute inset-y-0 bg-forest" style={{ left: `${left}%`, right: `${right}%` }} />
                </div>
                <input
                    type="range"
                    name={names.min}
                    min={bounds.min}
                    max={bounds.max}
                    step={step}
                    value={lo}
                    aria-label={COPY.catalogue.rangeMin(label)}
                    aria-valuetext={format(lo)}
                    onChange={e => onDraft(report(Math.min(Number(e.target.value), hi), hi))}
                    className={minOnTop ? 'z-10' : undefined}
                />
                <input
                    type="range"
                    name={names.max}
                    min={bounds.min}
                    max={bounds.max}
                    step={step}
                    value={hi}
                    aria-label={COPY.catalogue.rangeMax(label)}
                    aria-valuetext={format(hi)}
                    onChange={e => onDraft(report(lo, Math.max(Number(e.target.value), lo)))}
                />
            </div>
        </div>
    );
}
