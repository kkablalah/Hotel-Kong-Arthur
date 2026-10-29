// Phase 4: Service Layer Unit Tests
// Tests for backend/src/services/importService.js
// Run with: node backend/tests/unit/importService.test.js

import assert from 'assert';
import { 
  calculateFileHash,
  validateHistoricalBooking,
  validateHistoricalDrink,
  extractRecordsFromExcel,
  checkBatchDuplicate
} from '../../src/services/importService.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datasetsDir = path.join(__dirname, '..', '..', 'Datasets');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failCount++;
  }
}

console.log('='.repeat(70));
console.log('PHASE 4: SERVICE LAYER UNIT TESTS');
console.log('='.repeat(70));

// ============================================
// T016: calculateFileHash Tests
// ============================================
console.log('\n--- T016: calculateFileHash() Tests ---\n');

// Test with temporary files to avoid requiring actual datasets
test('calculateFileHash returns 64-character hex string', () => {
  const testContent = 'test content for hash verification';
  const tmpDir = process.env.TMPDIR || '/tmp';
  const testFile = path.join(tmpDir, `test_hash_${Date.now()}.txt`);
  fs.writeFileSync(testFile, testContent);
  
  const hash = calculateFileHash(testFile);
  assert.strictEqual(hash.length, 64, 'Hash should be 64 characters');
  assert.strictEqual(typeof hash, 'string', 'Hash should be a string');
  assert(/^[a-f0-9]{64}$/.test(hash), 'Hash should be hexadecimal');
  
  fs.unlinkSync(testFile);
});

test('calculateFileHash returns consistent hash for same file', () => {
  const testContent = 'consistent content test';
  const tmpDir = process.env.TMPDIR || '/tmp';
  const testFile = path.join(tmpDir, `test_hash_consistent_${Date.now()}.txt`);
  fs.writeFileSync(testFile, testContent);
  
  const hash1 = calculateFileHash(testFile);
  const hash2 = calculateFileHash(testFile);
  assert.strictEqual(hash1, hash2, 'Same file should produce same hash');
  
  fs.unlinkSync(testFile);
});

test('calculateFileHash returns different hash for different content', () => {
  const tmpDir = process.env.TMPDIR || '/tmp';
  const testFile1 = path.join(tmpDir, `test_hash_diff1_${Date.now()}.txt`);
  const testFile2 = path.join(tmpDir, `test_hash_diff2_${Date.now()}.txt`);
  fs.writeFileSync(testFile1, 'content one');
  fs.writeFileSync(testFile2, 'content two');
  
  const hash1 = calculateFileHash(testFile1);
  const hash2 = calculateFileHash(testFile2);
  assert.notStrictEqual(hash1, hash2, 'Different content should produce different hash');
  
  fs.unlinkSync(testFile1);
  fs.unlinkSync(testFile2);
});

// ============================================
// T014: validateHistoricalBooking Tests
// ============================================
console.log('\n--- T014: validateHistoricalBooking() Tests ---\n');

test('Validates valid booking record with all fields', () => {
  const record = {
    first_name: 'John',
    family_name: 'Doe',
    country: 'Denmark',
    room_type: 'Standard Double',
    days_rented: 5,
    season: 'high',
    price: 1500.00
  };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'Valid record should pass');
});

test('Validates valid booking record with only required fields', () => {
  const record = {
    first_name: 'Jane',
    family_name: 'Smith'
  };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'Record with only required fields should pass');
});

test('Rejects missing first_name', () => {
  const record = { family_name: 'Doe' };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'Missing first_name should fail');
  assert.strictEqual(result.field, 'first_name', 'Should identify first_name field');
});

test('Rejects missing family_name', () => {
  const record = { first_name: 'John' };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'Missing family_name should fail');
  assert.strictEqual(result.field, 'family_name', 'Should identify family_name field');
});

test('Rejects empty first_name', () => {
  const record = { first_name: '', family_name: 'Doe' };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'Empty first_name should fail');
  assert.strictEqual(result.field, 'first_name', 'Should identify first_name field');
});

test('Rejects empty family_name', () => {
  const record = { first_name: 'John', family_name: '' };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'Empty family_name should fail');
  assert.strictEqual(result.field, 'family_name', 'Should identify family_name field');
});

test('Rejects first_name > 100 characters', () => {
  const record = { first_name: 'A'.repeat(101), family_name: 'Doe' };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'first_name > 100 should fail');
  assert.strictEqual(result.field, 'first_name', 'Should identify first_name field');
});

