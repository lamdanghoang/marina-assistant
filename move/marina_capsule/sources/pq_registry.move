/// Post-Quantum key registry — users publish ML-KEM public keys on-chain
/// Exists on-chain = active. Revoke = destroy.
module marina_capsule::pq_registry;

public struct PQKey has key, store {
    id: UID,
    owner: address,
    public_key: vector<u8>,
    algorithm: u8,
}

public fun register_key(public_key: vector<u8>, ctx: &mut TxContext) {
    transfer::transfer(PQKey {
        id: object::new(ctx),
        owner: ctx.sender(),
        public_key,
        algorithm: 1,
    }, ctx.sender());
}

public fun revoke_key(key: PQKey) {
    let PQKey { id, owner: _, public_key: _, algorithm: _ } = key;
    object::delete(id);
}

public fun get_public_key(key: &PQKey): &vector<u8> { &key.public_key }
public fun get_owner(key: &PQKey): address { key.owner }
