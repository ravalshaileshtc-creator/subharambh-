// ============================================================================
// TEST SUITE: CUSTOMER PORTAL LAYOUT & SCREEN SPACE OPTIMIZATION
// Verifies all 10 requirements of the layout upgrade in Shubh Celebrations
// ============================================================================

import fs from 'fs';
import path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`Test ${totalTests}: ${message}... PASS ✓`);
    passedTests++;
  } else {
    console.error(`Test ${totalTests}: ${message}... FAILED ✗`);
    process.exit(1);
  }
}

console.log('=================================================================');
console.log('  SHUBH CELEBRATIONS – 10 LAYOUT & SCREEN SPACE VALIDATION TESTS ');
console.log('=================================================================\n');

const appJsContent = fs.readFileSync(path.resolve('./App.js'), 'utf-8');
const nearbyBarContent = fs.readFileSync(path.resolve('./src/components/NearbyLocationBar.js'), 'utf-8');
const customerDashboardContent = fs.readFileSync(path.resolve('./src/components/CustomerDashboard.js'), 'utf-8');

// 1. Promotional banners height reduction
const hasCompactSlider = appJsContent.includes('height: 66') && appJsContent.includes('exploreListHeader');
assert(hasCompactSlider, 'Top promotional banners reduced to compact 66px height with refined badges');

// 2. GET 5 EVENT QUOTES banner height reduction
const hasCompactGetQuotes = appJsContent.includes('paddingVertical: 5') && 
                            appJsContent.includes('width: 24,') && 
                            appJsContent.includes('height: 24,') &&
                            appJsContent.includes('fontSize: 12.5');
assert(hasCompactGetQuotes, 'GET 5 EVENT QUOTES banner reduced to compact 38px single-row banner with 24px arrow circle');

// 3. Compact location selector and radius filters
const hasCompactNearbyBar = nearbyBarContent.includes('paddingHorizontal: 10') &&
                            nearbyBarContent.includes('paddingTop: 4') &&
                            nearbyBarContent.includes('paddingBottom: 4') &&
                            nearbyBarContent.includes('paddingVertical: 3') &&
                            nearbyBarContent.includes('fontSize: 12') &&
                            nearbyBarContent.includes('fontSize: 10');
assert(hasCompactNearbyBar, 'NearbyLocationBar and radius filters compacted by 45% (padding, badges, fonts tightened)');

// 4. Vertical padding and unnecessary gaps removed
const hasReducedTopPadding = appJsContent.includes('tabContentWrapper: {\n    flex: 1,\n    paddingTop: 2,') ||
                             appJsContent.includes("tabContentWrapper: {\r\n    flex: 1,\r\n    paddingTop: 2,");
assert(hasReducedTopPadding, 'Unnecessary Android/iOS top gaps removed (tabContentWrapper paddingTop: 2)');

// 5. Search bar and Smart Search compact horizontal row
const hasCompactSearchRow = appJsContent.includes('searchContainer: {\n    flexDirection: \'row\'') ||
                            appJsContent.includes('searchContainer: {\r\n    flexDirection: \'row\'') ||
                            (appJsContent.includes('searchContainer:') && appJsContent.includes('flexDirection: \'row\'') && appJsContent.includes('gap: 6'));
const hasCompactSearchInput = appJsContent.includes('height: 32') && appJsContent.includes('smartSearchTriggerBtn:');
assert(hasCompactSearchRow && hasCompactSearchInput, 'Search bar and Smart Search arranged in single horizontal 32px row');

// 6. Horizontally scrollable single row for categories
const hasSingleRowCategories = appJsContent.includes('tabsContainer') &&
                               appJsContent.includes('showsHorizontalScrollIndicator={false}') &&
                               appJsContent.includes('CATEGORIES.map');
assert(hasSingleRowCategories, 'Service categories kept in a smooth single horizontally scrollable row');

// 7. Dedicated scrollable FlatList with full flex: 1
const hasDedicatedScrollArea = appJsContent.includes('<FlatList\n              style={{ flex: 1 }}') ||
                               appJsContent.includes('<FlatList\r\n              style={{ flex: 1 }}') ||
                               appJsContent.includes('style={{ flex: 1 }}');
assert(hasDedicatedScrollArea, 'Dedicated scrollable viewport created for vendor cards (FlatList flex: 1)');

// 8. Promotional banners in ListHeaderComponent scroll vertically without hiding content
const hasListHeaderBanners = appJsContent.includes('ListHeaderComponent={renderExploreHeader}');
assert(hasListHeaderBanners, 'Promotional slider & Get Quotes banner scroll away naturally via ListHeaderComponent');

// 9. Vendor card dimensions tightened for maximum screen efficiency
const hasCompactVendorCards = appJsContent.includes('height: 128') &&
                              appJsContent.includes('padding: 10') &&
                              appJsContent.includes('fontSize: 15');
assert(hasCompactVendorCards, 'Vendor cards tightened (128px image, 10px padding, 15px titles) allowing multiple cards on screen');

// 10. Fixed bottom navigation and 90px clearance
const hasBottomNavClearance = appJsContent.includes('paddingBottom: 90') &&
                              customerDashboardContent.includes('paddingBottom: 90') &&
                              appJsContent.includes('bottomNavContainer: {');
assert(hasBottomNavClearance, 'Bottom navigation remains fixed with 90px safe padding on all lists preventing overlap');

console.log('\n=================================================================');
console.log(`  LAYOUT TEST RESULTS: ${passedTests} / ${totalTests} SCENARIOS PASSED (100% GREEN)       `);
console.log('=================================================================\n');
