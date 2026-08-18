/* =========================================================
   CHAMPION MODE
   ========================================================= */

/*
    Champion Mode depends on these variables/functions
    from script.js:

    coins
    inventory
    cases
    saveInventory()
    updateCoins()
    renderInventory()
    populateCoinflipDropdown()
    updateBackpackValue()
*/


/* =========================================================
   SETTINGS
   ========================================================= */

const CHAMPION_MAX_HP = 1000;

const CHAMPION_CRIT_CHANCE = 0.16;
const CHAMPION_CRIT_MULTIPLIER = 3;

const CHAMPION_MISS_CHANCE = 0.15;

const CHAMPION_MINI_CRIT_CHANCE = 0.24;
const CHAMPION_MINI_CRIT_MULTIPLIER = 2;


/*
    FishBot wager range.
*/

const BOT_MIN_MULTIPLIER = 0.20;
const BOT_MAX_MULTIPLIER = 2.00;


/*
    Time between attacks.
*/

const CHAMPION_TURN_DELAY = 2200;


/*
    Number of battle log messages visible.
*/

const MAX_BATTLE_LOG_ENTRIES = 5;


/*
    Number of blocks in the HP bar.
*/

const CHAMPION_HP_BAR_LENGTH = 20;


/* =========================================================
   WEAPONS
   ========================================================= */

const CHAMPION_WEAPONS = [

    "Force-a-Nature",
    "Shortstop",
    "Minigun",
    "Shotgun",
    "Sniper Rifle",
    "Sentry",
    "Huntsman",
    "Syringe Gun",
    "Loose Cannon",
    "Frontier Justice",
    "Awper Hand",
    "Cow Mangler 5000",
    "Cleaner's Carbine",
    "Ambassador",
    "Lugermorph",
    "Panic Attack",
    "Iron Curtain",
    "Horseless Headless Horsemann's Headtaker",
    "Direct Hit",
    "✨Golden Frying Pan",
    "Holy Mackerel"

];


/* =========================================================
   DAMAGE PHRASES
   ========================================================= */

const CHAMPION_DAMAGE_PHRASES = {

    "Force-a-Nature": [
        "blasts the enemy for",
        "meatshots the enemy for"
    ],

    "Shortstop": [
        "rapid-fires pellets for",
        "chips away health with"
    ],

    "Minigun": [
        "shreds the enemy with",
        "bullets rain and deal"
    ],

    "Holy Mackerel": [
        "smacks the enemy for",
        "fish slaps dealing",
        "gives a wet whack for"
    ],

    "Shotgun": [
        "fires a blast for",
        "lands a direct shot for"
    ],

    "Sniper Rifle": [
        "takes aim and shoots for",
        "pierces the enemy for"
    ],

    "Sentry": [
        "auto-locks and fires for",
        "unleashes bullets for"
    ],

    "Huntsman": [
        "fires an arrow for",
        "pins the enemy for"
    ],

    "Syringe Gun": [
        "fills the enemy with needles for"
    ],

    "Loose Cannon": [
        "fires an exploding cannonball for"
    ],

    "Frontier Justice": [
        "fires a vengeful blast for"
    ],

    "Awper Hand": [
        "headshots for"
    ],

    "Cow Mangler 5000": [
        "fires an exploding ray for",
        "mangles the enemy for"
    ],

    "Cleaner's Carbine": [
        "sprays bullets for"
    ],

    "Ambassador": [
        "lands a flawless headshot for"
    ],

    "Lugermorph": [
        "fires a stylish shot for",
        "fires an accurate shot dealing"
    ],

    "Panic Attack": [
        "fires wildly for",
        "fires shot after shot dealing"
    ],

    "Iron Curtain": [
        "unleashes a wall of bullets for"
    ],

    "Horseless Headless Horsemann's Headtaker": [
        "decapitates the enemy for"
    ],

    "Direct Hit": [
        "lands a direct rocket hit for"
    ],

    "✨Golden Frying Pan": [
        "✨ OBLITERATES reality for"
    ]

};


/* =========================================================
   SPECIAL PHRASES
   ========================================================= */

const CHAMPION_CRIT_PHRASES = [

    "💥 DEVASTATING CRIT!!!",
    "💥 MASSIVE CRITICAL HIT!!!",
    "💥 CRITICAL HIT!!!"

];


const CHAMPION_MINI_CRIT_PHRASES = [

    "⚡ MINI-CRIT!",
    "⚡ MINI CRITICAL HIT!"

];


const CHAMPION_MISS_PHRASES = [

    "completely whiffs the shot!",
    "fires wildly and misses!",
    "forgot to reload!",
    "didn't know how to use their weapon!"

];


/* =========================================================
   CHAMPION STATE
   ========================================================= */

const Champion = {

    /*
        Current wager selections.
    */

    coinWager: 0,

    selectedItems: [],


    /*
        IMPORTANT:

        These store copies of the player's wager
        before the wager is removed from inventory.

        If the player wins, these are returned.
        If the player loses, they are NOT returned.
    */

    playerWageredItems: [],

    playerWageredCoins: 0,


    /*
        FishBot wager.
    */

    botItems: [],

    botCoins: 0,


    /*
        Total wager values.
    */

    totalPlayerWager: 0,

    totalBotWager: 0,


    /*
        Battle state.
    */

    battleRunning: false,

    playerHP: CHAMPION_MAX_HP,

    botHP: CHAMPION_MAX_HP,

    turn: "player",

    round: 1,

    battleTimer: null

};


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupChampion();

    }
);


