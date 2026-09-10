// Security & RBAC Guardrails: Role Authorization, Rate Limiting & Secrets Sanitization

export type UserRole = "Admin" | "Manager" | "Agent" | "Viewer";
export type OperationType = "read" | "write" | "delete" | "admin";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

export class SecurityGuard {
  /**
   * Role-Based Access Control (RBAC) policy evaluator
   */
  static checkPermission(
    role: UserRole | string,
    operation: OperationType,
    resource: string
  ): { allowed: boolean; statusCode: number; message?: string } {
    const normRole = (role || "Viewer").toLowerCase();

    // 1. Viewer Role: strictly read-only
    if (normRole === "viewer") {
      if (operation !== "read") {
        return {
          allowed: false,
          statusCode: 403,
          message: `Forbidden: Viewer role does not have permission to perform ${operation} on ${resource}.`
        };
      }
      return { allowed: true, statusCode: 200 };
    }

    // 2. Agent Role: can read and write operational entities, but cannot delete or modify admin settings
    if (normRole === "agent") {
      if (operation === "admin" || (operation === "delete" && (resource === "knowledge" || resource === "organization"))) {
        return {
          allowed: false,
          statusCode: 403,
          message: `Forbidden: Agent role cannot delete ${resource} or modify system policies. Admin authorization required.`
        };
      }
      return { allowed: true, statusCode: 200 };
    }

    // 3. Manager & Admin Roles: full operational and administrative permissions
    if (normRole === "admin" || normRole === "manager") {
      return { allowed: true, statusCode: 200 };
    }

    return {
      allowed: false,
      statusCode: 401,
      message: "Unauthorized: Invalid or unknown user role."
    };
  }

  /**
   * Sliding window in-memory Rate Limiter
   * Default: 60 requests per minute
   */
  static rateLimit(
    clientId: string,
    limit: number = 60,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const bucket = rateLimitMap.get(clientId);

    if (!bucket || now > bucket.resetAt) {
      rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetInMs: Math.max(0, bucket.resetAt - now)
      };
    }

    bucket.count++;
    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetInMs: Math.max(0, bucket.resetAt - now)
    };
  }

  /**
   * Strip sensitive tokens and API keys from outbound response objects
   */
  static sanitizeOutput(data: any): any {
    if (!data || typeof data !== "object") return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeOutput(item));
    }

    const sanitized = { ...data };
    const sensitiveKeys = [
      "password",
      "password_hash",
      "secret",
      "api_key",
      "access_token",
      "refresh_token",
      "gemini_api_key",
      "openai_api_key"
    ];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        delete sanitized[key];
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = this.sanitizeOutput(sanitized[key]);
      }
    }

    return sanitized;
  }
}
