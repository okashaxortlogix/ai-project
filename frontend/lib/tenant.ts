export function getRequestedOrgId(request?: Request | null, explicitOrgId?: string | null): string {
  if (explicitOrgId && explicitOrgId.trim()) {
    return explicitOrgId.trim();
  }

  if (request) {
    try {
      const headerOrg = request.headers.get("x-organization-id") || request.headers.get("x-tenant-id");
      if (headerOrg && headerOrg.trim()) {
        return headerOrg.trim();
      }

      const url = new URL(request.url);
      const queryOrg = url.searchParams.get("orgId") || url.searchParams.get("tenantId");
      if (queryOrg && queryOrg.trim()) {
        return queryOrg.trim();
      }
    } catch {
      // url parsing fallback
    }
  }

  return "org-default";
}
