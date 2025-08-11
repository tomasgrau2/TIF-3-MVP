import { Product } from './types';

const baseToday = new Date(); // Use a stable 'today' for all relative date calculations
const today = new Date(baseToday); // today can be used if modifications are localized and intentional

const tomorrow = new Date(baseToday);
tomorrow.setDate(baseToday.getDate() + 1);
const nextWeek = new Date(baseToday);
nextWeek.setDate(baseToday.getDate() + 7);
const inTwoWeeks = new Date(baseToday);
inTwoWeeks.setDate(baseToday.getDate() + 14);
const nextMonth = new Date(baseToday);
nextMonth.setMonth(baseToday.getMonth() + 1);
const inTwoMonths = new Date(baseToday);
inTwoMonths.setMonth(baseToday.getMonth() + 2);
const threeMonths = new Date(baseToday);
threeMonths.setMonth(baseToday.getMonth() + 3);
const sixMonths = new Date(baseToday);
sixMonths.setMonth(baseToday.getMonth() + 6);
const nextYear = new Date(baseToday);
nextYear.setFullYear(baseToday.getFullYear() + 1);
const distantFuture = new Date(baseToday);
distantFuture.setFullYear(baseToday.getFullYear() + 2);

const lastMonth = new Date(baseToday);
lastMonth.setMonth(baseToday.getMonth() -1);
const twoMonthsAgo = new Date(baseToday);
twoMonthsAgo.setMonth(baseToday.getMonth() -2);
const sixMonthsAgo = new Date(baseToday);
sixMonthsAgo.setMonth(baseToday.getMonth() -6);


