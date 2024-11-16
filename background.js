let pendingTransactions = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_TRANSACTION") {
    handleTransaction(message.transaction);
    sendResponse({ success: true });
  } else if (message.type === "GET_PENDING_TRANSACTIONS") {
    sendResponse({ transactions: pendingTransactions });
  } else if (message.type === "APPROVE_TRANSACTION") {
    approveTransaction(message.txId);
    sendResponse({ success: true });
  } else if (message.type === "REJECT_TRANSACTION") {
    rejectTransaction(message.txId);
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

function handleTransaction(transaction) {
  const txDetails = parseTransaction(transaction);
  pendingTransactions.push(txDetails);

  // Show notification
  chrome.notifications.create({
    type: "basic",
    iconUrl: "check.png",
    title: "New Transaction Detected",
    message: `Type: ${txDetails.type}\nAmount: ${formatEther(
      txDetails.value
    )} ETH`,
  });

  // Update badge
  chrome.action.setBadgeText({ text: pendingTransactions.length.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

  // Store in chrome.storage
  chrome.storage.local.set({
    pendingTransactions: pendingTransactions,
  });
}

function parseTransaction(transaction) {
  return {
    id: Date.now(),
    type: transaction.method,
    from: transaction.params[0].from,
    to: transaction.params[0].to,
    value: transaction.params[0].value || "0",
    gasPrice: transaction.params[0].gasPrice,
    timestamp: new Date().toISOString(),
    status: "pending",
  };
}

function approveTransaction(txId) {
  const tx = pendingTransactions.find((t) => t.id === txId);
  if (tx) {
    tx.status = "approved";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "TRANSACTION_APPROVED",
        transaction: tx,
      });
    });
    updateTransactionsList();
  }
}

function rejectTransaction(txId) {
  const tx = pendingTransactions.find((t) => t.id === txId);
  if (tx) {
    tx.status = "rejected";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "TRANSACTION_REJECTED",
        transaction: tx,
      });
    });
    updateTransactionsList();
  }
}


function updateTransactionsList() {
  pendingTransactions = pendingTransactions.filter(
    (tx) => tx.status === "pending"
  );
  chrome.action.setBadgeText({
    text: pendingTransactions.length
      ? pendingTransactions.length.toString()
      : "",
  });
  chrome.storage.local.set({ pendingTransactions: pendingTransactions });
}
