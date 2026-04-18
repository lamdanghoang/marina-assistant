module marina_capsule::seal_timelock;

use sui::bcs::{Self, BCS};
use sui::clock::Clock;

const ENoAccess: u64 = 77;

entry fun seal_approve(id: vector<u8>, c: &Clock) {
    let mut prepared: BCS = bcs::new(id);
    let t = prepared.peel_u64();
    let leftovers = prepared.into_remainder_bytes();
    assert!((leftovers.length() > 0) && (c.timestamp_ms() >= t), ENoAccess);
}
