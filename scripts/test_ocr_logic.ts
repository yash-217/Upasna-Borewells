// Test script for OCR parsing logic
// Run: npx tsx scripts/test_ocr_logic.ts

const EXPENSE_TYPES = ['Fuel', 'Maintenance', 'Salary', 'Miscellaneous'] as const;
type ExpenseType = typeof EXPENSE_TYPES[number];

interface ParseResult {
    date: string;
    amount: string;
    recipient: string;
    type: ExpenseType;
    description: string;
}

function parseReceiptText(text: string): ParseResult {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const result: ParseResult = { date: '', amount: '', recipient: '', type: 'Miscellaneous', description: '' };

    // --- 1. Date Extraction ---
    let extractedDate = '';
    const upiDateMatch = text.match(/on\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (upiDateMatch) {
        const day = upiDateMatch[1].padStart(2, '0');
        const monthMap: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
        const month = monthMap[upiDateMatch[2].toLowerCase()];
        const year = upiDateMatch[3];
        extractedDate = `${year}-${month}-${day}`;
    } else {
        const isoDateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
        if (isoDateMatch) {
            extractedDate = isoDateMatch[1];
        } else {
            const ddmmyyyyMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (ddmmyyyyMatch) {
                extractedDate = `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
            }
        }
    }
    result.date = extractedDate;

    // --- 2. Amount Extraction ---
    const amountMatches = text.match(/[₹$]\s*([\d,]+(?:\.\d{1,2})?)/g);
    let maxAmount = 0;
    if (amountMatches) {
        for (const match of amountMatches) {
            const cleaned = match.replace(/[₹$,\s]/g, '');
            const val = parseFloat(cleaned);
            if (!isNaN(val) && val > maxAmount) {
                maxAmount = val;
            }
        }
    }
    result.amount = maxAmount > 0 ? maxAmount.toString() : '';

    // --- 3. Recipient Extraction ---
    let recipient = '';
    const paidToIndex = lines.findIndex(l => /paid\s*to/i.test(l));
    if (paidToIndex !== -1 && lines[paidToIndex + 1]) {
        const possibleName = lines[paidToIndex + 1];
        if (!possibleName.includes('@')) {
            recipient = possibleName;
        } else if (lines[paidToIndex + 2] && !lines[paidToIndex + 2].includes('@')) {
            recipient = lines[paidToIndex + 2];
        }
    }
    if (!recipient) {
        const nameLikeLine = lines.find(l =>
            l.length > 3 && l.length < 50 &&
            !/transaction|successful|receipt|invoice|date|utr|id/i.test(l) &&
            !/^\d/.test(l) && !l.includes('@')
        );
        if (nameLikeLine) recipient = nameLikeLine;
    }
    result.recipient = recipient;

    // --- 4. Type Guessing ---
    const lowerText = text.toLowerCase();
    let guessedType: ExpenseType = 'Miscellaneous';
    if (/fuel|petrol|diesel|gas|pump|station/i.test(lowerText)) {
        guessedType = 'Fuel';
    } else if (/repair|service|parts|tyre|garage|mechanic/i.test(lowerText)) {
        guessedType = 'Maintenance';
    } else if (/salary|wage|advance|payment to staff/i.test(lowerText)) {
        guessedType = 'Salary';
    }
    result.type = guessedType;

    // --- 5. Set Description ---
    const snippet = text.substring(0, 30).replace(/\n/g, ' ').trim();
    result.description = recipient ? `${recipient} - ${snippet}...` : `Receipt scan: ${snippet}...`;

    return result;
}

// --- Test Cases ---
console.log('--- OCR Parsing Tests ---\n');

const upiScreenshot = `
Transaction Successful
10:54 pm on 21 Dec 2025

Paid to
Sangram Fuel Station
paytm.s156u82@pty

₹33,450

Transfer Details
Transaction ID
T25122122541892949478O6

Debited from
XXXXXX3753
₹33,450

UTR: 959284902403
`;

console.log('Test 1: UPI Screenshot');
const result1 = parseReceiptText(upiScreenshot);
console.log('  Date:', result1.date, result1.date === '2025-12-21' ? '✅' : '❌');
console.log('  Amount:', result1.amount, result1.amount === '33450' ? '✅' : '❌');
console.log('  Recipient:', result1.recipient, result1.recipient === 'Sangram Fuel Station' ? '✅' : '❌');
console.log('  Type:', result1.type, result1.type === 'Fuel' ? '✅' : '❌');
console.log('  Description:', result1.description);
console.log('');

const generalReceipt = `
2024-05-15
Raj Auto Repair
Mobile: 9876543210
Tyre Replacement
Total: ₹4,500.00
`;

console.log('Test 2: General Receipt (Maintenance)');
const result2 = parseReceiptText(generalReceipt);
console.log('  Date:', result2.date, result2.date === '2024-05-15' ? '✅' : '❌');
console.log('  Amount:', result2.amount, result2.amount === '4500' ? '✅' : '❌');
console.log('  Recipient:', result2.recipient);
console.log('  Type:', result2.type, result2.type === 'Maintenance' ? '✅' : '❌');
console.log('');

const slashDateReceipt = `
Invoice Date: 15/01/2024
ABC Services
Amount: $120.50
`;

console.log('Test 3: Slash Date (DD/MM/YYYY)');
const result3 = parseReceiptText(slashDateReceipt);
console.log('  Date:', result3.date, result3.date === '2024-01-15' ? '✅' : '❌');
console.log('  Amount:', result3.amount);
console.log('');

console.log('--- Tests Complete ---');
