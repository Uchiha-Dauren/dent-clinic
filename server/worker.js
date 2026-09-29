import { handleApi } from './api.js';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/'))
      return handleApi(request, env, {
        clientIp: request.headers.get('cf-connecting-ip') || 'unknown',
        platformIdentity: {
          id: request.headers.get('oai-authenticated-user-id'),
          email: request.headers.get('oai-authenticated-user-email'),
        },
      });
    let response = await env.ASSETS.fetch(request);
    if (
      response.status === 404 &&
      !/\.[^/]+$/.test(url.pathname) &&
      ['GET', 'HEAD'].includes(request.method)
    ) {
      url.pathname = '/index.html';
      url.search = '';
      response = await env.ASSETS.fetch(
        new Request(url, { method: request.method, headers: request.headers }),
      );
    }
    return response;
  },
};
