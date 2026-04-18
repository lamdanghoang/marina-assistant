/// Seal time-lock + ownership for Luna Time Capsule
/// Combines TLE (time check) + private_data (ownership) patterns.
///
/// Key format: [pkg id][bcs(unlock_time_ms) ++ nonce]
/// - Only Capsule owner can decrypt (Sui MoveVM enforces owned object access)
/// - Only after unlock_time (clock check)
/// - Nonce links encryption to specific capsule
module marina_capsule::seal_timelock;

use sui::bcs::{Self, BCS};
use sui::clock::Clock;
use marina_capsule::capsule::Capsule;

const ENoAccess: u64 = 77;

fun check_policy(id: vector<u8>, c: &Clock, capsule: &Capsule): bool {
    let mut prepared: BCS = bcs::new(id);
    let t = prepared.peel_u64();
    let nonce = prepared.into_remainder_bytes();
    // Time passed + nonce matches capsule's stored nonce
    (c.timestamp_ms() >= t) && (&nonce == capsule.get_nonce())
}

/// Only Capsule owner can pass owned Capsule object (enforced by Sui).
entry fun seal_approve(id: vector<u8>, c: &Clock, capsule: &Capsule) {
    assert!(check_policy(id, c, capsule), ENoAccess);
}
