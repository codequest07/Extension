export { formatEther } from "ethers";

document.addEventListener("DOMContentLoaded", function () {
  // Load stored transactions
  chrome.storage.local.get(["pendingTransactions"], function (result) {
    if (result.pendingTransactions) {
      displayTransactions(result.pendingTransactions);
    }
  });

  // Listen for updates
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.pendingTransactions) {
      displayTransactions(changes.pendingTransactions.newValue);
    }
  });
});

interface Transaction {
  id: number;
  type: string;
  from: string;
  to: string;
  value: string;
}

function displayTransactions(transactions: Transaction[]): void {
  const container = document.getElementById("pendingTransactions");
  if (!container) return;

  container.innerHTML = "";

  if (transactions.length === 0) {
    container.innerHTML =
      '<p class="no-transactions">No pending transactions</p>';
    return;
  }

  transactions.forEach((tx) => {
    const txElement = createTransactionElement(tx);
    container.appendChild(txElement);
  });
}

function createTransactionElement(tx: Transaction): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "transaction-item";

  // Add warning for large transactions
  const isLargeTransaction = parseFloat(formatEther(tx.value)) > 1.0;

  div.innerHTML = `
    <div class="transaction-details ${isLargeTransaction ? "warning" : ""}">
      <p><strong>Type:</strong> ${tx.type}</p>
      <p><strong>From:</strong> ${shortenAddress(tx.from)}</p>
      <p><strong>To:</strong> ${shortenAddress(tx.to)}</p>
      <p><strong>Amount:</strong> ${formatEther(tx.value)} ETH</p>
      ${
        isLargeTransaction
          ? '<p class="warning-text">⚠️ Large transaction amount!</p>'
          : ""
      }
      <div class="action-buttons">
        <button class="btn approve" onclick="approveTransaction(${
          tx.id
        })">Approve</button>
        <button class="btn reject" onclick="rejectTransaction(${
          tx.id
        })">Reject</button>
      </div>
    </div>
  `;
  return div;
}

function formatEther(wei: string): string {
  return (BigInt(wei) / BigInt(1e18)).toString();
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function approveTransaction(txId: number): void {
  chrome.runtime.sendMessage({
    type: "APPROVE_TRANSACTION",
    txId: txId,
  });
}

function rejectTransaction(txId: number): void {
  chrome.runtime.sendMessage({
    type: "REJECT_TRANSACTION",
    txId: txId,
  });
}
