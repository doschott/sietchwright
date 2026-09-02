// @ts-check
/**
 * Sign-out sequencing used by the optional Better Auth client.
 * Extracted so typecheck and tests can import it without a missing Grok template file.
 */

/**
 * @param {{
 *   livePreview: boolean,
 *   hasBearer: boolean,
 *   requestSignOut: () => Promise<unknown>,
 *   clearToken: () => void,
 * }} opts
 */
export async function runPreSignInSignOut(opts) {
  const timeoutMs = opts.livePreview ? 1500 : 8000;
  try {
    await Promise.race([
      opts.requestSignOut(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("sign-out timeout")), timeoutMs);
      }),
    ]);
  } catch {
    /* preview and local: clearing the bearer is enough to switch identity */
  }
  opts.clearToken();
}

/**
 * @param {{
 *   livePreview: boolean,
 *   hasBearer: boolean,
 *   requestSignOut: () => Promise<unknown>,
 *   clearToken: () => void,
 *   redirect: () => void,
 * }} opts
 */
export async function runSignOut(opts) {
  if (opts.livePreview || opts.hasBearer) {
    try {
      await opts.requestSignOut();
    } catch {
      /* local/preview session may already be gone */
    }
    opts.clearToken();
    opts.redirect();
    return;
  }
  await opts.requestSignOut();
  opts.clearToken();
  opts.redirect();
}