/* =========================================================
   SETUP
   ========================================================= */

function setupChampion() {

    const coinInput =
        document.getElementById(
            "champion-coin-input"
        );


    const addCoinButton =
        document.getElementById(
            "champion-add-coins"
        );


    const startButton =
        document.getElementById(
            "champion-start-btn"
        );


    const closeResultButton =
        document.getElementById(
            "champion-close-result"
        );


    const refreshInventoryButton =
        document.getElementById(
            "champion-refresh-inventory"
        );


    /* -----------------------------------------
       COIN INPUT
       ----------------------------------------- */

    if (coinInput) {

        coinInput.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    addChampionCoins();

                }

            }
        );

    }


    /* -----------------------------------------
       ADD COINS
       ----------------------------------------- */

    if (addCoinButton) {

        addCoinButton.onclick =
            addChampionCoins;

    }


    /* -----------------------------------------
       START BATTLE
       ----------------------------------------- */

    if (startButton) {

        startButton.onclick =
            startChampionBattle;

    }


    /* -----------------------------------------
       CLOSE RESULT
       ----------------------------------------- */

    if (closeResultButton) {

        closeResultButton.onclick =
            resetChampion;

    }


    /* -----------------------------------------
       REFRESH INVENTORY
       ----------------------------------------- */

    if (refreshInventoryButton) {

        refreshInventoryButton.onclick =
            refreshChampionInventory;

    }


    /*
        Initial rendering.
    */

    renderChampionItemList();

    updateChampionWagerDisplay();

    updateChampionHP();

}


/* =========================================================
   GET CASE ITEM POOL
   ========================================================= */

function getChampionItemPool() {

    const pool = [];


    if (!Array.isArray(cases)) {

        return pool;

    }


    cases.forEach(
        (gameCase) => {

            if (
                !gameCase ||
                !Array.isArray(gameCase.items)
            ) {

                return;

            }


            gameCase.items.forEach(
                (item) => {

                    if (!item) return;


                    const price =
                        Number(item.price);


                    if (
                        !Number.isFinite(price) ||
                        price <= 0
                    ) {

                        return;

                    }


                    pool.push({

                        name:
                            item.name,

                        rarity:
                            item.rarity,

                        price:
                            price,

                        weight:
                            Number(item.weight) || 1,

                        image:
                            item.image

                    });

                }
            );

        }
    );


    return pool;

}


/* =========================================================
   RENDER PLAYER ITEM LIST
   ========================================================= */

function renderChampionItemList() {

    const container =
        document.getElementById(
            "champion-item-list"
        );


    if (!container) return;


    container.innerHTML = "";


    if (
        !Array.isArray(inventory) ||
        inventory.length === 0
    ) {

        container.innerHTML = `

            <div class="champion-empty">

                Your backpack has no items.

            </div>

        `;

        return;

    }


    inventory.forEach(
        (item, index) => {

            if (!item) return;


            const alreadySelected =
                Champion.selectedItems.includes(
                    index
                );


            const div =
                document.createElement("div");


            div.className =
                "champion-wager-item" +
                (
                    alreadySelected
                        ? " selected"
                        : ""
                );


            div.innerHTML = `

                <img
                    src="${escapeChampionAttribute(
                        item.image || ""
                    )}"
                    alt=""
                >

                <div
                    class="champion-wager-item-info">

                    <span>
                        ${escapeChampionHTML(
                            item.name
                        )}
                    </span>

                    <small>
                        ${Number(
                            item.price || 0
                        ).toFixed(2)} ⛃
                    </small>

                </div>

                <div
                    class="champion-item-check">

                    ${
                        alreadySelected
                            ? "✓"
                            : "+"
                    }

                </div>

            `;


            div.onclick = () => {

                toggleChampionItem(index);

            };


            container.appendChild(div);

        }
    );

}


/* =========================================================
   REFRESH INVENTORY
   ========================================================= */

function refreshChampionInventory() {

    /*
        Make sure selected indexes still exist.
    */

    if (Array.isArray(inventory)) {

        Champion.selectedItems =
            Champion.selectedItems.filter(
                (index) => {

                    return (
                        inventory[index] &&
                        Number(
                            inventory[index].price
                        ) >= 0
                    );

                }
            );

    } else {

        Champion.selectedItems = [];

    }


    /*
        Re-render Champion inventory.
    */

    renderChampionItemList();


    /*
        Update wager.
    */

    updateChampionWagerDisplay();


    /*
        Update main inventory.
    */

    if (
        typeof renderInventory ===
        "function"
    ) {

        renderInventory();

    }


    if (
        typeof populateCoinflipDropdown ===
        "function"
    ) {

        populateCoinflipDropdown();

    }


    if (
        typeof updateBackpackValue ===
        "function"
    ) {

        updateBackpackValue();

    }

}


/* =========================================================
   TOGGLE ITEM
   ========================================================= */

