// Sample data for development
export const CAPSULES = [
  { id: '1', recipient: 'For Sarah J.', status: 'locked' as const, remainingTime: '08:14:22', createdDate: 'Oct 24, 2023', protocol: 'WALRUS-v2' },
  { id: '2', recipient: 'Project Genesis', status: 'unlocked' as const, createdDate: 'Jan 12, 2024', protocol: 'WALRUS-v1', preview: '"The foundation is laid. Proceed with the secondary phase..."' },
  { id: '3', recipient: 'Future Self', status: 'locked' as const, remainingTime: '142 Days', createdDate: 'Nov 05, 2023', protocol: 'WALRUS-v2' },
  { id: '4', recipient: 'Elena Thorne', status: 'locked' as const, remainingTime: '142 Days', createdDate: 'Dec 12, 2023', protocol: 'WALRUS-v2' },
];

export const TRANSACTIONS = [
  { id: '1', type: 'sent' as const, title: 'Sent to Exchange', date: 'Feb 14, 2024 • 14:22', amount: '-250.00 SUI', status: 'confirmed' as const },
  { id: '2', type: 'received' as const, title: 'Received Staking Reward', date: 'Feb 13, 2024 • 09:10', amount: '+1.42 SUI', status: 'success' as const },
  { id: '3', type: 'swap' as const, title: 'Swap SUI to WAL', date: 'Feb 12, 2024 • 21:45', amount: '1,000.0 WAL', status: 'success' as const },
  { id: '4', type: 'sent' as const, title: 'Payment for Services', date: 'Feb 11, 2024 • 18:30', amount: '-50.00 SUI', status: 'confirmed' as const },
  { id: '5', type: 'received' as const, title: 'Airdrop: Luna Alpha', date: 'Feb 10, 2024 • 12:00', amount: '+500.0 WAL', status: 'success' as const },
];

export const CONTACTS = [
  { id: '1', name: 'Luna Dev Node', address: '0x2a...f9e1' },
  { id: '2', name: 'Vault Alpha', address: '0x4b...92d1' },
  { id: '3', name: 'Neo Shard', address: '0x9d...1a4e' },
  { id: '4', name: 'Sui Foundation', address: '0x12...a3f2' },
  { id: '5', name: 'Echo Core', address: '0xfe...8c3d' },
];
