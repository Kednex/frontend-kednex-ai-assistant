/**
 * Append the current URL's query string (e.g. ?userUuid=...) to a path so
 * required params survive client-side navigation between routes.
 */
export function withCurrentQuery(path: string): string {
    if (typeof window === "undefined") return path;
    const qs = window.location.search; // includes the leading "?" or is ""
    return qs ? `${path}${qs}` : path;
}