test('Rejects family_name > 100 characters', () => {
  const record = { first_name: 'John', family_name: 'A'.repeat(101) };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'family_name > 100 should fail');
  assert.strictEqual(result.field, 'family_name', 'Should identify family_name field');
});

test('Rejects country > 100 characters', () => {
  const record = { first_name: 'John', family_name: 'Doe', country: 'A'.repeat(101) };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'country > 100 should fail');
  assert.strictEqual(result.field, 'country', 'Should identify country field');
});

test('Accepts country up to 100 characters', () => {
  const record = { first_name: 'John', family_name: 'Doe', country: 'A'.repeat(100) };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'country = 100 should pass');
});

test('Rejects room_type > 50 characters (CORRECTED from INT)', () => {
  const record = { first_name: 'John', family_name: 'Doe', room_type: 'A'.repeat(51) };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'room_type > 50 should fail');
  assert.strictEqual(result.field, 'room_type', 'Should identify room_type field');
});

test('Accepts room_type up to 50 characters', () => {
  const record = { first_name: 'John', family_name: 'Doe', room_type: 'A'.repeat(50) };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'room_type = 50 should pass');
});

test('Accepts valid room_type string values', () => {
  const roomTypes = ['Standard Single', 'Standard Double', 'Superior Double', 'Grand Lit', 'Junior Suite', 'Suite', 'LOFT Suite', 'Spa Executive'];
  roomTypes.forEach(rt => {
    const record = { first_name: 'John', family_name: 'Doe', room_type: rt };
    const result = validateHistoricalBooking(record);
    assert.strictEqual(result.valid, true, `room_type "${rt}" should pass`);
  });
});

test('Accepts null/undefined room_type', () => {
  const record = { first_name: 'John', family_name: 'Doe', room_type: null };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'null room_type should pass');
});

test('Rejects days_rented < 1', () => {
  const record = { first_name: 'John', family_name: 'Doe', days_rented: 0 };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'days_rented < 1 should fail');
  assert.strictEqual(result.field, 'days_rented', 'Should identify days_rented field');
});

test('Accepts days_rented >= 1', () => {
  [1, 5, 10, 100].forEach(days => {
    const record = { first_name: 'John', family_name: 'Doe', days_rented: days };
    const result = validateHistoricalBooking(record);
    assert.strictEqual(result.valid, true, `days_rented = ${days} should pass`);
  });
});

test('Accepts null/undefined days_rented', () => {
  const record = { first_name: 'John', family_name: 'Doe', days_rented: null };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'null days_rented should pass');
});

test('Rejects invalid season value', () => {
  const invalidSeasons = ['summer', 'winter', 'Spring', 'fall', ''];
  invalidSeasons.forEach(season => {
    const record = { first_name: 'John', family_name: 'Doe', season: season };
    const result = validateHistoricalBooking(record);
    assert.strictEqual(result.valid, false, `season "${season}" should fail`);
    assert.strictEqual(result.field, 'season', 'Should identify season field');
  });
});

test('Accepts valid season values', () => {
  ['low', 'mid', 'high'].forEach(season => {
    const record = { first_name: 'John', family_name: 'Doe', season: season };
    const result = validateHistoricalBooking(record);
    assert.strictEqual(result.valid, true, `season "${season}" should pass`);
  });
});

test('Accepts null/undefined season', () => {
  const record = { first_name: 'John', family_name: 'Doe', season: null };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'null season should pass');
});

test('Rejects negative price', () => {
  const record = { first_name: 'John', family_name: 'Doe', price: -100 };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, false, 'Negative price should fail');
  assert.strictEqual(result.field, 'price', 'Should identify price field');
});

test('Accepts non-negative price', () => {
  [0, 0.01, 100, 1500.50].forEach(price => {
    const record = { first_name: 'John', family_name: 'Doe', price: price };
    const result = validateHistoricalBooking(record);
    assert.strictEqual(result.valid, true, `price = ${price} should pass`);
  });
});

test('Accepts null/undefined price', () => {
  const record = { first_name: 'John', family_name: 'Doe', price: null };
  const result = validateHistoricalBooking(record);
  assert.strictEqual(result.valid, true, 'null price should pass');
});

// ============================================
// T015: validateHistoricalDrink Tests
// ============================================
console.log('\n--- T015: validateHistoricalDrink() Tests ---\n');