function toggleChampionItem(index) {

    if (Champion.battleRunning) return;


    if (
        !Array.isArray(inventory) ||
        !inventory[index]
    ) {

        return;

    }


    const position =
        Champion.selectedItems.indexOf(
            index
        );


    if (position >= 0) {

        Champion.selectedItems.splice(
            position,
            1
        );

    } else {

        Champion.selectedItems.push(
            index
        );

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

}


/* =========================================================
   ADD COINS
   ========================================================= */

function addChampionCoins() {

    if (Champion.battleRunning) return;


    const input =
        document.getElementById(
            "champion-coin-input"
        );


    if (!input) return;


    const amount =
        Number(input.value);


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "Enter a valid coin amount."
        );

        return;

    }


    if (amount > coins) {

        alert(
            `You only have ${
                Number(coins).toFixed(2)
            } coins.`
        );

        return;

    }


    Champion.coinWager =
        Number(
            amount.toFixed(2)
        );


    input.value = "";


    updateChampionWagerDisplay();

}


/* =========================================================
   CALCULATE PLAYER WAGER
   ========================================================= */

function calculatePlayerWager() {

    let total =
        Number(
            Champion.coinWager || 0
        );


    if (!Array.isArray(inventory)) {

        return total;

    }


    Champion.selectedItems.forEach(
        (index) => {

            const item =
                inventory[index];


            if (!item) return;


            total +=
                Number(item.price) || 0;

        }
    );


    return Number(
        total.toFixed(2)
    );

}


/* =========================================================
   UPDATE WAGER DISPLAY
   ========================================================= */

function updateChampionWagerDisplay() {

    const valueBox =
        document.getElementById(
            "champion-wager-value"
        );


    const selectedBox =
        document.getElementById(
            "champion-selected-items"
        );


    const total =
        calculatePlayerWager();


    if (valueBox) {

        valueBox.textContent =
            `Wager: ${total.toFixed(2)} ⛃`;

    }


    if (!selectedBox) return;


    selectedBox.innerHTML = "";


    /*
        Coin wager.
    */

    if (Champion.coinWager > 0) {

        const coinDiv =
            document.createElement("div");


        coinDiv.className =
            "champion-selected-entry";


        coinDiv.innerHTML = `

            🪙

            <span>
                ${Champion.coinWager.toFixed(2)}
                coins
            </span>

            <button
                type="button"
                class="champion-remove-wager">

                ✖

            </button>

        `;


        const button =
            coinDiv.querySelector(
                "button"
            );


        if (button) {

            button.onclick = () => {

                Champion.coinWager = 0;

                updateChampionWagerDisplay();

            };

        }


        selectedBox.appendChild(
            coinDiv
        );

    }


    /*
        Item wagers.
    */

    Champion.selectedItems.forEach(
        (index) => {

            const item =
                inventory[index];


            if (!item) return;


            const div =
                document.createElement("div");


            div.className =
                "champion-selected-entry";


            div.innerHTML = `

                <img
                    src="${escapeChampionAttribute(
                        item.image || ""
                    )}"
                    alt=""
                >

                <span>

                    ${escapeChampionHTML(
                        item.name
                    )}

                    -

                    ${Number(
                        item.price || 0
                    ).toFixed(2)} ⛃

                </span>

                <button
                    type="button"
                    class="champion-remove-wager">

                    ✖

                </button>

            `;


            const button =
                div.querySelector(
                    "button"
                );


            if (button) {

                button.onclick = () => {

                    const position =
                        Champion.selectedItems
                            .indexOf(index);


                    if (position >= 0) {

                        Champion.selectedItems
                            .splice(
                                position,
                                1
                            );

                    }


                    renderChampionItemList();

                    updateChampionWagerDisplay();

                };

            }


            selectedBox.appendChild(
                div
            );

        }
    );


    /*
        Nothing selected.
    */

    if (
        Champion.coinWager <= 0 &&
        Champion.selectedItems.length === 0
    ) {

        selectedBox.innerHTML = `

            <div class="champion-empty">

                No wager selected.

            </div>

        `;

    }

}


/* =========================================================
   CREATE FISHBOT WAGER
   ========================================================= */

