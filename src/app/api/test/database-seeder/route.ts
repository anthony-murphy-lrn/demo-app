import { NextRequest, NextResponse } from "next/server";
import DatabaseSeeder from "../../../../lib/database-seeder";

export async function GET(_request: NextRequest) {
  try {
    // Get current seeding statistics
    const stats = await DatabaseSeeder.getSeedingStats();

    return NextResponse.json({
      status: "success",
      message: "Database seeder is working correctly",
      timestamp: new Date().toISOString(),
      databaseSeeder: {
        currentStats: stats,
        serviceStatus: "✅ Ready",
      },
      testResults: {
        databaseSeeder: "✅ Working",
        getSeedingStats: "✅ Working",
        databaseConnection: "✅ Connected",
      },
    });
  } catch (error) {
    console.error("Database seeder test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database seeder test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case "seedMinimal":
        // Create minimal demo data
        const minimalResult = await DatabaseSeeder.createMinimalDemo();

        return NextResponse.json({
          status: "success",
          message: "Minimal demo data created successfully",
          result: minimalResult,
        });

      case "seedComprehensive":
        // Create comprehensive demo data
        const comprehensiveResult =
          await DatabaseSeeder.createComprehensiveDemo();

        return NextResponse.json({
          status: "success",
          message: "Comprehensive demo data created successfully",
          result: comprehensiveResult,
        });

      case "seedCustom":
        // Create custom demo data
        const customResult = await DatabaseSeeder.seedDatabase(config);

        return NextResponse.json({
          status: "success",
          message: "Custom demo data created successfully",
          result: customResult,
        });

      case "resetDatabase":
        // Reset database to clean state
        await DatabaseSeeder.resetDatabase();

        return NextResponse.json({
          status: "success",
          message: "Database reset to clean state successfully",
        });

      case "getStats":
        // Get current seeding statistics
        const stats = await DatabaseSeeder.getSeedingStats();

        return NextResponse.json({
          status: "success",
          message: "Seeding statistics retrieved successfully",
          stats,
        });

      case "testFullSeedingFlow":
        // Test the complete seeding flow
        console.log("🧪 Testing full seeding flow...");

        // 1. Reset database
        await DatabaseSeeder.resetDatabase();
        console.log("✅ Step 1: Database reset completed");

        // 2. Create minimal demo
        const minimalDemo = await DatabaseSeeder.createMinimalDemo();
        console.log("✅ Step 2: Minimal demo created");

        // 3. Get stats after minimal seeding
        const statsAfterMinimal = await DatabaseSeeder.getSeedingStats();
        console.log("✅ Step 3: Stats retrieved after minimal seeding");

        // 4. Create comprehensive demo
        const comprehensiveDemo =
          await DatabaseSeeder.createComprehensiveDemo();
        console.log("✅ Step 4: Comprehensive demo created");

        // 5. Get final stats
        const finalStats = await DatabaseSeeder.getSeedingStats();
        console.log("✅ Step 5: Final stats retrieved");

        return NextResponse.json({
          status: "success",
          message: "Full seeding flow test completed successfully",
          testFlow: {
            step1: "Database reset completed",
            step2: "Minimal demo created",
            step3: "Stats retrieved after minimal seeding",
            step4: "Comprehensive demo created",
            step5: "Final stats retrieved",
          },
          results: {
            minimalDemo,
            comprehensiveDemo,
            statsAfterMinimal,
            finalStats,
          },
        });

      default:
        return NextResponse.json(
          { status: "error", message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Database seeder test operation failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database seeder test operation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