export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Amoxicillin 250mg Capsules',
    description: 'Broad-spectrum antibiotic for bacterial infections.',
    manufacturer: 'PharmaGlobal Inc.',
    lotNumber: 'AMX250-001',
    quantity: 100,
    unit: 'capsules',
    expiryDate: tomorrow,
    category: 'Antibiotic',
    storageConditions: 'Store below 25°C in a dry place.',
    imageUrl: 'https://picsum.photos/seed/amoxicillin/200/200'
  },
  {
    id: '2',
    name: 'Paracetamol 500mg Tablets',
    description: 'Analgesic and antipyretic for pain and fever relief.',
    manufacturer: 'HealthWell Ltd.',
    lotNumber: 'PARA500-002',
    quantity: 200,
    unit: 'tablets',
    expiryDate: nextWeek,
    category: 'Analgesic',
    storageConditions: 'Store in a cool, dry place.',
    imageUrl: 'https://picsum.photos/seed/paracetamol/200/200'
  },
  {
    id: '3',
    name: 'Insulin Glargine Injection',
    description: 'Long-acting insulin for diabetes management.',
    manufacturer: 'BioGen Solutions',
    lotNumber: 'INSG-003',
    quantity: 50,
    unit: 'vials',
    expiryDate: nextMonth,
    category: 'Antidiabetic',
    storageConditions: 'Refrigerate (2°C - 8°C). Do not freeze.',
    imageUrl: 'https://picsum.photos/seed/insulin/200/200'
  },
  {
    id: '4',
    name: 'Salbutamol Inhaler',
    description: 'Bronchodilator for asthma and COPD.',
    manufacturer: 'RespiraCare',
    lotNumber: 'SALB-004',
    quantity: 75,
    unit: 'inhalers',
    expiryDate: threeMonths,
    category: 'Respiratory',
    storageConditions: 'Store below 30°C. Protect from frost and direct sunlight.',
    imageUrl: 'https://picsum.photos/seed/salbutamol/200/200'
  },
  {
    id: '5',
    name: 'Loratadine 10mg Tablets',
    description: 'Antihistamine for allergy relief.',
    manufacturer: 'AllergyStop Pharma',
    lotNumber: 'LORA10-005',
    quantity: 150,
    unit: 'tablets',
    expiryDate: sixMonths,
    category: 'Antihistamine',
    storageConditions: 'Store at room temperature.',
    imageUrl: 'https://picsum.photos/seed/loratadine/200/200'
  },
  {
    id: '6',
    name: 'Expired Test Drug A',
    description: 'An already expired medication for testing.',
    manufacturer: 'TestPharma',
    lotNumber: 'EXPTEST-001',
    quantity: 10,
    unit: 'pills',
    expiryDate: lastMonth,
    category: 'Test Drug',
    storageConditions: 'Store at room temperature.',
    imageUrl: 'https://picsum.photos/seed/expireda/200/200'
  },
   {
    id: '7',
    name: 'Aspirin 100mg',
    description: 'Low-dose aspirin for cardiovascular protection.',
    manufacturer: 'CardioHealth',
    lotNumber: 'ASP100-007',
    quantity: 300,
    unit: 'tablets',
    expiryDate: nextYear, 
    category: 'Cardiovascular',
    storageConditions: 'Store in a cool, dry place.',
    imageUrl: 'https://picsum.photos/seed/aspirin/200/200'
  },
  {
    id: '8',
    name: 'Metformin 850mg',
    description: 'Oral antidiabetic medication.',
    manufacturer: 'DiaCare Ltd.',
    lotNumber: 'MET850-008',
    quantity: 120,
    unit: 'tablets',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth() + 4, baseToday.getDate()), // Expires in 4 months
    category: 'Antidiabetic',
    storageConditions: 'Store below 25°C.',
    imageUrl: 'https://picsum.photos/seed/metformin/200/200'
  },
  {
    id: '9',
    name: 'Omeprazole 20mg Capsules',
    description: 'Proton pump inhibitor for acid reflux.',
    manufacturer: 'GastroWell',
    lotNumber: 'OME20-009',
    quantity: 90,
    unit: 'capsules',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth() + 8, baseToday.getDate()), // Expires in 8 months
    category: 'Gastrointestinal',
    storageConditions: 'Store in a cool, dry place, away from light.',
    imageUrl: 'https://picsum.photos/seed/omeprazole/200/200'
  },
  {
    id: '10',
    name: 'Simvastatin 40mg Tablets',
    description: 'Cholesterol-lowering medication.',
    manufacturer: 'LipidLow Inc.',
    lotNumber: 'SIM40-010',
    quantity: 180,
    unit: 'tablets',
    expiryDate: distantFuture, // Expires in 2 years
    category: 'Cardiovascular',
    storageConditions: 'Store at room temperature, away from moisture and heat.',
    imageUrl: 'https://picsum.photos/seed/simvastatin/200/200'
  },
  {
    id: '11',
    name: 'Levothyroxine 50mcg Tablets',
    description: 'Thyroid hormone replacement.',
    manufacturer: 'ThyroCare',
    lotNumber: 'LEV50-011',
    quantity: 100,
    unit: 'tablets',
    expiryDate: new Date(baseToday.getFullYear() + 1, baseToday.getMonth() + 6, baseToday.getDate()), // Expires in 1.5 years
    category: 'Endocrine',
    storageConditions: 'Store at room temperature, protected from light and moisture.',
    imageUrl: 'https://picsum.photos/seed/levothyroxine/200/200'
  },
  {
    id: '12',
    name: 'Warfarin 5mg Tablets',
    description: 'Anticoagulant to prevent blood clots.',
    manufacturer: 'HemaPharm',
    lotNumber: 'WARF5-012',
    quantity: 60,
    unit: 'tablets',
    expiryDate: inTwoMonths, // Expires in 2 months
    category: 'Hematologic',
    storageConditions: 'Store at controlled room temperature.',
    imageUrl: 'https://picsum.photos/seed/warfarin/200/200'
  },
  {
    id: '13',
    name: 'Ciprofloxacin Eye Drops',
    description: 'Antibiotic for bacterial eye infections.',
    manufacturer: 'OptiCare',
    lotNumber: 'CIPROEYE-013',
    quantity: 10,
    unit: 'ml bottle',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth(), baseToday.getDate() + 3), // Expires in 3 days
    category: 'Ophthalmic',
    storageConditions: 'Store at room temperature. Do not freeze.',
    imageUrl: 'https://picsum.photos/seed/ciproeye/200/200'
  },
  {
    id: '14',
    name: 'Flu Vaccine (2023-2024)',
    description: 'Seasonal influenza vaccine.',
    manufacturer: 'VaxSafe',
    lotNumber: 'FLUVAX23-014',
    quantity: 25,
    unit: 'doses',
    expiryDate: twoMonthsAgo, // Expired 2 months ago
    category: 'Vaccine',
    storageConditions: 'Refrigerate (2°C - 8°C). Do not freeze.',
    imageUrl: 'https://picsum.photos/seed/fluvax/200/200'
  },
  {
    id: '15',
    name: 'Childrens Ibuprofen Suspension',
    description: 'Pain and fever relief for children.',
    manufacturer: 'PediaCare',
    lotNumber: 'IBUCHILD-015',
    quantity: 1,
    unit: '100ml bottle',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth(), baseToday.getDate() + 20), // Expires in 20 days
    category: 'Pediatric',
    storageConditions: 'Store at room temperature.',
    imageUrl: 'https://picsum.photos/seed/ibuprofenchild/200/200'
  },
  {
    id: '16',
    name: 'Diazepam 5mg Tablets',
    description: 'For anxiety and seizure control.',
    manufacturer: 'NeuroCalm',
    lotNumber: 'DIAZ5-016',
    quantity: 30,
    unit: 'tablets',
    expiryDate: sixMonthsAgo, // Expired 6 months ago
    category: 'Neurologic',
    storageConditions: 'Store at room temperature, protect from light.',
    imageUrl: 'https://picsum.photos/seed/diazepam/200/200'
  },
  {
    id: '17',
    name: 'Hydrocortisone Cream 1%',
    description: 'Topical steroid for skin inflammation.',
    manufacturer: 'DermRelief',
    lotNumber: 'HCORTCRM-017',
    quantity: 2,
    unit: '30g tubes',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth() + 9, baseToday.getDate()), // Expires in 9 months
    category: 'Dermatologic',
    storageConditions: 'Store at room temperature.',
    imageUrl: 'https://picsum.photos/seed/hydrocortisone/200/200'
  },
  {
    id: '18',
    name: 'Vitamin D3 5000 IU Capsules',
    description: 'Dietary supplement for Vitamin D.',
    manufacturer: 'NutriWell',
    lotNumber: 'VITD3-018',
    quantity: 90,
    unit: 'capsules',
    expiryDate: new Date(baseToday.getFullYear() + 2, baseToday.getMonth(), baseToday.getDate()), // Expires in 2 years
    category: 'Supplement',
    storageConditions: 'Store in a cool, dry place.',
    imageUrl: 'https://picsum.photos/seed/vitamind3/200/200'
  },
  {
    id: '19',
    name: 'Folic Acid 1mg Tablets',
    description: 'Supplement for pregnancy and anemia.',
    manufacturer: 'HemoBoost',
    lotNumber: 'FOLAC1-019',
    quantity: 100,
    unit: 'tablets',
    expiryDate: new Date(baseToday.getFullYear() + 1, baseToday.getMonth() - 2, baseToday.getDate()), // Expires in 10 months from now (relative to baseToday)
    category: 'Supplement',
    storageConditions: 'Store at room temperature, protected from light.',
    imageUrl: 'https://picsum.photos/seed/folicacid/200/200'
  },
  {
    id: '20',
    name: 'Epinephrine Auto-Injector',
    description: 'For emergency treatment of anaphylaxis.',
    manufacturer: 'EpiSave',
    lotNumber: 'EPIPEN-020',
    quantity: 2,
    unit: 'injectors',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth() + 5, baseToday.getDate()), // Expires in 5 months
    category: 'Emergency',
    storageConditions: 'Store at room temperature. Do not refrigerate. Protect from light.',
    imageUrl: 'https://picsum.photos/seed/epipen/200/200'
  },
  {
    id: '21',
    name: 'Atorvastatin 20mg',
    description: 'Reduces levels of "bad" cholesterol.',
    manufacturer: 'CholestGuard',
    lotNumber: 'ATOR20-021',
    quantity: 90,
    unit: 'tablets',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth(), baseToday.getDate()), // Expires today
    category: 'Cardiovascular',
    storageConditions: 'Store at room temperature, away from moisture.',
    imageUrl: 'https://picsum.photos/seed/atorvastatin/200/200'
  },
  {
    id: '22',
    name: 'Montelukast 10mg Tablets',
    description: 'Asthma and seasonal allergy medication.',
    manufacturer: 'AeroCare',
    lotNumber: 'MONT10-022',
    quantity: 30,
    unit: 'tablets',
    expiryDate: inTwoWeeks, // Expires in 2 weeks
    category: 'Respiratory',
    storageConditions: 'Store at room temperature, protected from moisture and light.',
    imageUrl: 'https://picsum.photos/seed/montelukast/200/200'
  },
  {
    id: '23',
    name: 'Antibiotic Ointment',
    description: 'Topical antibiotic for minor skin infections.',
    manufacturer: 'FirstAid Pharma',
    lotNumber: 'ANTIBOINT-023',
    quantity: 1,
    unit: '15g tube',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth(), baseToday.getDate() - 10), // Expired 10 days ago
    category: 'First Aid',
    storageConditions: 'Store at room temperature.',
    imageUrl: 'https://picsum.photos/seed/antibioticoint/200/200'
  },
  {
    id: '24',
    name: 'Codeine Phosphate 30mg Tablets',
    description: 'Opioid pain reliever.',
    manufacturer: 'PainRelief Co.',
    lotNumber: 'COD30-024',
    quantity: 20,
    unit: 'tablets',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth() + 1, baseToday.getDate() + 15), // Expires in ~1.5 months
    category: 'Analgesic',
    storageConditions: 'Store securely at room temperature.',
    imageUrl: 'https://picsum.photos/seed/codeine/200/200'
  },
  {
    id: '25',
    name: 'Testosterone Cypionate Injection',
    description: 'Hormone replacement therapy.',
    manufacturer: 'HormoneBalance',
    lotNumber: 'TESTCYP-025',
    quantity: 1,
    unit: '10ml vial',
    expiryDate: new Date(baseToday.getFullYear() + 0, baseToday.getMonth() + 7, baseToday.getDate()), // Expires in 7 months
    category: 'Endocrine',
    storageConditions: 'Store at room temperature, protect from light.',
    imageUrl: 'https://picsum.photos/seed/testosterone/200/200'
  },
  {
    id: '26',
    name: 'Artificial Tears Eye Drops',
    description: 'Lubricant eye drops for dry eyes.',
    manufacturer: 'ComfortEyes',
    lotNumber: 'ATEARS-001',
    quantity: 1,
    unit: '15ml bottle',
    expiryDate: new Date(baseToday.getFullYear(), baseToday.getMonth() + 0, baseToday.getDate() + 5), // Expires in 5 days
    category: 'Ophthalmic',
    storageConditions: 'Store at room temperature.',
    imageUrl: 'https://picsum.photos/seed/artificialtears/200/200'
  },
  {
    id: '27',
    name: 'Old Batch Paracetamol',
    description: 'An old batch of Paracetamol tablets, likely expired.',
    manufacturer: 'HealthWell Ltd.',
    lotNumber: 'PARA500-OLD-001',
    quantity: 50,
    unit: 'tablets',
    expiryDate: new Date(baseToday.getFullYear() -1, baseToday.getMonth(), baseToday.getDate()), // Expired 1 year ago
    category: 'Analgesic',
    storageConditions: 'Store in a cool, dry place.',
    imageUrl: 'https://picsum.photos/seed/oldparacetamol/200/200'
  },
  {
    id: '28',
    name: 'Very Soon Expiry Drug',
    description: 'A drug that will expire in exactly 1 day.',
    manufacturer: 'UrgentMeds',
    lotNumber: 'URG001-EXP',
    quantity: 5,
    unit: 'pills',
    // Corrected: Calculate expiry based on baseToday without modifying it globally for other products
    expiryDate: new Date(new Date(baseToday).setDate(baseToday.getDate() + 1)), 
    category: 'Urgent',
    storageConditions: 'Handle with care.',
    imageUrl: 'https://picsum.photos/seed/urgentdrug/200/200'
  },
];

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};