test('Validates valid drink record with all fields', () => {
  const record = {
    drink_name: 'Martini',
    category: 'Cocktail',
    price_dkk: 120.00,
    units_sold: 50
  };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, true, 'Valid record should pass');
});

test('Validates valid drink record with only required fields', () => {
  const record = {
    drink_name: 'Martini',
    category: 'Cocktail'
  };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, true, 'Record with only required fields should pass');
});

test('Rejects missing drink_name', () => {
  const record = { category: 'Cocktail' };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'Missing drink_name should fail');
  assert.strictEqual(result.field, 'drink_name', 'Should identify drink_name field');
});

test('Rejects missing category', () => {
  const record = { drink_name: 'Martini' };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'Missing category should fail');
  assert.strictEqual(result.field, 'category', 'Should identify category field');
});

test('Rejects empty drink_name', () => {
  const record = { drink_name: '', category: 'Cocktail' };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'Empty drink_name should fail');
  assert.strictEqual(result.field, 'drink_name', 'Should identify drink_name field');
});

test('Rejects empty category', () => {
  const record = { drink_name: 'Martini', category: '' };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'Empty category should fail');
  assert.strictEqual(result.field, 'category', 'Should identify category field');
});

test('Rejects drink_name > 100 characters', () => {
  const record = { drink_name: 'A'.repeat(101), category: 'Cocktail' };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'drink_name > 100 should fail');
  assert.strictEqual(result.field, 'drink_name', 'Should identify drink_name field');
});

test('Accepts drink_name up to 100 characters', () => {
  const record = { drink_name: 'A'.repeat(100), category: 'Cocktail' };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, true, 'drink_name = 100 should pass');
});

test('Rejects invalid category value', () => {
  const invalidCategories = ['Beer', 'Wine', 'Juice', 'Tea', ''];
  invalidCategories.forEach(category => {
    const record = { drink_name: 'Test', category: category };
    const result = validateHistoricalDrink(record);
    assert.strictEqual(result.valid, false, `category "${category}" should fail`);
    assert.strictEqual(result.field, 'category', 'Should identify category field');
  });
});

test('Accepts valid category values', () => {
  ['Cocktail', 'Coffee'].forEach(category => {
    const record = { drink_name: 'Test', category: category };
    const result = validateHistoricalDrink(record);
    assert.strictEqual(result.valid, true, `category "${category}" should pass`);
  });
});

test('Rejects negative price_dkk', () => {
  const record = { drink_name: 'Martini', category: 'Cocktail', price_dkk: -50 };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'Negative price_dkk should fail');
  assert.strictEqual(result.field, 'price_dkk', 'Should identify price_dkk field');
});

test('Accepts non-negative price_dkk', () => {
  [0, 0.01, 50, 120.50].forEach(price => {
    const record = { drink_name: 'Martini', category: 'Cocktail', price_dkk: price };
    const result = validateHistoricalDrink(record);
    assert.strictEqual(result.valid, true, `price_dkk = ${price} should pass`);
  });
});

test('Accepts null/undefined price_dkk', () => {
  const record = { drink_name: 'Martini', category: 'Cocktail', price_dkk: null };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, true, 'null price_dkk should pass');
});

test('Rejects negative units_sold', () => {
  const record = { drink_name: 'Martini', category: 'Cocktail', units_sold: -5 };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, false, 'Negative units_sold should fail');
  assert.strictEqual(result.field, 'units_sold', 'Should identify units_sold field');
});

test('Accepts non-negative units_sold', () => {
  [0, 1, 50, 1000].forEach(units => {
    const record = { drink_name: 'Martini', category: 'Cocktail', units_sold: units };
    const result = validateHistoricalDrink(record);
    assert.strictEqual(result.valid, true, `units_sold = ${units} should pass`);
  });
});

test('Accepts null/undefined units_sold', () => {
  const record = { drink_name: 'Martini', category: 'Cocktail', units_sold: null };
  const result = validateHistoricalDrink(record);
  assert.strictEqual(result.valid, true, 'null units_sold should pass');
});

// ============================================
// T017: extractRecordsFromExcel Tests
// ============================================
console.log('\n--- T017: extractRecordsFromExcel() Tests ---\n');

