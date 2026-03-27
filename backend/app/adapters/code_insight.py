import asyncio
import random
from .base import CodeInsightAdapter

CODE_AREAS = {
    "billing": {
        "service": "billing-service",
        "files": [
            "src/services/billing/charge-processor.ts",
            "src/services/billing/subscription-manager.ts",
            "src/services/billing/refund-handler.ts",
        ],
        "recent_changes": [
            {"file": "src/services/billing/charge-processor.ts", "author": "dev-sarah", "date": "2025-03-22", "message": "fix: retry logic for failed charges", "lines_changed": 47},
            {"file": "src/services/billing/subscription-manager.ts", "author": "dev-mike", "date": "2025-03-20", "message": "feat: add annual plan support", "lines_changed": 134},
        ],
        "dependencies": ["stripe-sdk", "postgres", "redis-cache"],
        "error_patterns": ["ChargeProcessingError", "DuplicateTransactionError", "RefundWindowExpired"],
    },
    "checkout": {
        "service": "checkout-service",
        "files": [
            "src/services/checkout/order-processor.ts",
            "src/services/checkout/promo-engine.ts",
            "src/services/checkout/cart-validator.ts",
        ],
        "recent_changes": [
            {"file": "src/services/checkout/promo-engine.ts", "author": "dev-alex", "date": "2025-03-24", "message": "feat: stackable promo codes", "lines_changed": 89},
            {"file": "src/services/checkout/cart-validator.ts", "author": "dev-sarah", "date": "2025-03-23", "message": "fix: edge case with empty cart validation", "lines_changed": 23},
        ],
        "dependencies": ["billing-service", "inventory-service", "redis-cache"],
        "error_patterns": ["InvalidPromoCodeError", "CartValidationError", "OrderCreationFailed"],
    },
    "authentication": {
        "service": "auth-service",
        "files": [
            "src/services/auth/password-reset.ts",
            "src/services/auth/email-sender.ts",
            "src/services/auth/session-manager.ts",
        ],
        "recent_changes": [
            {"file": "src/services/auth/email-sender.ts", "author": "dev-jordan", "date": "2025-03-25", "message": "refactor: switch to new email provider SDK", "lines_changed": 156},
            {"file": "src/services/auth/password-reset.ts", "author": "dev-jordan", "date": "2025-03-24", "message": "fix: token expiry validation", "lines_changed": 31},
        ],
        "dependencies": ["sendgrid-sdk", "redis-session-store", "postgres"],
        "error_patterns": ["EmailDeliveryFailed", "TokenExpiredError", "RateLimitExceeded"],
    },
    "file-management": {
        "service": "file-service",
        "files": [
            "src/services/files/upload-handler.ts",
            "src/services/files/storage-adapter.ts",
            "src/services/files/virus-scanner.ts",
        ],
        "recent_changes": [
            {"file": "src/services/files/upload-handler.ts", "author": "dev-priya", "date": "2025-03-23", "message": "feat: chunked upload support for large files", "lines_changed": 201},
            {"file": "src/services/files/storage-adapter.ts", "author": "dev-priya", "date": "2025-03-21", "message": "refactor: migrate to S3 multipart API", "lines_changed": 87},
        ],
        "dependencies": ["aws-s3-sdk", "clamav", "postgres"],
        "error_patterns": ["UploadTimeoutError", "FileSizeLimitExceeded", "ScanFailedError"],
    },
    "ui-frontend": {
        "service": "web-frontend",
        "files": [
            "src/pages/billing/BillingPage.tsx",
            "src/components/DataTable/DataTable.tsx",
            "src/hooks/useResponsive.ts",
        ],
        "recent_changes": [
            {"file": "src/pages/billing/BillingPage.tsx", "author": "dev-lisa", "date": "2025-03-25", "message": "feat: new billing dashboard layout", "lines_changed": 312},
            {"file": "src/components/DataTable/DataTable.tsx", "author": "dev-lisa", "date": "2025-03-24", "message": "fix: mobile viewport overflow on tables", "lines_changed": 45},
        ],
        "dependencies": ["react", "tailwindcss", "tanstack-table"],
        "error_patterns": ["RenderError", "HydrationMismatch", "ViewportOverflow"],
    },
    "api": {
        "service": "api-gateway",
        "files": [
            "src/api/middleware/rate-limiter.ts",
            "src/api/routes/v2/handlers.ts",
            "src/api/middleware/error-handler.ts",
        ],
        "recent_changes": [
            {"file": "src/api/middleware/rate-limiter.ts", "author": "dev-mike", "date": "2025-03-25", "message": "feat: per-endpoint rate limits", "lines_changed": 67},
        ],
        "dependencies": ["express", "redis", "helmet"],
        "error_patterns": ["RateLimitError", "TimeoutError", "AuthorizationError"],
    },
}


class MockCodeInsightAdapter(CodeInsightAdapter):
    """Mock Macroscope code insight adapter. Replace with real Macroscope integration."""

    async def analyze_code_area(self, product_area: str, issue_summary: str) -> dict:
        await asyncio.sleep(random.uniform(0.4, 0.9))

        area_data = CODE_AREAS.get(product_area, CODE_AREAS["api"])

        failure_modes = {
            "billing": "Race condition in charge retry logic causing duplicate transactions when the payment gateway returns a timeout but the charge succeeds server-side",
            "checkout": "Promo code validation fails silently when stackable codes interact with percentage-based discounts, causing a NaN total",
            "authentication": "Email provider SDK migration introduced a breaking change in template rendering, causing password reset emails to fail silently with a 202 (accepted) status but no actual delivery",
            "file-management": "Chunked upload handler drops the final chunk when file size is exactly at a chunk boundary, resulting in a corrupted file that passes size validation but fails integrity check",
            "ui-frontend": "New billing page layout uses CSS Grid with fixed column widths that overflow on viewports below 768px, causing horizontal scroll and unclickable elements",
            "api": "New per-endpoint rate limiter miscounts requests for authenticated users, causing premature 429 responses",
        }

        return {
            "service": area_data["service"],
            "likely_files": area_data["files"],
            "probable_failure_mode": failure_modes.get(product_area, "Unknown failure mode requiring manual investigation"),
            "recent_changes": area_data["recent_changes"],
            "dependencies": area_data["dependencies"],
            "error_patterns": area_data["error_patterns"],
            "confidence": random.uniform(0.65, 0.92),
        }

    async def get_recent_changes(self, code_area: str) -> list[dict]:
        await asyncio.sleep(0.2)
        area_data = CODE_AREAS.get(code_area, CODE_AREAS["api"])
        return area_data["recent_changes"]