function createBotWager(playerWager) {

    const pool =
        getChampionItemPool();


    /*
        If there are no case items,
        FishBot simply uses coins.
    */

    if (!pool.length) {

        return {

            coins:
                Number(
                    playerWager.toFixed(2)
                ),

            items: [],

            total:
                Number(
                    playerWager.toFixed(2)
                )

        };

    }


    /*
        Pick a target between the configured
        minimum and maximum multipliers.
    */

    const multiplier =
        BOT_MIN_MULTIPLIER +
        Math.random() *
        (
            BOT_MAX_MULTIPLIER -
            BOT_MIN_MULTIPLIER
        );


    const target =
        Number(
            (
                playerWager *
                multiplier
            ).toFixed(2)
        );


    const maxAllowed =
        Number(
            (
                playerWager *
                BOT_MAX_MULTIPLIER
            ).toFixed(2)
        );


    /*
        Remove invalid items.
    */

    const validItems =
        pool.filter(
            (item) => {

                return (
                    item &&
                    Number.isFinite(
                        Number(item.price)
                    ) &&
                    Number(item.price) > 0
                );

            }
        );


    /*
        Randomize.
    */

    validItems.sort(
        () => Math.random() - 0.5
    );


    /*
        We attempt multiple combinations
        to get close to the target.
    */

    let bestItems = [];

    let bestTotal = 0;


    for (
        let attempt = 0;
        attempt < 100;
        attempt++
    ) {

        const attemptPool =
            [...validItems].sort(
                () => Math.random() - 0.5
            );


        const attemptItems = [];

        let attemptTotal = 0;


        for (
            const item of attemptPool
        ) {

            const price =
                Number(item.price);


            if (
                attemptTotal + price <=
                target
            ) {

                if (
                    Math.random() < 0.70
                ) {

                    attemptItems.push({
                        ...item
                    });

                    attemptTotal += price;

                }

            }


            if (
                Math.abs(
                    target -
                    attemptTotal
                ) <= 0.01
            ) {

                break;

            }

        }


        if (
            Math.abs(
                target -
                attemptTotal
            )
            <
            Math.abs(
                target -
                bestTotal
            )
        ) {

            bestItems =
                attemptItems;

            bestTotal =
                attemptTotal;

        }

    }


    /*
        Try individual items to improve result.
    */

    for (
        const item of validItems
    ) {

        const price =
            Number(item.price);


        if (
            bestTotal + price >
            target
        ) {

            continue;

        }


        const newDifference =
            Math.abs(
                target -
                (
                    bestTotal +
                    price
                )
            );


        const oldDifference =
            Math.abs(
                target -
                bestTotal
            );


        if (
            newDifference <
            oldDifference
        ) {

            bestItems.push({
                ...item
            });

            bestTotal += price;

        }

    }


    /*
        Use bot coins to fill remaining amount.
    */

    let botCoins =
        Number(
            Math.max(
                0,
                target -
                bestTotal
            ).toFixed(2)
        );


    /*
        Safety limit.
    */

    if (
        bestTotal +
        botCoins >
        maxAllowed
    ) {

        botCoins =
            Number(
                Math.max(
                    0,
                    maxAllowed -
                    bestTotal
                ).toFixed(2)
            );

    }


    const total =
        Number(
            (
                bestTotal +
                botCoins
            ).toFixed(2)
        );


    return {

        coins:
            botCoins,

        items:
            bestItems,

        total:
            total

    };

}


/* =========================================================
   DISPLAY BOT WAGER
   ========================================================= */

function displayBotWager(botWager) {

    const preview =
        document.getElementById(
            "champion-bot-preview"
        );


    const value =
        document.getElementById(
            "champion-bot-value"
        );


    const items =
        document.getElementById(
            "champion-bot-items"
        );


    if (preview) {

        preview.style.display =
            "block";

    }


    if (value) {

        value.textContent =
            `Bot Wager: ${
                botWager.total.toFixed(2)
            } ⛃`;

    }


    if (!items) return;


    items.innerHTML = "";


    /*
        Bot coins.
    */

    if (botWager.coins > 0) {

        const div =
            document.createElement("div");


        div.className =
            "champion-bot-entry";


        div.innerHTML =
            `🪙 ${
                botWager.coins.toFixed(2)
            } coins`;


        items.appendChild(div);

    }


    /*
        Bot items.
    */

    botWager.items.forEach(
        (item) => {

            const div =
                document.createElement("div");


            div.className =
                "champion-bot-entry";


            div.innerHTML = `

                <img
                    src="${escapeChampionAttribute(
                        item.image || ""
                    )}"
                    alt=""
                >

                <span>

                    ${escapeChampionHTML(
                        item.name
                    )}

                </span>

                <small>

                    ${Number(
                        item.price
                    ).toFixed(2)} ⛃

                </small>

            `;


            items.appendChild(div);

        }
    );

}


/* =========================================================
   START CHAMPION BATTLE
   ========================================================= */

