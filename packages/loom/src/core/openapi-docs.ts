/**
 * Build a FastAPI-style Swagger UI page for Loom's OpenAPI document.
 * Assets are same-origin (`{prefix}/docs/swagger-ui.*`) so default CSP applies.
 */
export function buildLoomOpenApiDocsHtml(options: {
  title: string;
  /** Absolute path to the OpenAPI JSON (e.g. `/api/loom/v1/openapi.json`) */
  specUrl: string;
  /** Absolute path prefix for vendored Swagger UI assets (e.g. `/api/loom/v1/docs`) */
  docsBasePath: string;
  /** CSRF cookie name for Try-it-out mutations (double-submit) */
  csrfCookieName?: string;
}): string {
  const title = escapeHtml(options.title);
  const docsBase = options.docsBasePath.replace(/\/$/, '');
  const cssHref = escapeHtml(`${docsBase}/swagger-ui.css`);
  const jsSrc = escapeHtml(`${docsBase}/swagger-ui-bundle.js`);
  const csrfCookie = options.csrfCookieName ?? 'loom_csrf';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — API docs</title>
  <link rel="stylesheet" href="${cssHref}" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${jsSrc}"></script>
  <script>
    function readCookie(name) {
      var match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\\[\\]\\\\/+^])/g, '\\\\$1') + '=([^;]*)')
      );
      return match ? decodeURIComponent(match[1]) : '';
    }
    window.ui = SwaggerUIBundle({
      url: ${JSON.stringify(options.specUrl)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
      requestInterceptor: function (req) {
        req.credentials = 'include';
        var method = (req.method || 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
          var token = readCookie(${JSON.stringify(csrfCookie)});
          if (token) {
            req.headers = req.headers || {};
            req.headers['X-CSRF-Token'] = token;
          }
        }
        return req;
      },
    });
  </script>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
