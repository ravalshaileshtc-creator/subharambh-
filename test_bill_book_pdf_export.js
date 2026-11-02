// ==============================================================================
// SHUBH CELEBRATIONS – BILL BOOK MULTILINGUAL PDF EXPORT TEST SUITE
// Tests:
// 1. Language isolation: English, Gujarati, Hindi separate templates
// 2. Unicode font embedding (Inter, Noto Sans Gujarati, Noto Sans Devanagari)
// 3. Real PDF generation with exact filename 'Shubh-Celebrations-Bill-BILLNUMBER.pdf'
// 4. Binary PDF signature verification (%PDF- ... %%EOF)
// 5. WhatsApp share text localization
// ==============================================================================

import fs from 'fs';
import path from 'path';
import {
  INVOICE_I18N,
  generateA4InvoiceHTML,
  generateWhatsAppInvoiceShareText,
  generateAndDownloadInvoicePDF,
} from './src/services/billBookService.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING BILL BOOK MULTILINGUAL PDF EXPORT TESTS');
  console.log('======================================================\n');

  const sampleBill = {
    id: 1001,
    bill_number: 'VD-2026-0001',
    vendor_id: 1,
    vendor_user_id: 'c0570000-0000-4000-8000-009825123401',
    vendor_name: 'Vallabh Decoration & Event Management',
    vendor_phone: '9825123401',
    vendor_location: 'Behind Deep Hospital, Bamroli Road, Godhra',
    customer_id: 'c0570000-0000-4000-8000-009825098765',
    customer_name: 'Rajeshbhai Patel',
    customer_phone: '9825098765',
    event_name: 'Royal Wedding & Reception Mandap',
    event_date: '2026-12-18',
    event_location: 'Motibaug Party Plot, Godhra',
    items: [
      { id: 1, description: 'Grand Rajwadi Entrance Gate (40ft Fiber & Floral Setup)', quantity: 1, rate: 35000, amount: 35000 },
      { id: 2, description: 'Royal Stage LED Backdrop & Couple Sofa Seating', quantity: 1, rate: 25000, amount: 25000 },
      { id: 3, description: 'Carved Wooden Chori Mandap with Holy Fire Setup', quantity: 1, rate: 20000, amount: 20000 },
      { id: 4, description: 'Ambient Halogen & Warm White LED Pathway Lighting', quantity: 1, rate: 10000, amount: 10000 },
    ],
    subtotal: 90000.00,
    discount: 5000.00,
    additional_charges: 2000.00,
    tax_percent: 5.00,
    tax_amount: 4350.00,
    grand_total: 91350.00,
    advance_paid: 30000.00,
    total_paid: 60000.00,
    balance_due: 31350.00,
    payment_method: 'UPI',
    payment_status: 'partial',
    cancellation_reason: null,
    notes: 'Please clear remaining balance 24 hours prior to wedding setup.',
    terms: '1. 30% advance required for booking confirmation.\n2. In case of cancellation due to force majeure, 50% advance is refundable.\n3. Any physical damage to decorative structures during event will be billed separately.',
    payments: [
      { id: 'PAY-1001-1', date: '2026-10-15', amount: 30000.00, method: 'UPI', reference: 'UPI/629182910291/HDFC' },
      { id: 'PAY-1001-2', date: '2026-10-28', amount: 30000.00, method: 'Bank Transfer', reference: 'NEFT/SBIN0029182' },
    ],
    created_at: '2026-10-15T10:30:00.000Z',
    updated_at: '2026-10-28T16:00:00.000Z',
  };

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: Multilingual HTML Generation & Font Embedding
  // ----------------------------------------------------------------------------
  console.log('--- 1. Multilingual HTML Generation & Font Embedding ---');

  const htmlEn = generateA4InvoiceHTML(sampleBill, 'en');
  const htmlGu = generateA4InvoiceHTML(sampleBill, 'gu');
  const htmlHi = generateA4InvoiceHTML(sampleBill, 'hi');

  assert(htmlEn.includes('TAX INVOICE'), 'English template contains "TAX INVOICE"');
  assert(htmlEn.includes('Grand Total'), 'English template contains "Grand Total"');
  assert(htmlEn.includes('Billed To (Client)'), 'English template contains "Billed To (Client)"');
  assert(htmlEn.includes('Inter'), 'English template references Inter font');

  assert(htmlGu.includes('ટેક્સ ઇન્વોઇસ / બિલ'), 'Gujarati template contains "ટેક્સ ઇન્વોઇસ / બિલ"');
  assert(htmlGu.includes('ચુકવવાપાત્ર કુલ રકમ'), 'Gujarati template contains "ચુકવવાપાત્ર કુલ રકમ"');
  assert(htmlGu.includes('ગ્રાહકની વિગત (ક્લાયન્ટ)'), 'Gujarati template contains "ગ્રાહકની વિગત (ક્લાયન્ટ)"');
  assert(htmlGu.includes('નિયમો અને શરતો'), 'Gujarati template contains "નિયમો અને શરતો"');
  assert(htmlGu.includes('Noto Sans Gujarati'), 'Gujarati template embeds Google Font Noto Sans Gujarati');
  assert(!htmlGu.includes('TAX INVOICE'), 'Gujarati template strictly isolates language (no "TAX INVOICE")');

  assert(htmlHi.includes('टैक्स इनवॉइस / बिल'), 'Hindi template contains "टैक्स इनवॉइस / बिल"');
  assert(htmlHi.includes('कुल देय राशि'), 'Hindi template contains "कुल देय राशि"');
  assert(htmlHi.includes('बिल विवरण (ग्राहक)'), 'Hindi template contains "बिल विवरण (ग्राहक)"');
  assert(htmlHi.includes('नियम एवं शर्तें'), 'Hindi template contains "नियम एवं शर्तें"');
  assert(htmlHi.includes('Noto Sans Devanagari'), 'Hindi template embeds Google Font Noto Sans Devanagari');
  assert(!htmlHi.includes('TAX INVOICE'), 'Hindi template strictly isolates language (no "TAX INVOICE")');

  // Verify A4 and Page Break Rules
  assert(htmlEn.includes('size: A4 portrait'), 'Print CSS includes A4 portrait page size');
  assert(htmlEn.includes('page-break-inside: avoid'), 'Print CSS enforces clean page break avoidance');

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: WhatsApp Share Text Localization
  // ----------------------------------------------------------------------------
  console.log('\n--- 2. WhatsApp Share Text Localization ---');

  const waEn = decodeURIComponent(generateWhatsAppInvoiceShareText(sampleBill, 'en'));
  const waGu = decodeURIComponent(generateWhatsAppInvoiceShareText(sampleBill, 'gu'));
  const waHi = decodeURIComponent(generateWhatsAppInvoiceShareText(sampleBill, 'hi'));

  assert(waEn.includes('TAX INVOICE') && waEn.includes('GRAND TOTAL'), 'English WhatsApp text localized');
  assert(waGu.includes('ટેક્સ ઇન્વોઇસ') && waGu.includes('ચુકવવાપાત્ર કુલ રકમ'), 'Gujarati WhatsApp text localized');
  assert(waHi.includes('टैक्स इनवॉइस') && waHi.includes('कुल देय राशि'), 'Hindi WhatsApp text localized');

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: Real PDF Generation (Binary Validation)
  // ----------------------------------------------------------------------------
  console.log('\n--- 3. Real PDF Generation & Binary Verification ---');

  for (const lang of ['en', 'gu', 'hi']) {
    const res = await generateAndDownloadInvoicePDF(sampleBill, lang);

    assert(res.success === true, `PDF generation succeeded for [${lang}]`);
    assert(res.filename === `Shubh-Celebrations-Bill-${sampleBill.bill_number}.pdf`, `Filename strictly follows format: ${res.filename}`);
    assert(Buffer.isBuffer(res.buffer), `Output is a valid binary Buffer for [${lang}]`);
    assert(res.buffer.length > 5000, `PDF file size is substantial (${res.buffer.length} bytes)`);

    // Verify PDF Magic Bytes (%PDF-1.3)
    const pdfHeader = res.buffer.slice(0, 5).toString('ascii');
    assert(pdfHeader === '%PDF-', `PDF header contains valid binary magic marker: "${pdfHeader}"`);

    // Verify PDF EOF marker
    const pdfFooter = res.buffer.slice(-15).toString('ascii');
    assert(pdfFooter.includes('%%EOF'), `PDF ends with standard EOF marker`);

    // Save actual PDF to disk for manual inspection
    const outPath = path.resolve(`Shubh-Celebrations-Bill-${lang.toUpperCase()}.pdf`);
    fs.writeFileSync(outPath, res.buffer);
    assert(fs.existsSync(outPath), `Saved test artifact to ${outPath}`);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: Long Multi-Item Bill (Pagination & Calculations)
  // ----------------------------------------------------------------------------
  console.log('\n--- 4. Long Multi-Item Bill Test ---');

  const longBill = {
    ...sampleBill,
    bill_number: 'VD-2026-LONG-001',
    items: [
      { id: 1, description: 'Royal Entry Arch 40ft', quantity: 1, rate: 35000, amount: 35000 },
      { id: 2, description: 'Stage Backdrop with LED Video Wall (24x12)', quantity: 1, rate: 45000, amount: 45000 },
      { id: 3, description: 'Designer Wooden Chori with Brass Pooja Utensils', quantity: 1, rate: 25000, amount: 25000 },
      { id: 4, description: 'Pathway Floral Walkway & 8 Roman Pillars', quantity: 1, rate: 20000, amount: 20000 },
      { id: 5, description: 'VIP Lounge Sofa Seating (12 Maharaja Sofas)', quantity: 12, rate: 1500, amount: 18000 },
      { id: 6, description: 'Cold Pyro Sparkulars for Groom Entry (8 Shots)', quantity: 8, rate: 1200, amount: 9600 },
      { id: 7, description: 'Heavy Fog Dry Ice Machine for Bride Entry', quantity: 1, rate: 8000, amount: 8000 },
      { id: 8, description: 'Ambient Warm Halogen Floodlighting (30 Units)', quantity: 30, rate: 500, amount: 15000 },
      { id: 9, description: 'Selfie Photo Booth & Floral Swing Setup', quantity: 1, rate: 12000, amount: 12000 },
      { id: 10, description: 'Dining Area Buffet Canopy & Table Draping', quantity: 1, rate: 18000, amount: 18000 },
    ],
    subtotal: 205600.00,
    discount: 10600.00,
    additional_charges: 5000.00,
    tax_percent: 5.00,
    tax_amount: 10000.00,
    grand_total: 210000.00,
    total_paid: 100000.00,
    balance_due: 110000.00,
  };

  const longRes = await generateAndDownloadInvoicePDF(longBill, 'gu');
  assert(longRes.success === true, 'Long bill (10 items) PDF generated successfully');
  assert(longRes.buffer.length > 15000, `Long bill size is robust (${longRes.buffer.length} bytes)`);

  const longOut = path.resolve('Shubh-Celebrations-Bill-LONG-GU.pdf');
  fs.writeFileSync(longOut, longRes.buffer);
  assert(fs.existsSync(longOut), `Saved long bill PDF to ${longOut}`);

  // Summary
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Unhandled test failure:', e);
  process.exit(1);
});