function startChampionBattle() {

    if (Champion.battleRunning) return;


    /*
        Clean invalid selected indexes.
    */

    Champion.selectedItems =
        Champion.selectedItems.filter(
            (index) => {

                return (
                    inventory[index] &&
                    Number(
                        inventory[index].price
                    ) >= 0
                );

            }
        );


    const playerWager =
        calculatePlayerWager();


    if (playerWager <= 0) {

        alert(
            "You must wager coins or at least one item."
        );

        return;

    }


    /*
        Make sure player owns enough coins.
    */

    if (
        Champion.coinWager >
        Number(coins)
    ) {

        alert(
            `You only have ${
                Number(coins).toFixed(2)
            } coins.`
        );

        return;

    }


    /*
        Create bot wager BEFORE removing
        player's items.
    */

    const botWager =
        createBotWager(
            playerWager
        );


    if (
        botWager.total <= 0
    ) {

        alert(
            "FishBot couldn't create a valid wager."
        );

        return;

    }


    /* =====================================================
       STORE BATTLE WAGER
       ===================================================== */

    Champion.totalPlayerWager =
        Number(
            playerWager.toFixed(2)
        );


    Champion.totalBotWager =
        Number(
            botWager.total.toFixed(2)
        );


    /*
        IMPORTANT:

        Save player's coin wager so it can be
        returned if the player wins.
    */

    Champion.playerWageredCoins =
        Number(
            Champion.coinWager || 0
        );


    /*
        IMPORTANT:

        Save copies of all player's wagered items
        before deleting them from inventory.

        These are used to return the items
        if the player wins.
    */

    Champion.playerWageredItems =
        Champion.selectedItems
            .map(
                (index) => {

                    const item =
                        inventory[index];

                    if (!item) {
                        return null;
                    }

                    return {
                        ...item
                    };

                }
            )
            .filter(
                (item) => item !== null
            );


    /*
        Save FishBot's wager.
    */

    Champion.botItems =
        botWager.items.map(
            (item) => ({
                ...item
            })
        );


    Champion.botCoins =
        Number(
            botWager.coins || 0
        );


    /* =====================================================
       REMOVE PLAYER'S COIN WAGER
       ===================================================== */

    if (
        Champion.coinWager > 0
    ) {

        coins -=
            Champion.coinWager;


        coins =
            Number(
                coins.toFixed(2)
            );


        updateCoins();

    }


    /* =====================================================
       REMOVE PLAYER'S ITEM WAGERS
       ===================================================== */

    /*
        Backwards order prevents index shifting.
    */

    const indexesToRemove =
        [
            ...Champion.selectedItems
        ]
        .sort(
            (a, b) => b - a
        );


    indexesToRemove.forEach(
        (index) => {

            if (
                index >= 0 &&
                index < inventory.length
            ) {

                inventory.splice(
                    index,
                    1
                );

            }

        }
    );


    /*
        Save inventory.
    */

    saveInventory();


    /*
        Update main site.
    */

    if (
        typeof renderInventory ===
        "function"
    ) {

        renderInventory();

    }


    if (
        typeof populateCoinflipDropdown ===
        "function"
    ) {

        populateCoinflipDropdown();

    }


    if (
        typeof updateBackpackValue ===
        "function"
    ) {

        updateBackpackValue();

    }


    /*
        Clear current wager selections.

        The actual wager is safely stored in:
        Champion.playerWageredItems
        Champion.playerWageredCoins
    */

    Champion.selectedItems = [];

    Champion.coinWager = 0;


    renderChampionItemList();

    updateChampionWagerDisplay();


    /*
        Show FishBot wager.
    */

    displayBotWager(
        botWager
    );


    /*
        Begin battle.
    */

    beginChampionBattle();

}


/* =========================================================
   BEGIN BATTLE
   ========================================================= */

function beginChampionBattle() {

    Champion.battleRunning = true;


    Champion.playerHP =
        CHAMPION_MAX_HP;


    Champion.botHP =
        CHAMPION_MAX_HP;


    Champion.turn =
        "player";


    Champion.round =
        1;


    const menu =
        document.getElementById(
            "champion-menu"
        );


    const battle =
        document.getElementById(
            "champion-battle"
        );


    const result =
        document.getElementById(
            "champion-result"
        );


    if (menu) {

        menu.style.display =
            "none";

    }


    if (battle) {

        battle.style.display =
            "block";

    }


    if (result) {

        result.style.display =
            "none";

    }


    clearChampionBattleLog();


    updateChampionHP();


    updateChampionStatus();


    addChampionLog(
        "⚔️ Champion Mode has begun!"
    );


    addChampionLog(
        `Your wager: ${
            Champion.totalPlayerWager.toFixed(2)
        } ⛃`
    );


    addChampionLog(
        `FishBot wager: ${
            Champion.totalBotWager.toFixed(2)
        } ⛃`
    );


    /*
        Start battle.
    */

    Champion.battleTimer =
        setTimeout(
            () => {

                championTurn();

            },
            900
        );

}


/* =========================================================
   BATTLE TURN
   ========================================================= */

function championTurn() {

    if (!Champion.battleRunning) {
        return;
    }


    if (
        Champion.playerHP <= 0 ||
        Champion.botHP <= 0
    ) {

        finishChampionBattle();

        return;

    }


    if (
        Champion.turn ===
        "player"
    ) {

        championAttack(
            "player"
        );

    } else {

        championAttack(
            "bot"
        );

    }

}


/* =========================================================
   ATTACK
   ========================================================= */

