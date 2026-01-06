export const formatPhoneNumberDisplay = (phone: string | undefined): string => {
    if (!phone) return 'N/A';
    return phone;
};

export const formatPhoneNumberInput = (value: string): string => {
    // Allow empty value
    if (!value) return '';

    // If user explicitly types +, allow it to start with +
    if (value.startsWith('+')) {
        return value;
    }

    // Otherwise, if it looks like they are starting to type a number, prepend +91
    // Remove any existing +91 prefix to avoid duplication if they copy-paste
    const clean = value.replace(/^\+91\s?/, '').replace(/^\+91/, '');

    return `+91 ${clean}`;
};
