# 09: Voiding

**What to build:** Add void functionality to expense and deposit detail views. On the History page's expanded expense view, a "Void expense" button. On the Deposits page, a "Void" button on each deposit row. On the Member detail page, void buttons on deposits and expense items where applicable. Clicking void calls the API void endpoint, shows a confirmation, refreshes the data on success, and handles errors. Already-voided records show the button as disabled or hidden.

**Blocked by:** 06-deposits, 07-history, 08-member-detail

**Status:** ready-for-agent

- [ ] "Void" button on expanded expenses in History page
- [ ] "Void" button on deposits in Deposits page
- [ ] "Void" buttons on Member detail page deposits
- [ ] Confirmation before voiding
- [ ] API call to void endpoint on confirm
- [ ] Data refreshes after successful void
- [ ] Already-voided records: button disabled/hidden
- [ ] Error handling if void fails
- [ ] `npm run build` passes
