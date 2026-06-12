#!/usr/bin/env node

/**
 * MYB Platform: OVH Database Fake Data Generator
 * Connects to OVH PostgreSQL and inserts realistic test data
 * 
 * Usage: npm install pg && node scripts/generate-fake-data-ovh.js
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

async function generateFakeData() {
  const client = new Client({
    host: "postgresql-72268bd4-oc862fcb1.database.cloud.ovh.net",
    port: 20184,
    user: "coproperty_user",
    password: "fSC2TpHJnlya18re3D0B",
    database: "copropertyDB",
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
  });

  try {
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(
      `${colors.green}MYB OVH Database - Fake Data Generator${colors.reset}`
    );
    console.log(`${colors.green}========================================${colors.reset}`);

    console.log(`\n${colors.yellow}Connecting to OVH Database...${colors.reset}`);
    console.log("Host: postgresql-72268bd4-oc862fcb1.database.cloud.ovh.net");
    console.log("Port: 20184");
    console.log("User: coproperty_user");
    console.log("Database: copropertyDB");
    console.log("SSL Mode: required (with self-signed cert acceptance)");

    await client.connect();
    console.log(`${colors.green}✓ Connected to OVH database${colors.reset}`);

    // Read the SQL script
    const sqlPath = path.join(__dirname, "generate-fake-data.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL script not found: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    console.log(`\n${colors.yellow}Executing SQL script...${colors.reset}`);
    console.log(
      `${colors.yellow}(This will insert test data into the database)${colors.reset}`
    );

    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    let executedCount = 0;
    for (const statement of statements) {
      try {
        await client.query(statement);
        executedCount++;
        // Show progress for every 5 statements
        if (executedCount % 5 === 0) {
          process.stdout.write(".");
        }
      } catch (err) {
        // Some statements might fail due to duplicates, that's okay
        if (!err.message.includes("duplicate") && !err.message.includes("already exists")) {
          console.error(
            `\n${colors.red}Error executing statement:${colors.reset}`,
            statement.substring(0, 100)
          );
          console.error(`${colors.red}${err.message}${colors.reset}`);
        }
      }
    }

    console.log("\n");

    // Verify data was inserted
    console.log(`${colors.yellow}Verifying inserted data...${colors.reset}`);

    const verifications = [
      { table: "coproperties", name: "Coproperties" },
      { table: "owners", name: "Owners" },
      { table: "units", name: "Units" },
      { table: "budgets", name: "Budgets" },
      { table: "charges", name: "Charges" },
      { table: "charge_distributions", name: "Charge Distributions" },
      { table: "fund_calls", name: "Fund Calls" },
      { table: "fund_call_payments", name: "Fund Call Payments" },
    ];

    console.log(`${colors.yellow}\nData Summary:${colors.reset}`);

    for (const verification of verifications) {
      try {
        const result = await client.query(
          `SELECT COUNT(*) as count FROM ${verification.table}`
        );
        const count = result.rows[0].count;
        console.log(`  ${verification.name}: ${count}`);
      } catch (err) {
        console.log(`  ${verification.name}: (table not accessible)`);
      }
    }

    console.log(`\n${colors.green}========================================${colors.reset}`);
    console.log(
      `${colors.green}✓ Fake data generated successfully on OVH!${colors.reset}`
    );
    console.log(`${colors.green}========================================${colors.reset}`);

    console.log(`\n${colors.yellow}Test Accounts Ready:${colors.reset}`);
    console.log("  Owner 1: Haithem Khalifa (haithem.khalifa@example.com)");
    console.log("  Owner 2: Fatima Ben Ali (fatima.benali@example.com)");
    console.log("  Owner 3: Mohamed Triki (mohamed.triki@example.com)");
    console.log("  Owner 4: Amina Mabrouk (amina.mabrouk@example.com)");
    console.log("  Owner 5: Karim Salah (karim.salah@example.com)");
    console.log("  Owner 6: Leila Zahra (leila.zahra@example.com)");

    console.log(`\n${colors.yellow}You can now:${colors.reset}`);
    console.log("  1. Login to the platform with test accounts");
    console.log("  2. Test payment submissions");
    console.log("  3. Test syndic approval workflow");

    process.exit(0);
  } catch (error) {
    console.error(
      `\n${colors.red}✗ Error: ${error.message}${colors.reset}`
    );
    console.error(`${colors.red}${error.stack}${colors.reset}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the generator
generateFakeData();
