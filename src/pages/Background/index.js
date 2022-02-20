console.log('This is the background page.');
console.log('Put the background scripts here.');


// 특정 페이지에서만 동작하도록 변경
chrome.runtime.onInstalled.addListener(function () {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              urlContains: 'store.musinsa.com/app/goods/',
            },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});