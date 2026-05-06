/**
 * Mock Dojah KYC responses for development/testing.
 * Returns realistic sample data without hitting the actual API.
 */

import type {
  NINLookupResult,
  NINSelfieResult,
  BVNLookupResult,
} from "./dojah";

// Sample NIN data pool
const MOCK_NIN_DATA: Record<string, NINLookupResult> = {
  "12345678901": {
    first_name: "Adebayo",
    last_name: "Okonkwo",
    middle_name: "Chukwuemeka",
    gender: "Male",
    date_of_birth: "1990-05-15",
    phone_number: "+2348012345678",
    email: "adebayo.okonkwo@example.com",
    photo:
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=", // 1x1 transparent JPEG
    employment_status: "Employed",
    marital_status: "Single",
  },
  "98765432109": {
    first_name: "Ngozi",
    last_name: "Adekunle",
    middle_name: "Folake",
    gender: "Female",
    date_of_birth: "1988-11-22",
    phone_number: "+2348098765432",
    email: "ngozi.adekunle@example.com",
    photo:
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
    employment_status: "Self-Employed",
    marital_status: "Married",
  },
  "11122233344": {
    first_name: "Ibrahim",
    last_name: "Musa",
    middle_name: "Abdullahi",
    gender: "Male",
    date_of_birth: "1995-03-08",
    phone_number: "+2347011223344",
    email: "ibrahim.musa@example.com",
    photo:
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
    employment_status: "Student",
    marital_status: "Single",
  },
  // ── Dev test account — Francis Uzoigwe ───────────────────────────────────
  "00000000001": {
    first_name: "Francis",
    last_name: "Uzoigwe",
    middle_name: "Kossy",
    gender: "Male",
    date_of_birth: "1995-01-01",
    phone_number: "+2347047474886",
    email: "kossyuzoigwe@gmail.com",
    photo: "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
    employment_status: "Employed",
    marital_status: "Single",
  },
};

// Sample BVN data pool
const MOCK_BVN_DATA: Record<string, BVNLookupResult> = {
  "22233344455": {
    first_name: "Adebayo",
    last_name: "Okonkwo",
    middle_name: "Chukwuemeka",
    date_of_birth: "1990-05-15",
    phone_number: "+2348012345678",
    email: "adebayo.okonkwo@example.com",
    gender: "Male",
    enrollment_bank: "First Bank of Nigeria",
    enrollment_branch: "Victoria Island",
    level_of_account: "Level 3",
    nin: "12345678901",
  },
  "55544433322": {
    first_name: "Ngozi",
    last_name: "Adekunle",
    middle_name: "Folake",
    date_of_birth: "1988-11-22",
    phone_number: "+2348098765432",
    email: "ngozi.adekunle@example.com",
    gender: "Female",
    enrollment_bank: "Guaranty Trust Bank",
    enrollment_branch: "Ikeja",
    level_of_account: "Level 3",
    nin: "98765432109",
  },
  "66677788899": {
    first_name: "Ibrahim",
    last_name: "Musa",
    middle_name: "Abdullahi",
    date_of_birth: "1995-03-08",
    phone_number: "+2347011223344",
    email: "ibrahim.musa@example.com",
    gender: "Male",
    enrollment_bank: "Access Bank",
    enrollment_branch: "Abuja Central",
    level_of_account: "Level 2",
    nin: "11122233344",
  },
};

/**
 * Mock NIN lookup - returns predefined data or generates random data
 */
