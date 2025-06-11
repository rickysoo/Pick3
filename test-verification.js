// Direct API test verification
import fetch from 'node-fetch';

const tests = [
  {
    name: "Budget Smartphones",
    query: "smartphones under $300 with good cameras",
    expectedBrands: ["Samsung", "Xiaomi", "Realme", "Nokia", "Motorola"],
    minFeatures: 8,
    maxPrice: 300
  },
  {
    name: "Gaming Laptops", 
    query: "gaming laptops under $1000",
    expectedBrands: ["Acer", "ASUS", "Dell", "HP", "Lenovo"],
    minFeatures: 10,
    maxPrice: 1000
  },
  {
    name: "Wireless Headphones",
    query: "wireless headphones under $150",
    expectedBrands: ["Sony", "Anker", "JBL", "Audio-Technica"],
    minFeatures: 6,
    maxPrice: 150
  }
];

async function runVerification() {
  console.log("Running Pick3 App Verification Tests\n");
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`Query: "${test.query}"`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const response = await fetch('http://localhost:5000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: test.query }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status}\n`);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`Products: ${result.products?.length || 0}`);
      console.log(`Features: ${result.features?.length || 0}`);
      
      if (result.products?.length > 0) {
        result.products.forEach((product, i) => {
          console.log(`  ${i+1}. ${product.name} - ${product.pricing}`);
        });
        
        // Fact-checking
        const brands = result.products.map(p => p.name);
        const hasAuthenticBrand = brands.some(name => 
          test.expectedBrands.some(brand => name.includes(brand))
        );
        
        const featureCount = result.features?.length || 0;
        const hasEnoughFeatures = featureCount >= test.minFeatures;
        
        console.log(`✅ Authentic Brands: ${hasAuthenticBrand ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Feature Count: ${hasEnoughFeatures ? 'PASS' : 'FAIL'} (${featureCount})`);
        console.log(`✅ Overall: ${hasAuthenticBrand && hasEnoughFeatures ? 'PASS' : 'FAIL'}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏱️ Test timed out after 20s`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    console.log("---\n");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runVerification();