function championAttack(
    attacker
) {

    if (!Champion.battleRunning) {
        return;
    }


    /*
        Random weapon.
    */

    const weapon =
        CHAMPION_WEAPONS[
            Math.floor(
                Math.random() *
                CHAMPION_WEAPONS.length
            )
        ];


    /*
        MISS.
    */

    if (
        Math.random() <
        CHAMPION_MISS_CHANCE
    ) {

        const phrase =
            CHAMPION_MISS_PHRASES[
                Math.floor(
                    Math.random() *
                    CHAMPION_MISS_PHRASES.length
                )
            ];


        const attackerName =
            attacker === "player"
                ? "🏆 Champion"
                : "🐟 FishBot";


        addChampionLog(
            `${attackerName} uses ${weapon}, but ${phrase}`
        );


        finishTurn(
            attacker
        );


        return;

    }


    /*
        Base damage.
    */

    const baseDamage =
        randomInteger(
            1,
            333
        );


    let damage =
        baseDamage;


    let crit = false;

    let miniCrit = false;


    /*
        Critical hit.
    */

    if (
        Math.random() <
        CHAMPION_CRIT_CHANCE
    ) {

        crit = true;


        damage =
            baseDamage *
            CHAMPION_CRIT_MULTIPLIER;

    }


    /*
        Mini-crit.
    */

    else if (
        Math.random() <
        CHAMPION_MINI_CRIT_CHANCE
    ) {

        miniCrit = true;


        damage =
            baseDamage *
            CHAMPION_MINI_CRIT_MULTIPLIER;

    }


    damage =
        Math.floor(
            damage
        );


    /*
        Get phrase.
    */

    const phrase =
        getChampionDamagePhrase(
            weapon
        );


    /*
        Apply damage.
    */

    if (
        attacker === "player"
    ) {

        Champion.botHP =
            Math.max(
                0,
                Champion.botHP -
                damage
            );

    } else {

        Champion.playerHP =
            Math.max(
                0,
                Champion.playerHP -
                damage
            );

    }


    /*
        Update bars.
    */

    updateChampionHP();


    /*
        Crit message.
    */

    if (crit) {

        addChampionLog(
            `💥 ${
                attacker === "player"
                    ? "Champion"
                    : "FishBot"
            } — ${
                randomArrayItem(
                    CHAMPION_CRIT_PHRASES
                )
            }`
        );

    }


    /*
        Mini-crit message.
    */

    else if (miniCrit) {

        addChampionLog(
            `⚡ ${
                attacker === "player"
                    ? "Champion"
                    : "FishBot"
            } — ${
                randomArrayItem(
                    CHAMPION_MINI_CRIT_PHRASES
                )
            }`
        );

    }


    /*
        Normal attack message.
    */

    const attackerName =
        attacker === "player"
            ? "🏆 Champion"
            : "🐟 FishBot";


    const targetName =
        attacker === "player"
            ? "FishBot"
            : "Champion";


    addChampionLog(
        `${attackerName} uses ${weapon} and ${phrase} <strong>${damage}</strong> damage to ${targetName}.`
    );


    /*
        Check death.
    */

    if (
        Champion.botHP <= 0 ||
        Champion.playerHP <= 0
    ) {

        Champion.battleTimer =
            setTimeout(
                () => {

                    finishChampionBattle();

                },
                800
            );


        return;

    }


    finishTurn(
        attacker
    );

}


/* =========================================================
   FINISH TURN
   ========================================================= */

function finishTurn(
    attacker
) {

    if (
        !Champion.battleRunning
    ) {

        return;

    }


    if (
        attacker === "player"
    ) {

        Champion.turn =
            "bot";

    } else {

        Champion.turn =
            "player";


        Champion.round++;

    }


    updateChampionStatus();


    Champion.battleTimer =
        setTimeout(
            () => {

                championTurn();

            },
            CHAMPION_TURN_DELAY
        );

}


/* =========================================================
   UPDATE STATUS
   ========================================================= */

function updateChampionStatus() {

    const status =
        document.getElementById(
            "champion-battle-status"
        );


    if (!status) return;


    if (
        Champion.turn ===
        "player"
    ) {

        status.textContent =
            `🏆 Your turn — Round ${
                Champion.round
            }`;

    } else {

        status.textContent =
            `🐟 FishBot's turn — Round ${
                Champion.round
            }`;

    }

}


/* =========================================================
   UPDATE HP
   ========================================================= */

function updateChampionHP() {

    const playerBar =
        document.getElementById(
            "champion-player-hp-bar"
        );


    const botBar =
        document.getElementById(
            "champion-bot-hp-bar"
        );


    const playerText =
        document.getElementById(
            "champion-player-hp-text"
        );


    const botText =
        document.getElementById(
            "champion-bot-hp-text"
        );


    /*
        Clamp HP.
    */

    Champion.playerHP =
        Math.max(
            0,
            Math.min(
                CHAMPION_MAX_HP,
                Champion.playerHP
            )
        );


    Champion.botHP =
        Math.max(
            0,
            Math.min(
                CHAMPION_MAX_HP,
                Champion.botHP
            )
        );


    /*
        Calculate blocks.
    */

    const playerBlocks =
        Math.round(
            (
                Champion.playerHP /
                CHAMPION_MAX_HP
            ) *
            CHAMPION_HP_BAR_LENGTH
        );


    const botBlocks =
        Math.round(
            (
                Champion.botHP /
                CHAMPION_MAX_HP
            ) *
            CHAMPION_HP_BAR_LENGTH
        );


    /*
        Create █ / ░ bars.
    */

    const playerBarText =
        "█".repeat(
            playerBlocks
        ) +
        "░".repeat(
            CHAMPION_HP_BAR_LENGTH -
            playerBlocks
        );


    const botBarText =
        "█".repeat(
            botBlocks
        ) +
        "░".repeat(
            CHAMPION_HP_BAR_LENGTH -
            botBlocks
        );


    if (playerBar) {

        playerBar.textContent =
            playerBarText;

    }


    if (botBar) {

        botBar.textContent =
            botBarText;

    }


    /*
        Numerical HP.
    */

    if (playerText) {

        playerText.textContent =
            `${
                Champion.playerHP
            } / ${
                CHAMPION_MAX_HP
            }`;

    }


    if (botText) {

        botText.textContent =
            `${
                Champion.botHP
            } / ${
                CHAMPION_MAX_HP
            }`;

    }

}


