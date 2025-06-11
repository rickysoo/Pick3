#!/usr/bin/env node

// Test Cases for Pick3 Product Comparison App
// Validates functionality and fact-checks results for data authenticity

const testCases = [
  {
    id: 1,
    name: "Budget Smartphones Test",
    searchQuery: "smartphones under $300 with good cameras",
    expectedFeatures: ["Display", "Camera", "Battery", "Storage", "RAM", "Processor", "Operating System"],
    minFeatures: 8,
    maxFeatures: 15,
    expectedProductCount: 3,
    priceRange: { min: 100, max: 300 },
    factCheckCriteria: {
      realBrands: ["Samsung", "Xiaomi", "Realme", "Nokia", "Motorola", "OnePlus"],
      validWebsites: ["samsung.com", "mi.com", "realme.com", "nokia.com", "motorola.com", "oneplus.com"]
    }
  },
  {
    id: 2,
    name: "Gaming Laptops Test",
    searchQuery: "gaming laptops under $1000",
    expectedFeatures: ["Processor", "Graphics Card", "RAM", "Storage", "Display", "Battery Life", "Operating System"],
    minFeatures: 10,
    maxFeatures: 15,
    expectedProductCount: 3,
    priceRange: { min: 600, max: 1000 },
    factCheckCriteria: {
      realBrands: ["Acer", "ASUS", "Dell", "HP", "Lenovo", "MSI"],
      validWebsites: ["acer.com", "asus.com", "dell.com", "hp.com", "lenovo.com", "msi.com"],
      requiredSpecs: ["NVIDIA", "AMD", "Intel"]
    }
  },
  {
    id: 3,
    name: "Wireless Headphones Test", 
    searchQuery: "wireless headphones under $150 with noise cancellation",
    expectedFeatures: ["Noise Cancellation", "Battery Life", "Wireless", "Bluetooth"],
    minFeatures: 6,
    maxFeatures: 12,
    expectedProductCount: 3,
    priceRange: { min: 50, max: 150 },
    factCheckCriteria: {
      realBrands: ["Sony", "Bose", "Audio-Technica", "Anker", "JBL", "Sennheiser"],
      validWebsites: ["sony.com", "bose.com", "audio-technica.com", "soundcore.com", "jbl.com", "sennheiser.com"]
    }
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Running Test ${testCase.id}: ${testCase.name}`);
  console.log(`📝 Query: "${testCase.searchQuery}"`);
  
  try {
    const response = await fetch('http://localhost:5000/api/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchQuery: testCase.searchQuery })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log(`\n📊 Results Summary:`);
    console.log(`   Products found: ${result.products?.length || 0}`);
    console.log(`   Features compared: ${result.features?.length || 0}`);
    console.log(`   Message: ${result.message || 'None'}`);

    // Fact-checking
    const factCheckResults = performFactCheck(result, testCase);
    
    return {
      testCase: testCase.name,
      passed: factCheckResults.passed,
      results: result,
      factCheck: factCheckResults
    };

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return {
      testCase: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

function performFactCheck(result, testCase) {
  const checks = {
    productCount: false,
    featureCount: false,
    brandAuthenticity: false,
    websiteValidity: false,
    priceRealism: false,
    specAuthenticity: false
  };

  const issues = [];

  // Check product count
  if (result.products && result.products.length > 0 && result.products.length <= 3) {
    checks.productCount = true;
  } else {
    issues.push(`Expected 1-3 products, got ${result.products?.length || 0}`);
  }

  // Check feature count
  if (result.features && result.features.length >= testCase.minFeatures && result.features.length <= testCase.maxFeatures) {
    checks.featureCount = true;
  } else {
    issues.push(`Expected ${testCase.minFeatures}-${testCase.maxFeatures} features, got ${result.features?.length || 0}`);
  }

  // Check brand authenticity
  if (result.products) {
    const brandCheck = result.products.every(product => {
      return testCase.factCheckCriteria.realBrands.some(brand => 
        product.name.toLowerCase().includes(brand.toLowerCase())
      );
    });
    checks.brandAuthenticity = brandCheck;
    if (!brandCheck) {
      issues.push("Some products don't match expected authentic brands");
    }
  }

  // Check website validity
  if (result.products) {
    const websiteCheck = result.products.every(product => {
      return testCase.factCheckCriteria.validWebsites.some(site => 
        product.website.toLowerCase().includes(site)
      );
    });
    checks.websiteValidity = websiteCheck;
    if (!websiteCheck) {
      issues.push("Some websites don't match expected official domains");
    }
  }

  // Check price realism
  if (result.products) {
    const priceCheck = result.products.every(product => {
      const priceNum = parseFloat(product.pricing.replace(/[^0-9.]/g, ''));
      return priceNum >= testCase.priceRange.min && priceNum <= testCase.priceRange.max;
    });
    checks.priceRealism = priceCheck;
    if (!priceCheck) {
      issues.push(`Some prices are outside expected range $${testCase.priceRange.min}-$${testCase.priceRange.max}`);
    }
  }

  // Check spec authenticity (for gaming laptops)
  if (testCase.factCheckCriteria.requiredSpecs && result.products) {
    const specCheck = result.products.some(product => {
      const productText = JSON.stringify(product).toLowerCase();
      return testCase.factCheckCriteria.requiredSpecs.some(spec => 
        productText.includes(spec.toLowerCase())
      );
    });
    checks.specAuthenticity = specCheck;
    if (!specCheck) {
      issues.push("Missing expected technical specifications");
    }
  } else {
    checks.specAuthenticity = true; // Not applicable for this test
  }

  const passed = Object.values(checks).every(check => check === true);

  console.log(`\n🔍 Fact-Check Results:`);
  console.log(`   ✅ Product Count: ${checks.productCount ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Feature Count: ${checks.featureCount ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Brand Authenticity: ${checks.brandAuthenticity ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Website Validity: ${checks.websiteValidity ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Price Realism: ${checks.priceRealism ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Spec Authenticity: ${checks.specAuthenticity ? 'PASS' : 'FAIL'}`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Issues Found:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  console.log(`\n🎯 Overall Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  return { passed, checks, issues };
}

async function runAllTests() {
  console.log('🚀 Starting Pick3 App Comprehensive Testing & Fact-Checking');
  console.log('=' * 60);

  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Wait 2 seconds between tests to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📋 FINAL TEST SUMMARY');
  console.log('=' * 40);
  
  let passedCount = 0;
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`Test ${index + 1}: ${result.testCase} - ${status}`);
    if (result.passed) passedCount++;
  });

  console.log(`\n🏆 Overall Success Rate: ${passedCount}/${results.length} (${Math.round(passedCount/results.length * 100)}%)`);
  
  if (passedCount === results.length) {
    console.log('🎉 All tests passed! The app is working correctly with authentic data.');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above for improvements needed.');
  }

  return results;
}

// Run tests when file is executed directly
runAllTests().catch(console.error);