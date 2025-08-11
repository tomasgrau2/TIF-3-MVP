import { parseDate, formatDate, getSupportedFormats, isValidDateFormat } from './dateUtils';

// Test cases for the date utility
const testCases = [
  // MM/YYYY formats
  { input: '12/2024', expected: new Date(2024, 11, 1), format: 'MM/YYYY' },
  { input: '01/2025', expected: new Date(2025, 0, 1), format: 'MM/YYYY' },
  
  // MM.YYYY formats
  { input: '12.2024', expected: new Date(2024, 11, 1), format: 'MM.YYYY' },
  { input: '01.2025', expected: new Date(2025, 0, 1), format: 'MM.YYYY' },
  
  // MM-YYYY formats
  { input: '12-2024', expected: new Date(2024, 11, 1), format: 'MM-YYYY' },
  { input: '01-2025', expected: new Date(2025, 0, 1), format: 'MM-YYYY' },
  
  // MM/YY formats (assuming 00-99 = 2000-2099 for expiration dates)
  { input: '12/24', expected: new Date(2024, 11, 1), format: 'MM/YY' },
  { input: '01/25', expected: new Date(2025, 0, 1), format: 'MM/YY' },
  { input: '12/30', expected: new Date(2030, 11, 1), format: 'MM/YY' },
  { input: '01/99', expected: new Date(2099, 0, 1), format: 'MM/YY' },
  
  // MM.YY formats
  { input: '12.24', expected: new Date(2024, 11, 1), format: 'MM.YY' },
  { input: '01.25', expected: new Date(2025, 0, 1), format: 'MM.YY' },
  { input: '12.30', expected: new Date(2030, 11, 1), format: 'MM.YY' },
  { input: '01.99', expected: new Date(2099, 0, 1), format: 'MM.YY' },
  
  // MM-YY formats
  { input: '12-24', expected: new Date(2024, 11, 1), format: 'MM-YY' },
  { input: '01-25', expected: new Date(2025, 0, 1), format: 'MM-YY' },
  { input: '12-30', expected: new Date(2030, 11, 1), format: 'MM-YY' },
  { input: '01-99', expected: new Date(2099, 0, 1), format: 'MM-YY' },
  
  // DD/MM/YYYY formats
  { input: '25/12/2024', expected: new Date(2024, 11, 25), format: 'DD/MM/YYYY' },
  { input: '01/01/2025', expected: new Date(2025, 0, 1), format: 'DD/MM/YYYY' },
  
  // DD.MM.YYYY formats
  { input: '25.12.2024', expected: new Date(2024, 11, 25), format: 'DD.MM.YYYY' },
  { input: '01.01.2025', expected: new Date(2025, 0, 1), format: 'DD.MM.YYYY' },
  
  // YYYY-MM-DD formats
  { input: '2024-12-25', expected: new Date(2024, 11, 25), format: 'YYYY-MM-DD' },
  { input: '2025-01-01', expected: new Date(2025, 0, 1), format: 'YYYY-MM-DD' },
];

// Invalid test cases
const invalidTestCases = [
  'invalid',
  '13/2024', // Invalid month
  '00/2024', // Invalid month
  '12/1899', // Year too old
  '12/2101', // Year too new
  '32/12/2024', // Invalid day
  '12/32/2024', // Invalid day
  '2024-13-01', // Invalid month
  '2024-12-32', // Invalid day
  '12/13', // Invalid format
  '12.13', // Invalid format
  '12-13', // Invalid format
];

console.log('🧪 Testing Date Utility...\n');

// Test valid cases
console.log('✅ Testing valid date formats:');
testCases.forEach((testCase, index) => {
  const result = parseDate(testCase.input);
  const isValid = result.isValid && 
                  result.date && 
                  result.date.getFullYear() === testCase.expected.getFullYear() &&
                  result.date.getMonth() === testCase.expected.getMonth() &&
                  result.date.getDate() === testCase.expected.getDate() &&
                  result.format === testCase.format;
  
  console.log(`${isValid ? '✓' : '✗'} ${testCase.input} -> ${result.isValid ? `${result.format} (${result.date?.toISOString().split('T')[0]})` : 'INVALID'}`);
  
  if (!isValid) {
    console.log(`   Expected: ${testCase.format} (${testCase.expected.toISOString().split('T')[0]})`);
    console.log(`   Got: ${result.error || 'Unknown error'}`);
  }
});

console.log('\n❌ Testing invalid date formats:');
invalidTestCases.forEach((testCase) => {
  const result = parseDate(testCase);
  const isValid = !result.isValid;
  
  console.log(`${isValid ? '✓' : '✗'} ${testCase} -> ${isValid ? 'INVALID' : 'VALID'}`);
  
  if (!isValid) {
    console.log(`   Expected: INVALID`);
    console.log(`   Got: ${result.format} (${result.date?.toISOString().split('T')[0]})`);
  }
});

// Test format function
console.log('\n🔄 Testing format function:');
const testDate = new Date(2024, 11, 25); // December 25, 2024
const formats = ['MM/YYYY', 'MM.YYYY', 'MM-YYYY', 'MM/YY', 'MM.YY', 'MM-YY', 'DD/MM/YYYY', 'DD.MM.YYYY', 'YYYY-MM-DD'];

formats.forEach(format => {
  const formatted = formatDate(testDate, format);
  console.log(`✓ ${format}: ${formatted}`);
});

// Test supported formats
console.log('\n📋 Supported formats:');
const supportedFormats = getSupportedFormats();
supportedFormats.forEach(format => {
  console.log(`• ${format}`);
});

// Test validation function
console.log('\n🔍 Testing validation function:');
testCases.forEach(testCase => {
  const isValid = isValidDateFormat(testCase.input);
  console.log(`${isValid ? '✓' : '✗'} ${testCase.input} -> ${isValid ? 'VALID' : 'INVALID'}`);
});

console.log('\n🎉 Date utility tests completed!'); 