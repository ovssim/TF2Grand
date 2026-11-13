# TF2GRAND — Scarlet & Black Full Expansion

A browser-local TF2-style **virtual currency only** case-and-game simulator. This update merges the redesigned case opener/Champion UI with new tabbed games, Blackjack, an XP reward pathway, and Case Battles.

## Installation

Replace these existing files at the **root** of your website:

- `index.html`
- `style.css`
- `script.js`
- `champion.js`

Add these **new** files at the root beside `index.html`:

- `blackjack-rewards.js`
- `casebattle.js`

**Do not replace or delete** your existing `data/cases.json`, `images/items/`, or `images/cases/`. All custom case definitions, drop weights, image file names, and values are read from your existing case library.

For GitHub Pages, upload the six files to your repository using their original names. Hard-refresh your browser after deploying. Serve the site using GitHub Pages or an HTTP development server (the case JSON `fetch()` will not work reliably from a local `file://` URL).

## What's included

- **Design**: brighter scarlet-and-black interface, CSS poker-chip logo, more consistent item rarity-colored borders, mobile-friendly navigation and game tabs.
- **Case opening**: searchable/sortable cases, weights-based rolls, speed-varying reel with the **predetermined winning item** aligned to the middle.
- **Coinflip**: 3-D animated flipping coin, visible item stakes, multiple item selection, random aquatic rival names, win prize of 75–125% of wager value using catalog items plus virtual coin remainder.
- **Upgrader**: animated moving pointer with variable speed, draggable/keyboard-adjustable win-zone position around the circle, chance-based arc size, and independently randomized landing angle. Moving the win zone does not improve the odds.
- **Champion**: circular HP rings, wager item galleries, combat logs, value readouts, and randomized aquatic rivals.
- **Blackjack**: four-deck shoe, hit/stand, dealer stands on soft 17; wager coins, favorite-protected inventory items or both. Blackjack pays 3:2 in *coin profit* on natural blackjack, other wins pay 1:1, push refunds, losses forfeit. Winning item wagers return with bonus catalog items/coins valued at approximately 75–125% of the item stake.
- **Rewards**: spend-based XP, exponential XP requirements (8.5% more per level), virtual coin bonuses every five levels, progressively higher-cost case opening rewards every 20 levels. Rewards use your own existing case library, not fabricated cases. Reward track saved in localStorage and included in the save backup.
- **Case Battles**: build an ordered list of different cases with repeats; 1–5 bots in Regular; You + 1 vs 2, or You + 2 vs 3 in Teams. Independent weighted rolls for each participant, moving individual reels, round-by-round item and total values, and end-of-battle payout.
- **Save**: old `coins`, `inventory`, `recentDrops`, `pures` keys preserved, with additional game-specific keys for XP and pending-game recovery. Backup/export and restore available at the top.

## Case Battle rules

1. The **entry cost** is the sum of selected case prices **once per round**. Only you pay an entry fee. Bots do not own wallets.
2. Each participant **independently** rolls one item using the exact case weights. Every participant opens the same selected case each round. One case can appear more than once in the lineup.
3. In **Regular**, the player or bot with the highest cumulative unboxed value wins. If *you* win, you receive the **full combined value** of all players' drops as virtual coins. Otherwise you receive no payout and lose the entry fee.
4. In **Teams**, the team with the higher total wins. If your team wins, you receive the combined drop pool value as virtual coins. This is a local simulation: bots' winnings are not stored as real wallets.
5. **Shared** changes payouts. Regular Shared: the combined pool is split evenly among **all** participants, even if you were not the highest roller. Team Shared: the winning team splits the entire pool equally among its members; if your team loses, you receive nothing.
6. **Cursed** reverses the win condition: the **lowest** individual or team total wins. Cursed can be combined with Shared.
7. Equal winning totals use a random tie-break. Fractional cents from shared splits are **rounded down**.
8. Unboxed items are shown on each reel and in round history; prizes are paid in **virtual coin value**, not as inventory items.
9. Case Battles are browser-local. **Refreshing mid-match cancels the unfinished battle** and attempts to refund the entry fee from a pending-round receipt. Completed matches settle coin payouts only once. Avoid using multiple tabs with the same local save simultaneously.
10. The UI supports up to **600 cases in one match**, with 1–100 copies per *Add* click; very long battles can take a while. A Fast Animations option reduces time between rounds.

## Testing / limitations

All six JavaScript files were syntax-checked, and payout functions for Regular/Teams, Shared/Cursed, tie logic, repeat cases, and interruption recovery were checked with a Node.js test harness. HTML had no duplicated IDs and the CSS parsed without top-level errors. **Full browser visual testing was not possible in the build environment**, so minor layout or browser-specific differences may remain.

This is a free-play simulator with **no real cash or genuine TF2 items**. Outcomes use browser `Math.random()`, **not** a cryptographically secure or independently verifiable system. Your `data/cases.json` defines custom probabilities; these are not Valve odds.
