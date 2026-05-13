# Security Specification for SIA-ZISWAF

## 1. Data Invariants
- All transactions must be balanced (Total Debit == Total Credit). This is enforced by client logic and can be audited.
- Journal entries must refer to existing account codes.
- Users can only read information if they are signed in.
- Accounts are system-defined (Admin only to create/edit, though for this demo we'll allow initialization).
- Budget limits should be respected (warn on client, though rules could technically check but it's expensive).

## 2. The "Dirty Dozen" Payloads (Examples)
1. Creating an account with a 1MB name string (Resource Poisoning).
2. Updating an account code to arbitrary text (ID Poisoning).
3. Deleting a transaction header but leaving orphaned journal entries (Orphaned Writes).
4. Creating a transaction with negative debit amounts (Logic Bypass).
5. Setting `createdBy` to another user's UID (Identity Spoofing).
6. Changing `date` of a locked period transaction (Temporal Integrity).
7. Excessively large number of journal entries in one transaction (Denial of Wallet).
8. Reading all users' transactions without being an admin (PII Leak).
9. Updating a budget to zero while expenses are active (Budget Gap).
10. Injecting system-only fields in a transaction payload.
11. Reading PII of other amils.
12. Bulk deleting the CoA.

## 3. The Test Runner Plan
I will implement `firestore.rules` that deny these and verify with tests.
Since I cannot run a full test environment easily right now, I will focus on writing bulletproof rules.
