let originalProvider = window.ethereum;
const injectedProvider = {
  async request(payload) {
    if (isTransactionRequest(payload)) {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "NEW_TRANSACTION",
            transaction: payload,
          },
          (response) => {
            if (response && response.success) {
              // Wait for approval/rejection
              chrome.runtime.onMessage.addListener(function listener(message) {
                if (
                  message.type === "TRANSACTION_APPROVED" &&
                  message.transaction.id === response.txId
                ) {
                  chrome.runtime.onMessage.removeListener(listener);
                  resolve(originalProvider.request(payload));
                } else if (
                  message.type === "TRANSACTION_REJECTED" &&
                  message.transaction.id === response.txId
                ) {
                  chrome.runtime.onMessage.removeListener(listener);
                  reject(new Error("Transaction rejected by user"));
                }
              });
            } else {
              reject(new Error("Failed to process transaction"));
            }
          }
        );
      });
      return response;
    }
    return originalProvider.request(payload);
  },
};

function isTransactionRequest(payload) {
  const methods = ["eth_sendTransaction", "eth_sign", "personal_sign"];
  return methods.includes(payload.method);
}

// Inject provider
window.ethereum = new Proxy(originalProvider, {
  get(target, prop) {
    if (prop === "request") {
      return injectedProvider.request.bind(injectedProvider);
    }
    return target[prop];
  },
});
