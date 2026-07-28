# Security Specification for Duowindo Firestore Setup

## 1. Data Invariants
- A user can only access (read/write) their own user profile document.
- Profiles are stored under `/users/{userId}` where `{userId}` must strictly match the authenticated user's UID (`request.auth.uid`).
- Fields like `createdAt` are immutable after profile creation.
- Fields `name`, `language`, and `country` must be bounded strings.
- Values for `streak`, `xp`, `gems`, `energy`, and `hearts` must be non-negative integers.
- All write operations must be performed by users whose emails are verified (or standard authenticated state if anonymous matches). Since we are configuring Google Auth, standard emails are verified.

## 2. The "Dirty Dozen" Attack Payloads
Below are 12 specific payloads attempting to break security rules:

1. **Identity Spoofing (Create)**: Creating a profile for user `victim_uid` when authenticated as `attacker_uid`.
2. **Identity Spoofing (Update)**: Updating another user's profile `victim_uid` as `attacker_uid`.
3. **Ghost Field Injection**: Creating/Updating a profile with arbitrary unmodeled fields like `isAdmin: true` or `untrackedTokenCount: 999999`.
4. **Invalid Type for XP**: Setting `xp` as a string (`"nine-thousand"`) instead of an integer.
5. **Negative Values Abuse**: Setting `energy` or `hearts` to `-10`.
6. **Immortal Field Poisoning**: Modifying the immutable `createdAt` field on update.
7. **Client-side Timestamp Tampering**: Supplying a backdated or future-dated `updatedAt` from the client rather than the server's `request.time`.
8. **Malicious ID (ID Poisoning)**: Attempting to target or inject a document with an ID exceeding size limits or filled with binary characters.
9. **Blanket Query Access**: An authenticated attacker attempting to read all users without specifying their own UID filter.
10. **Admin Privilege Escalation**: Setting `role: "admin"` in the user's profile.
11. **Subscription Bypass**: Changing subscription tier from `free` to `max` without a valid upgrade action.
12. **Streak Manipulation**: Setting the streak to an absurdly high number (e.g. `999999`) in a single step.

## 3. The Rules Architecture
To counter these attacks, the security rules in `firestore.rules` will implement:
- Standalone `isValidUserProfile` helper function.
- Strong owner check: `userId == request.auth.uid`.
- Immortality verification for `createdAt`.
- Standard temporal validation for `createdAt` and `updatedAt` via `request.time`.
