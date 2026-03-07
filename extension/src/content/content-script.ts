// Content script: captures a cleaned version of the page HTML and sends it to the background worker.

function captureCleanHtml(): string {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;

  // Remove tags that add noise but no useful text content
  const noiseTags = ['script', 'style', 'svg', 'img', 'video', 'audio', 'iframe', 'noscript', 'canvas'];
  for (const tag of noiseTags) {
    clone.querySelectorAll(tag).forEach((el) => el.remove());
  }

  // Remove hidden elements to reduce payload size
  clone.querySelectorAll('[aria-hidden="true"], [hidden]').forEach((el) => el.remove());

  // Cap at 400 KB to stay well within Claude's context limit
  const html = clone.outerHTML;
  return html.length > 400_000 ? html.slice(0, 400_000) : html;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ alive: true });
    return true;
  }

  if (message.type === 'CAPTURE_HTML') {
    try {
      const html = captureCleanHtml();
      sendResponse({ success: true, html, sourceUrl: window.location.href });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sendResponse({ success: false, error: msg });
    }
    return true;
  }
});
