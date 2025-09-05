import { NextRequest } from "next/server";
import { learnosityConfigService } from "@/lib/learnosity-config-service";
import { STATUS_CODES } from "@/constants";
import { validateLearnosityConfigRequest } from "@/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  handleGenericError,
} from "@/utils/error-handler";

// GET /api/learnosity-config - Retrieve current Learnosity configuration
export async function GET() {
  try {
    const config = await learnosityConfigService.getConfig();

    if (config) {
      return createSuccessResponse({
        config: {
          id: config.id,
          endpoint: config.endpoint,
          expiresMinutes: config.expiresMinutes,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        },
      });
    } else {
      // Return default configuration if no saved config exists
      const defaultConfig = learnosityConfigService.getDefaultConfig();
      return createSuccessResponse({
        config: {
          id: "default",
          endpoint: defaultConfig.endpoint,
          expiresMinutes: defaultConfig.expiresMinutes,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isDefault: true,
      });
    }
  } catch (error) {
    console.error("Learnosity config GET error:", error);
    return createErrorResponse(
      "Failed to retrieve Learnosity configuration",
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      undefined,
      "CONFIG_RETRIEVAL_ERROR"
    );
  }
}

// POST /api/learnosity-config - Save Learnosity configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateLearnosityConfigRequest(body);
    if (!validation.isValid) {
      return createErrorResponse(
        "Validation failed",
        STATUS_CODES.BAD_REQUEST,
        validation.errors,
        "VALIDATION_ERROR"
      );
    }

    // Save configuration to database
    const savedConfig = await learnosityConfigService.saveConfig({
      endpoint: body.endpoint,
      expiresMinutes: body.expiresMinutes,
    });

    return createSuccessResponse({
      config: {
        id: savedConfig.id,
        endpoint: savedConfig.endpoint,
        expiresMinutes: savedConfig.expiresMinutes,
        createdAt: savedConfig.createdAt,
        updatedAt: savedConfig.updatedAt,
      },
    });
  } catch (error) {
    console.error("Learnosity config POST error:", error);
    return handleGenericError(error, "Learnosity Configuration Save");
  }
}
