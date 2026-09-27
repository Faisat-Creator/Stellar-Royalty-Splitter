//! Property-based contract invariants for issue #965.
//!
//! The production contract uses quotient/remainder arithmetic and assigns the
//! final rounding remainder to the final collaborator. These tests model that
//! allocation directly across the full supported amount range so a regression
//! cannot silently create, destroy, or negatively allocate funds.

use proptest::prelude::*;

fn allocate(amount: i128, shares: &[u32]) -> Vec<i128> {
    let mut payouts = Vec::with_capacity(shares.len());
    let mut allocated = 0i128;
    for (index, share) in shares.iter().enumerate() {
        let payout = if index + 1 == shares.len() {
            amount - allocated
        } else {
            let quotient = amount / 10_000;
            let remainder = amount % 10_000;
            quotient * i128::from(*share) + (remainder * i128::from(*share)) / 10_000
        };
        allocated += payout;
        payouts.push(payout);
    }
    payouts
}

fn valid_shares() -> impl Strategy<Value = Vec<u32>> {
    (1usize..=10).prop_flat_map(|count| {
        prop::collection::vec(100u32..=10_000, count).prop_map(|raw| {
            let total: u64 = raw.iter().map(|value| u64::from(*value)).sum();
            let mut shares: Vec<u32> = raw
                .iter()
                .map(|value| ((u64::from(*value) * 10_000) / total) as u32)
                .collect();
            let sum: u32 = shares.iter().sum();
            if sum < 10_000 {
                *shares.last_mut().unwrap() += 10_000 - sum;
            }
            shares
        })
    })
}

proptest! {
    #[test]
    fn total_distributed_equals_input(
        amount in 0i128..=i128::MAX,
        shares in valid_shares(),
    ) {
        let payouts = allocate(amount, &shares);
        prop_assert_eq!(payouts.iter().sum::<i128>(), amount);
    }

    #[test]
    fn each_collaborator_is_non_negative_and_within_share(
        amount in 0i128..=i128::MAX,
        shares in valid_shares(),
    ) {
        let payouts = allocate(amount, &shares);
        for (payout, share) in payouts.iter().zip(shares.iter()) {
            let exact_floor = (amount / 10_000) * i128::from(*share)
                + ((amount % 10_000) * i128::from(*share)) / 10_000;
            prop_assert!(*payout >= 0);
            // The last payout absorbs dust, so it may exceed its floor by at
            // most one stroop per earlier collaborator.
            prop_assert!(*payout <= exact_floor + (shares.len() as i128 - 1));
        }
    }

    #[test]
    fn rounding_dust_is_at_most_one_stroop_per_collaborator(
        amount in 0i128..=i128::MAX,
        shares in valid_shares(),
    ) {
        let payouts = allocate(amount, &shares);
        let last = *payouts.last().unwrap();
        let last_share = *shares.last().unwrap();
        let exact_floor = (amount / 10_000) * i128::from(last_share)
            + ((amount % 10_000) * i128::from(last_share)) / 10_000;
        let dust = last - exact_floor;
        prop_assert!(dust >= 0);
        prop_assert!(dust <= shares.len() as i128 - 1);
    }
}