export async function mockLookupNIN(nin: string): Promise<NINLookupResult> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 500 + Math.random() * 1000),
  );

  // Return predefined data if available
  if (MOCK_NIN_DATA[nin]) {
    return MOCK_NIN_DATA[nin];
  }

  // Generate random mock data for unknown NIINs
  const firstNames = [
    "Adebayo",
    "Ngozi",
    "Ibrahim",
    "Chioma",
    "Oluwaseun",
    "Fatima",
    "Emeka",
    "Aisha",
  ];
  const lastNames = [
    "Okonkwo",
    "Adekunle",
    "Musa",
    "Okafor",
    "Bello",
    "Adeyemi",
    "Nwosu",
    "Hassan",
  ];
  const middleNames = [
    "Chukwuemeka",
    "Folake",
    "Abdullahi",
    "Chiamaka",
    "Oluwafemi",
    "Zainab",
    "Chinedu",
    "Amina",
  ];

  return {
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
    middle_name: middleNames[Math.floor(Math.random() * middleNames.length)],
    gender: Math.random() > 0.5 ? "Male" : "Female",
    date_of_birth: `19${80 + Math.floor(Math.random() * 20)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
    phone_number: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    email: `user${Math.floor(Math.random() * 10000)}@example.com`,
    photo:
      "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
    employment_status: ["Employed", "Self-Employed", "Unemployed", "Student"][
      Math.floor(Math.random() * 4)
    ],
    marital_status: ["Single", "Married", "Divorced", "Widowed"][
      Math.floor(Math.random() * 4)
    ],
  };
}

/**
 * Mock NIN + Selfie verification - always returns high confidence match
 */
export async function mockVerifyNINWithSelfie(
  nin: string,
  selfieBase64: string,
): Promise<NINSelfieResult> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1500),
  );

  // Get NIN data (use mock lookup)
  const ninData = await mockLookupNIN(nin);

  // Simulate varying confidence scores (mostly high)
  const confidence = 75 + Math.random() * 25; // 75-100
  const match = confidence >= 80;

  return {
    nin,
    firstname: ninData.first_name,
    surname: ninData.last_name,
    middlename: ninData.middle_name,
    gender: ninData.gender,
    birthdate: ninData.date_of_birth,
    phone: ninData.phone_number,
    photo: ninData.photo,
    selfie_verification: {
      confidence_value: Math.round(confidence * 100) / 100,
      match,
    },
  };
}

/**
 * Mock BVN lookup - returns predefined data or generates random data
 */
export async function mockLookupBVN(bvn: string): Promise<BVNLookupResult> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 500 + Math.random() * 1000),
  );

  // Return predefined data if available
  if (MOCK_BVN_DATA[bvn]) {
    return MOCK_BVN_DATA[bvn];
  }

  // Generate random mock data for unknown BVNs
  const firstNames = [
    "Adebayo",
    "Ngozi",
    "Ibrahim",
    "Chioma",
    "Oluwaseun",
    "Fatima",
    "Emeka",
    "Aisha",
  ];
  const lastNames = [
    "Okonkwo",
    "Adekunle",
    "Musa",
    "Okafor",
    "Bello",
    "Adeyemi",
    "Nwosu",
    "Hassan",
  ];
  const middleNames = [
    "Chukwuemeka",
    "Folake",
    "Abdullahi",
    "Chiamaka",
    "Oluwafemi",
    "Zainab",
    "Chinedu",
    "Amina",
  ];
  const banks = [
    "First Bank of Nigeria",
    "Guaranty Trust Bank",
    "Access Bank",
    "Zenith Bank",
    "UBA",
    "Ecobank",
  ];
  const branches = [
    "Victoria Island",
    "Ikeja",
    "Abuja Central",
    "Port Harcourt",
    "Kano",
    "Ibadan",
  ];

  return {
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
    middle_name: middleNames[Math.floor(Math.random() * middleNames.length)],
    date_of_birth: `19${80 + Math.floor(Math.random() * 20)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
    phone_number: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    email: `user${Math.floor(Math.random() * 10000)}@example.com`,
    gender: Math.random() > 0.5 ? "Male" : "Female",
    enrollment_bank: banks[Math.floor(Math.random() * banks.length)],
    enrollment_branch: branches[Math.floor(Math.random() * branches.length)],
    level_of_account: `Level ${Math.floor(Math.random() * 3) + 1}`,
    nin: `${Math.floor(Math.random() * 90000000000) + 10000000000}`,
  };
}