/* =========================================================
   BATTLE LOG
   ========================================================= */

function clearChampionBattleLog() {

    const log =
        document.getElementById(
            "champion-battle-log"
        );


    if (!log) return;


    log.innerHTML = "";

}


/* =========================================================
   ADD LOG
   ========================================================= */

function addChampionLog(
    message
) {

    const log =
        document.getElementById(
            "champion-battle-log"
        );


    if (!log) return;


    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "champion-log-entry";


    entry.innerHTML =
        message;


    log.appendChild(
        entry
    );


    /*
        Keep only latest entries.
    */

    while (
        log.children.length >
        MAX_BATTLE_LOG_ENTRIES
    ) {

        log.removeChild(
            log.firstElementChild
        );

    }


    log.scrollTop =
        log.scrollHeight;

}


/* =========================================================
   FINISH BATTLE
   ========================================================= */

function finishChampionBattle() {

    if (
        !Champion.battleRunning
    ) {

        return;

    }


    Champion.battleRunning =
        false;


    if (
        Champion.battleTimer
    ) {

        clearTimeout(
            Champion.battleTimer
        );

        Champion.battleTimer =
            null;

    }


    /*
        Player wins only if FishBot is dead
        and the player is still alive.
    */

    if (
        Champion.playerHP > 0 &&
        Champion.botHP <= 0
    ) {

        finishChampionWin();

    }

    else {

        finishChampionLoss();

    }

}


/* =========================================================
   PLAYER WIN
   ========================================================= */

function finishChampionWin() {

    const result =
        document.getElementById(
            "champion-result"
        );


    const title =
        document.getElementById(
            "champion-result-title"
        );


    const message =
        document.getElementById(
            "champion-result-message"
        );


    const winnings =
        document.getElementById(
            "champion-result-winnings"
        );


    /* =====================================================
       RETURN PLAYER'S COINS
       ===================================================== */

    if (
        Champion.playerWageredCoins > 0
    ) {

        coins +=
            Champion.playerWageredCoins;

    }


    /* =====================================================
       RETURN PLAYER'S ITEMS
       ===================================================== */

    Champion.playerWageredItems.forEach(
        (item) => {

            if (!item) return;


            inventory.push({
                ...item
            });

        }
    );


    /* =====================================================
       GIVE FISHBOT'S COINS
       ===================================================== */

    if (
        Champion.botCoins > 0
    ) {

        coins +=
            Champion.botCoins;

    }


    /* =====================================================
       GIVE FISHBOT'S ITEMS
       ===================================================== */

    Champion.botItems.forEach(
        (item) => {

            if (!item) return;


            inventory.push({
                ...item
            });

        }
    );


    /*
        Round coins.
    */

    coins =
        Number(
            coins.toFixed(2)
        );


    /* =====================================================
       SAVE
       ===================================================== */

    saveInventory();


    updateCoins();


    /* =====================================================
       UPDATE MAIN SITE
       ===================================================== */

    if (
        typeof renderInventory ===
        "function"
    ) {

        renderInventory();

    }


    if (
        typeof populateCoinflipDropdown ===
        "function"
    ) {

        populateCoinflipDropdown();

    }


    if (
        typeof updateBackpackValue ===
        "function"
    ) {

        updateBackpackValue();

    }


    /* =====================================================
       BATTLE LOG
       ===================================================== */

    addChampionLog(
        "🏆 <strong>VICTORY!</strong>"
    );


    addChampionLog(
        `You defeated FishBot and won the entire pot of ${
            (
                Champion.totalPlayerWager +
                Champion.totalBotWager
            ).toFixed(2)
        } ⛃!`
    );


    /* =====================================================
       RESULT SCREEN
       ===================================================== */

    if (title) {

        title.textContent =
            "🏆 VICTORY!";

    }


    if (message) {

        message.textContent =
            "FishBot has been defeated! You won the entire pot!";

    }


    if (winnings) {

        winnings.innerHTML =
            buildWinningsHTML();

    }


    if (result) {

        result.style.display =
            "block";

    }

}


/* =========================================================
   PLAYER LOSS
   ========================================================= */

function finishChampionLoss() {

    const result =
        document.getElementById(
            "champion-result"
        );


    const title =
        document.getElementById(
            "champion-result-title"
        );


    const message =
        document.getElementById(
            "champion-result-message"
        );


    const winnings =
        document.getElementById(
            "champion-result-winnings"
        );


    /*
        IMPORTANT:

        The player's wager was already removed
        when the battle started.

        We deliberately DO NOT return:

        Champion.playerWageredCoins
        Champion.playerWageredItems

        because the player lost.
    */

    addChampionLog(
        "🔪 <strong>DEFEAT!</strong>"
    );


    addChampionLog(
        `FishBot won your ${
            Champion.totalPlayerWager.toFixed(2)
        } ⛃ wager.`
    );


    if (title) {

        title.textContent =
            "🔪 DEFEAT";

    }


    if (message) {

        message.textContent =
            "FishBot secured the victory.";

    }


    if (winnings) {

        winnings.innerHTML = `

            <div
                class="champion-loss-winnings">

                You lost:

                <strong>

                    ${
                        Champion.totalPlayerWager
                            .toFixed(2)
                    } ⛃

                </strong>

            </div>

        `;

    }


    if (result) {

        result.style.display =
            "block";

    }

}


