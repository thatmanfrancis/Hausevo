/**
 * Example usage of Dojah mock system
 * This file demonstrates how to test the mock functionality
 */

import { lookupNIN, verifyNINWithSelfie, lookupBVN } from "./dojah";

// Example 1: Test NIN lookup with predefined data
export async function testNINLookup() {
  console.log("Testing NIN Lookup...");
  
  try {
    // Use predefined test NIN
    const result = await lookupNIN("12345678901");
    console.log("✅ NIN Lookup Success:", result);
    return result;
  } catch (error) {
    console.error("❌ NIN Lookup Failed:", error);
    throw error;
  }
}

// Example 2: Test NIN + Selfie verification
export async function testNINSelfieVerification() {
  console.log("Testing NIN + Selfie Verification...");
  
  try {
    // Mock selfie image (base64)
    const mockSelfie = "/9j/4AAQSkZJRgABAQEAYABgAAD..."; // truncated for example
    
    const result = await verifyNINWithSelfie("12345678901", mockSelfie);
    console.log("✅ Selfie Verification Success:", result);
    console.log(`   Confidence: ${result.selfie_verification.confidence_value}%`);
    console.log(`   Match: ${result.selfie_verification.match}`);
    return result;
  } catch (error) {
    console.error("❌ Selfie Verification Failed:", error);
    throw error;
  }
}

// Example 3: Test BVN lookup
export async function testBVNLookup() {
  console.log("Testing BVN Lookup...");
  
  try {
    // Use predefined test BVN
    const result = await lookupBVN("22233344455");
    console.log("✅ BVN Lookup Success:", result);
    return result;
  } catch (error) {
    console.error("❌ BVN Lookup Failed:", error);
    throw error;
  }
}

// Example 4: Test with random/unknown NIN (generates random data)
export async function testRandomNIN() {
  console.log("Testing Random NIN...");
  
  try {
    // Use a NIN not in the predefined list
    const result = await lookupNIN("99988877766");
    console.log("✅ Random NIN Success (generated data):", result);
    return result;
  } catch (error) {
    console.error("❌ Random NIN Failed:", error);
    throw error;
  }
}

// Run all tests
export async function runAllTests() {
  console.log("=".repeat(50));
  console.log("DOJAH MOCK SYSTEM TESTS");
  console.log("=".repeat(50));
  console.log(`Mock Mode: ${process.env.DOJAH_USE_MOCK === "true" ? "ENABLED ✅" : "DISABLED (using real API)"}`);
  console.log("=".repeat(50));
  
  await testNINLookup();
  console.log("\n");
  
  await testNINSelfieVerification();
  console.log("\n");
  
  await testBVNLookup();
  console.log("\n");
  
  await testRandomNIN();
  console.log("\n");
  
  console.log("=".repeat(50));
  console.log("ALL TESTS COMPLETED");
  console.log("=".repeat(50));
}

// Uncomment to run tests:
// runAllTests().catch(console.error);
