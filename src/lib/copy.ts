// All user-facing text in one place, grouped by screen. No em dashes, no shop names.

export const COPY = {
    common: {
        tryAgain: 'Try again',
        goHome:   'Go home',
    },
    stock: {
        empty: 'Nothing is in stock right now. Please check back soon.',
    },
    status: {
        errorTitle:   'Something went wrong',
        errorMessage: 'The shop could not be loaded. Please try again in a moment.',
        errorId:      (digest: string) => `Reference: ${digest}`,
    },
} as const;