/* =========================================================
   WINNINGS HTML
   ========================================================= */

function buildWinningsHTML() {

    let html = "";


    /* =====================================================
       PLAYER'S RETURNED COINS
       ===================================================== */

    if (
        Champion.playerWageredCoins > 0
    ) {

        html += `

            <div
                class="champion-winning-entry">

                🔄

                <strong>

                    ${
                        Champion.playerWageredCoins
                            .toFixed(2)
                    }

                    coins returned

                </strong>

            </div>

        `;

    }


    /* =====================================================
       PLAYER'S RETURNED ITEMS
       ===================================================== */

    Champion.playerWageredItems.forEach(
        (item) => {

            if (!item) return;


            html += `

                <div
                    class="champion-winning-entry">

                    🔄

                    <img
                        src="${escapeChampionAttribute(
                            item.image || ""
                        )}"
                        alt=""
                    >

                    <span>

                        ${escapeChampionHTML(
                            item.name
                        )}

                        <small>

                            ${
                                Number(
                                    item.price || 0
                                ).toFixed(2)
                            } ⛃

                            returned

                        </small>

                    </span>

                </div>

            `;

        }
    );


    /* =====================================================
       FISHBOT'S COINS
       ===================================================== */

    if (
        Champion.botCoins > 0
    ) {

        html += `

            <div
                class="champion-winning-entry">

                🪙

                <strong>

                    ${
                        Champion.botCoins
                            .toFixed(2)
                    }

                    FishBot coins

                </strong>

            </div>

        `;

    }


    /* =====================================================
       FISHBOT'S ITEMS
       ===================================================== */

    Champion.botItems.forEach(
        (item) => {

            if (!item) return;


            html += `

                <div
                    class="champion-winning-entry">

                    🏆

                    <img
                        src="${escapeChampionAttribute(
                            item.image || ""
                        )}"
                        alt=""
                    >

                    <span>

                        ${escapeChampionHTML(
                            item.name
                        )}

                        <small>

                            ${
                                Number(
                                    item.price || 0
                                ).toFixed(2)
                            } ⛃

                        </small>

                    </span>

                </div>

            `;

        }
    );


    /* =====================================================
       NOTHING
       ===================================================== */

    if (!html) {

        html =
            "Nothing was won.";

    }


    return html;

}


/* =========================================================
   RESET CHAMPION
   ========================================================= */

function resetChampion() {

    if (
        Champion.battleTimer
    ) {

        clearTimeout(
            Champion.battleTimer
        );

    }


    /*
        Reset wagers.
    */

    Champion.coinWager = 0;

    Champion.selectedItems = [];


    /*
        Clear saved player's wager.

        At this point the battle is over,
        so the returned items/coins have
        already been added if the player won.
    */

    Champion.playerWageredItems = [];

    Champion.playerWageredCoins = 0;


    /*
        Clear FishBot wager.
    */

    Champion.botItems = [];

    Champion.botCoins = 0;


    /*
        Clear totals.
    */

    Champion.totalPlayerWager = 0;

    Champion.totalBotWager = 0;


    /*
        Reset battle.
    */

    Champion.playerHP =
        CHAMPION_MAX_HP;

    Champion.botHP =
        CHAMPION_MAX_HP;

    Champion.turn =
        "player";

    Champion.round =
        1;

    Champion.battleRunning =
        false;

    Champion.battleTimer =
        null;


    /*
        DOM.
    */

    const menu =
        document.getElementById(
            "champion-menu"
        );


    const battle =
        document.getElementById(
            "champion-battle"
        );


    const result =
        document.getElementById(
            "champion-result"
        );


    const botPreview =
        document.getElementById(
            "champion-bot-preview"
        );


    if (menu) {

        menu.style.display =
            "block";

    }


    if (battle) {

        battle.style.display =
            "none";

    }


    if (result) {

        result.style.display =
            "none";

    }


    if (botPreview) {

        botPreview.style.display =
            "none";

    }


    /*
        Refresh Champion UI.
    */

    renderChampionItemList();

    updateChampionWagerDisplay();

    updateChampionHP();

    updateChampionStatus();

}


/* =========================================================
   RANDOM INTEGER
   ========================================================= */

function randomInteger(
    min,
    max
) {

    return Math.floor(
        Math.random() *
        (
            max -
            min +
            1
        )
    ) + min;

}


/* =========================================================
   RANDOM ARRAY ITEM
   ========================================================= */

function randomArrayItem(
    array
) {

    if (
        !Array.isArray(array) ||
        array.length === 0
    ) {

        return "";

    }


    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];

}


/* =========================================================
   DAMAGE PHRASE
   ========================================================= */

function getChampionDamagePhrase(
    weapon
) {

    const phrases =
        CHAMPION_DAMAGE_PHRASES[
            weapon
        ];


    if (
        !phrases ||
        phrases.length === 0
    ) {

        return "hits the enemy for";

    }


    return randomArrayItem(
        phrases
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeChampionHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =========================================================
   ESCAPE HTML ATTRIBUTE
   ========================================================= */

function escapeChampionAttribute(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}