// Test with temporary Excel-like data
if (fs.existsSync(datasetsDir)) {
  const hotelFile = path.join(datasetsDir, 'international_names_with_rooms_1000.xlsx');
  const drinksFile = path.join(datasetsDir, 'drinks_menu_with_sales.xlsx');

  test('Extracts records from hotel Excel file', () => {
    const columns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(hotelFile, columns);
    assert.strictEqual(Array.isArray(records), true, 'Should return array');
    assert.ok(records.length > 0, 'Should extract records');
  });

  test('Hotel records have source_row_number field', () => {
    const columns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(hotelFile, columns);
    assert.ok('source_row_number' in records[0], 'First record should have source_row_number');
  });

  test('Hotel first record has source_row_number = 1', () => {
    const columns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(hotelFile, columns);
    assert.strictEqual(records[0].source_row_number, 1, 'First record should have source_row_number = 1');
  });

  test('Hotel records have all expected columns', () => {
    const columns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(hotelFile, columns);
    const firstRecord = records[0];
    columns.forEach(col => {
      assert.ok(col in firstRecord, `Should have ${col} field`);
    });
  });

  test('Hotel records preserve room_type as string', () => {
    const columns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(hotelFile, columns);
    const firstRecord = records[0];
    assert.strictEqual(typeof firstRecord.room_type, 'string', 'room_type should be string');
  });

  test('Hotel source_row_number is sequential', () => {
    const columns = ['first_name', 'family_name', 'country', 'room_type', 'days_rented', 'season', 'price'];
    const records = extractRecordsFromExcel(hotelFile, columns);
    const expectedNumbers = Array.from({ length: records.length }, (_, i) => i + 1);
    const actualNumbers = records.map(r => r.source_row_number);
    assert.deepStrictEqual(actualNumbers, expectedNumbers, 'source_row_number should be sequential 1 to N');
  });

  test('Extracts records from drinks Excel file', () => {
    const columns = ['drink_name', 'category', 'price_dkk', 'units_sold'];
    const records = extractRecordsFromExcel(drinksFile, columns);
    assert.strictEqual(Array.isArray(records), true, 'Should return array');
    assert.ok(records.length > 0, 'Should extract records');
  });

  test('Drinks records have source_row_number field', () => {
    const columns = ['drink_name', 'category', 'price_dkk', 'units_sold'];
    const records = extractRecordsFromExcel(drinksFile, columns);
    assert.ok('source_row_number' in records[0], 'First record should have source_row_number');
  });

  test('Drinks first record has source_row_number = 1', () => {
    const columns = ['drink_name', 'category', 'price_dkk', 'units_sold'];
    const records = extractRecordsFromExcel(drinksFile, columns);
    assert.strictEqual(records[0].source_row_number, 1, 'First record should have source_row_number = 1');
  });

  test('Drinks records have all expected columns', () => {
    const columns = ['drink_name', 'category', 'price_dkk', 'units_sold'];
    const records = extractRecordsFromExcel(drinksFile, columns);
    const firstRecord = records[0];
    columns.forEach(col => {
      assert.ok(col in firstRecord, `Should have ${col} field`);
    });
  });

  test('Drinks category is valid enum', () => {
    const columns = ['drink_name', 'category', 'price_dkk', 'units_sold'];
    const records = extractRecordsFromExcel(drinksFile, columns);
    records.forEach(record => {
      assert.ok(['Cocktail', 'Coffee'].includes(record.category), 
        `Category should be Cocktail or Coffee, got: ${record.category}`);
    });
  });
} else {
  console.log('⊘ Dataset files not available, skipping Excel parsing tests');
}

// ============================================
// T018: checkBatchDuplicate Tests
// ============================================
console.log('\n--- T018: checkBatchDuplicate() Tests ---\n');

await asyncTest('Returns null for non-existent file hash', async () => {
  const nonExistentHash = '0'.repeat(64);
  const result = await checkBatchDuplicate(nonExistentHash);
  assert.strictEqual(result, null, 'Non-existent hash should return null');
});

await asyncTest('Returns null for another non-existent hash', async () => {
  const anotherHash = '1'.repeat(64);
  const result = await checkBatchDuplicate(anotherHash);
  assert.strictEqual(result, null, 'Non-existent hash should return null');
});

// Test with mock database responses is not directly possible without mocking
// The function queries the actual database, so we can only test read-only behavior
console.log('⊘ Mock database tests: Requires mocking library (not in scope for Phase 4)');
console.log('  Note: checkBatchDuplicate performs SELECT query only (read-only)');
console.log('  Note: Actual duplicate detection tested via database verification');

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`\nTotal Tests: ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount === 0) {
  console.log('\n✓ ALL PHASE 4 TESTS PASSED');
  process.exit(0);
} else {
  console.log('\n✗ SOME TESTS FAILED');
  process.exit(1);
}
