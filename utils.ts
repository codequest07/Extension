export function formatEther(wei: string): string {
  return (BigInt(wei) / BigInt(1e18)).toString();
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
