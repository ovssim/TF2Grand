/* =========================================================
   OVFF'S SIM — CHAMPION MODE
   ========================================================= */

(() => {

"use strict";

/* =========================================================
   SETTINGS
   ========================================================= */

const CHAMPION_MAX_HP = 1000;

const CHAMPION_CRIT_CHANCE = 0.24;
const CHAMPION_CRIT_MULTIPLIER = 3;

const CHAMPION_MINI_CRIT_CHANCE = 0.16;
const CHAMPION_MINI_CRIT_MULTIPLIER = 2;

const CHAMPION_MISS_CHANCE = 0.15;

const BOT_MIN_MULTIPLIER = 0.70;
const BOT_MAX_MULTIPLIER = 3.00;

const CHAMPION_TURN_DELAY = 1200;

const MAX_BATTLE_LOG_ENTRIES = 5;


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
   STATE
   ========================================================= */

const Champion = {

    coinWager: 0,

    selectedItems: [],

    botItems: [],

    botCoins: 0,

    totalPlayerWager: 0,

    totalBotWager: 0,

    battleRunning: false,

    playerHP: CHAMPION_MAX_HP,

    botHP: CHAMPION_MAX_HP,

    turn: "player",

    round: 1,

    battleTimer: null

};


/*
   Make Champion available to other scripts/debugging.
*/

window.Champion = Champion;


/* =========================================================
   SAFE ACCESS TO MAIN SCRIPT
   ========================================================= */

/*
   These functions prevent Champion from crashing if
   script.js has not finished loading yet.
*/

function getInventory() {

    if (typeof inventory !== "undefined" &&
        Array.isArray(inventory)) {

        return inventory;

    }

    return [];

}


function getCases() {

    if (typeof cases !== "undefined" &&
        Array.isArray(cases)) {

        return cases;

    }

    return [];

}


function getCoins() {

    if (typeof coins !== "undefined" &&
        Number.isFinite(Number(coins))) {

        return Number(coins);

    }

    return 0;

}


/* =========================================================
   MAIN SCRIPT FUNCTIONS
   ========================================================= */

function safeUpdateCoins() {

    try {

        if (typeof updateCoins === "function") {
            updateCoins();
        }

    } catch (error) {

        console.warn(
            "Champion: updateCoins failed",
            error
        );

    }

}


function safeSaveInventory() {

    try {

        if (typeof saveInventory === "function") {
            saveInventory();
        }

    } catch (error) {

        console.warn(
            "Champion: saveInventory failed",
            error
        );

    }

}


function safeRenderInventory() {

    try {

        if (typeof renderInventory === "function") {
            renderInventory();
        }

    } catch (error) {

        console.warn(
            "Champion: renderInventory failed",
            error
        );

    }

}


function safePopulateCoinflip() {

    try {

        if (
            typeof populateCoinflipDropdown ===
            "function"
        ) {

            populateCoinflipDropdown();

        }

    } catch (error) {

        console.warn(
            "Champion: coinflip refresh failed",
            error
        );

    }

}


function safeUpdateBackpack() {

    try {

        if (
            typeof updateBackpackValue ===
            "function"
        ) {

            updateBackpackValue();

        }

    } catch (error) {

        console.warn(
            "Champion: backpack update failed",
            error
        );

    }

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function setupChampion() {

    console.log(
        "🏆 Champion Mode initializing..."
    );


    const startButton =
        document.getElementById(
            "champion-start-btn"
        );


    const addCoinButton =
        document.getElementById(
            "champion-add-coins"
        );


    const coinInput =
        document.getElementById(
            "champion-coin-input"
        );


    const closeButton =
        document.getElementById(
            "champion-close-result"
        );


    if (!startButton) {

        console.error(
            "Champion Mode: champion-start-btn was not found."
        );

        return;

    }


    if (coinInput) {

        coinInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    addChampionCoins();

                }

            }
        );

    }


    if (addCoinButton) {

        addCoinButton.onclick =
            addChampionCoins;

    }


    startButton.onclick =
        startChampionBattle;


    if (closeButton) {

        closeButton.onclick =
            resetChampion;

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

    updateChampionHP();


    /*
       Refresh after the rest of the site has had time
       to load its inventory/cases.
    */

    setTimeout(() => {

        renderChampionItemList();

        updateChampionWagerDisplay();

    }, 500);


    setTimeout(() => {

        renderChampionItemList();

        updateChampionWagerDisplay();

    }, 1500);


    console.log(
        "🏆 Champion Mode ready!"
    );

}


/* =========================================================
   WAIT FOR PAGE
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        setupChampion
    );

} else {

    setupChampion();

}


/* =========================================================
   GET CASE ITEM POOL
   ========================================================= */

function getChampionItemPool() {

    const pool = [];

    const allCases =
        getCases();


    allCases.forEach(gameCase => {

        if (
            !gameCase ||
            !Array.isArray(gameCase.items)
        ) {

            return;

        }


        gameCase.items.forEach(item => {

            if (!item) return;


            const price =
                Number(item.price);


            if (!Number.isFinite(price)) {

                return;

            }


            pool.push({

                name:
                    String(
                        item.name ||
                        "Unknown Item"
                    ),

                rarity:
                    item.rarity || "",

                price:
                    price,

                weight:
                    Number(item.weight) || 1,

                image:
                    item.image || ""

            });

        });

    });


    return pool;

}


/* =========================================================
   RENDER PLAYER ITEMS
   ========================================================= */

function renderChampionItemList() {

    const container =
        document.getElementById(
            "champion-item-list"
        );


    if (!container) return;


    container.innerHTML = "";


    const playerInventory =
        getInventory();


    if (
        playerInventory.length === 0
    ) {

        container.innerHTML = `
            <div class="champion-empty">
                Your backpack has no items.
            </div>
        `;

        return;

    }


    playerInventory.forEach(
        (item, index) => {

            if (!item) return;


            const selected =
                Champion.selectedItems
                    .includes(index);


            const div =
                document.createElement("div");


            div.className =
                "champion-wager-item" +
                (
                    selected
                        ? " selected"
                        : ""
                );


            const image =
                item.image ||
                "";


            div.innerHTML = `

                <img
                    src="${escapeChampionHTML(image)}"
                    alt=""
                    onerror="
                        this.style.display='none';
                    "
                >

                <div class="
                    champion-wager-item-info
                ">

                    <span>
                        ${escapeChampionHTML(
                            item.name ||
                            "Unknown Item"
                        )}
                    </span>

                    <small>
                        ${Number(
                            item.price || 0
                        ).toFixed(2)} ⛃
                    </small>

                </div>

                <div class="
                    champion-item-check
                ">

                    ${selected ? "✓" : "+"}

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
   TOGGLE ITEM
   ========================================================= */

function toggleChampionItem(index) {

    if (Champion.battleRunning) {
        return;
    }


    const playerInventory =
        getInventory();


    if (!playerInventory[index]) {
        return;
    }


    const position =
        Champion.selectedItems
            .indexOf(index);


    if (position >= 0) {

        Champion.selectedItems
            .splice(position, 1);

    } else {

        Champion.selectedItems
            .push(index);

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

}


/* =========================================================
   ADD COINS
   ========================================================= */

function addChampionCoins() {

    if (Champion.battleRunning) {
        return;
    }


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


    const playerCoins =
        getCoins();


    if (amount > playerCoins) {

        alert(
            `You only have ${playerCoins.toFixed(2)} coins.`
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
   PLAYER WAGER
   ========================================================= */

function calculatePlayerWager() {

    const playerInventory =
        getInventory();


    let total =
        Number(
            Champion.coinWager || 0
        );


    Champion.selectedItems.forEach(
        index => {

            const item =
                playerInventory[index];


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
   WAGER DISPLAY
   ========================================================= */

function updateChampionWagerDisplay() {

    const value =
        document.getElementById(
            "champion-wager-value"
        );


    const selectedBox =
        document.getElementById(
            "champion-selected-items"
        );


    const total =
        calculatePlayerWager();


    if (value) {

        value.textContent =
            `Wager: ${total.toFixed(2)} ⛃`;

    }


    if (!selectedBox) {
        return;
    }


    selectedBox.innerHTML = "";


    if (Champion.coinWager > 0) {

        const div =
            document.createElement("div");


        div.className =
            "champion-selected-entry";


        div.innerHTML = `

            <span>
                🪙
                ${Champion.coinWager.toFixed(2)}
                coins
            </span>

            <button
                type="button"
                class="champion-remove-wager">

                ✖

            </button>

        `;


        div.querySelector("button")
            .onclick = () => {

                Champion.coinWager = 0;

                updateChampionWagerDisplay();

            };


        selectedBox.appendChild(div);

    }


    const playerInventory =
        getInventory();


    Champion.selectedItems.forEach(
        index => {

            const item =
                playerInventory[index];


            if (!item) return;


            const div =
                document.createElement("div");


            div.className =
                "champion-selected-entry";


            div.innerHTML = `

                <img
                    src="${escapeChampionHTML(
                        item.image || ""
                    )}"
                    alt=""
                    onerror="
                        this.style.display='none';
                    "
                >

                <span>

                    ${escapeChampionHTML(
                        item.name ||
                        "Unknown Item"
                    )}

                    -
                    ${Number(
                        item.price || 0
                    ).toFixed(2)}
                    ⛃

                </span>

                <button
                    type="button"
                    class="champion-remove-wager">

                    ✖

                </button>

            `;


            div.querySelector("button")
                .onclick = () => {

                    const position =
                        Champion.selectedItems
                            .indexOf(index);


                    if (position >= 0) {

                        Champion.selectedItems
                            .splice(position, 1);

                    }


                    renderChampionItemList();

                    updateChampionWagerDisplay();

                };


            selectedBox.appendChild(div);

        }
    );


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
   CREATE BOT WAGER
   ========================================================= */

function createBotWager(playerWager) {

    const pool =
        getChampionItemPool();


    /*
       If there are no case items, FishBot simply
       matches the wager with coins.
    */

    if (pool.length === 0) {

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


    const multiplier =
        BOT_MIN_MULTIPLIER +
        Math.random() *
        (
            BOT_MAX_MULTIPLIER -
            BOT_MIN_MULTIPLIER
        );


    const desiredValue =
        playerWager * multiplier;


    const maxAllowed =
        playerWager *
        BOT_MAX_MULTIPLIER;


    /*
       Shuffle items.
    */

    const shuffled =
        [...pool].sort(
            () => Math.random() - 0.5
        );


    /*
       Build an item wager below target.
    */

    shuffled.sort(
        (a, b) =>
            Number(b.price) -
            Number(a.price)
    );


    const selected = [];

    let total = 0;


    for (const item of shuffled) {

        const price =
            Number(item.price);


        if (
            total + price <=
            desiredValue
        ) {

            selected.push({
                ...item
            });


            total += price;

        }


        if (
            total >=
            desiredValue
        ) {

            break;

        }

    }


    /*
       Coins fill the remaining amount.
    */

    let botCoins =
        Math.max(
            0,
            desiredValue - total
        );


    /*
       Never exceed 300%.
    */

    botCoins =
        Math.min(
            botCoins,
            maxAllowed - total
        );


    botCoins =
        Number(
            Math.max(
                0,
                botCoins
            ).toFixed(2)
        );


    total += botCoins;


    /*
       If rounding pushed us slightly over the maximum,
       fix it.
    */

    if (total > maxAllowed) {

        botCoins =
            Number(
                Math.max(
                    0,
                    maxAllowed -
                    (
                        total -
                        botCoins
                    )
                ).toFixed(2)
            );


        total =
            selected.reduce(
                (
                    sum,
                    item
                ) =>
                    sum +
                    Number(item.price),
                0
            ) +
            botCoins;

    }


    /*
       Guarantee that FishBot has something.
    */

    if (
        selected.length === 0 &&
        botCoins <= 0
    ) {

        const cheapest =
            [...pool].sort(
                (a, b) =>
                    Number(a.price) -
                    Number(b.price)
            )[0];


        selected.push({
            ...cheapest
        });


        total =
            Number(
                cheapest.price
            );


        /*
           If the cheapest item somehow exceeds
           the maximum, use coins instead.
        */

        if (
            total >
            maxAllowed
        ) {

            selected.length = 0;

            botCoins =
                Number(
                    playerWager.toFixed(2)
                );

            total =
                botCoins;

        }

    }


    return {

        coins:
            Number(
                botCoins.toFixed(2)
            ),

        items:
            selected,

        total:
            Number(
                total.toFixed(2)
            )

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


    if (botWager.coins > 0) {

        const div =
            document.createElement("div");


        div.className =
            "champion-bot-entry";


        div.textContent =
            `🪙 ${
                botWager.coins.toFixed(2)
            } coins`;


        items.appendChild(div);

    }


    botWager.items.forEach(item => {

        const div =
            document.createElement("div");


        div.className =
            "champion-bot-entry";


        div.innerHTML = `

            <img
                src="${escapeChampionHTML(
                    item.image || ""
                )}"
                alt=""
                onerror="
                    this.style.display='none';
                "
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

    });

}


/* =========================================================
   START BATTLE
   ========================================================= */

function startChampionBattle() {

    if (Champion.battleRunning) {
        return;
    }


    const playerInventory =
        getInventory();


    /*
       Remove invalid selected indexes.
    */

    Champion.selectedItems =
        Champion.selectedItems.filter(
            index =>
                Number.isInteger(index) &&
                playerInventory[index]
        );


    const playerWager =
        calculatePlayerWager();


    if (playerWager <= 0) {

        alert(
            "You must wager coins or at least one item."
        );

        return;

    }


    if (
        Champion.coinWager >
        getCoins()
    ) {

        alert(
            `You only have ${
                getCoins().toFixed(2)
            } coins.`
        );

        return;

    }


    /*
       Create FishBot's wager first.
    */

    const botWager =
        createBotWager(
            playerWager
        );


    if (
        !botWager ||
        botWager.total <= 0
    ) {

        alert(
            "FishBot couldn't create a wager."
        );

        return;

    }


    Champion.totalPlayerWager =
        playerWager;


    Champion.totalBotWager =
        botWager.total;


    Champion.botItems =
        botWager.items.map(
            item => ({
                ...item
            })
        );


    Champion.botCoins =
        botWager.coins;


    /*
       Remove coin wager.
    */

    if (Champion.coinWager > 0) {

        /*
           This works with the existing global
           'coins' variable from script.js.
        */

        if (
            typeof coins !==
            "undefined"
        ) {

            coins -=
                Champion.coinWager;

            safeUpdateCoins();

        }

    }


    /*
       Remove item wagers backwards.
    */

    const indexes =
        [...Champion.selectedItems]
            .sort(
                (a, b) =>
                    b - a
            );


    /*
       The inventory variable must exist in script.js.
    */

    if (
        typeof inventory !==
        "undefined" &&
        Array.isArray(inventory)
    ) {

        indexes.forEach(index => {

            if (
                index >= 0 &&
                index <
                inventory.length
            ) {

                inventory.splice(
                    index,
                    1
                );

            }

        });

    }


    safeSaveInventory();

    safeRenderInventory();

    safePopulateCoinflip();

    safeUpdateBackpack();


    Champion.selectedItems = [];

    Champion.coinWager = 0;


    renderChampionItemList();

    updateChampionWagerDisplay();


    displayBotWager(
        botWager
    );


    beginChampionBattle();

}


/* =========================================================
   BEGIN BATTLE
   ========================================================= */

function beginChampionBattle() {

    Champion.battleRunning =
        true;


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


    Champion.battleTimer =
        setTimeout(
            championTurn,
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


    championAttack(
        Champion.turn
    );

}


/* =========================================================
   ATTACK
   ========================================================= */

function championAttack(attacker) {

    if (!Champion.battleRunning) {
        return;
    }


    const weapon =
        CHAMPION_WEAPONS[
            Math.floor(
                Math.random() *
                CHAMPION_WEAPONS.length
            )
        ];


    const attackerName =
        attacker === "player"
            ? "🏆 Champion"
            : "🐟 FishBot";


    const targetName =
        attacker === "player"
            ? "FishBot"
            : "Champion";


    /*
       MISS
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


        addChampionLog(
            `${attackerName} uses ${
                escapeChampionHTML(weapon)
            }, but ${phrase}`
        );


        finishTurn(
            attacker
        );


        return;

    }


    /*
       DAMAGE
    */

    const baseDamage =
        randomInteger(
            1,
            333
        );


    let damage =
        baseDamage;


    let crit =
        false;


    let miniCrit =
        false;


    if (
        Math.random() <
        CHAMPION_CRIT_CHANCE
    ) {

        crit = true;

        damage =
            baseDamage *
            CHAMPION_CRIT_MULTIPLIER;

    }

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
       Apply damage.
    */

    if (attacker === "player") {

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


    updateChampionHP();


    /*
       Crit message.
    */

    if (crit) {

        addChampionLog(
            CHAMPION_CRIT_PHRASES[
                Math.floor(
                    Math.random() *
                    CHAMPION_CRIT_PHRASES.length
                )
            ]
        );

    }

    else if (miniCrit) {

        addChampionLog(
            CHAMPION_MINI_CRIT_PHRASES[
                Math.floor(
                    Math.random() *
                    CHAMPION_MINI_CRIT_PHRASES.length
                )
            ]
        );

    }


    const phrase =
        getChampionDamagePhrase(
            weapon
        );


    addChampionLog(
        `${attackerName} uses ${
            escapeChampionHTML(weapon)
        } and ${phrase}
        <strong>${damage}</strong>
        damage to ${targetName}.`
    );


    /*
       Death.
    */

    if (
        Champion.botHP <= 0 ||
        Champion.playerHP <= 0
    ) {

        Champion.battleTimer =
            setTimeout(
                finishChampionBattle,
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

function finishTurn(attacker) {

    if (!Champion.battleRunning) {
        return;
    }


    if (attacker === "player") {

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
            championTurn,
            CHAMPION_TURN_DELAY
        );

}


/* =========================================================
   STATUS
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
   HP
   ========================================================= */

function updateChampionHP() {

    const playerFill =
        document.getElementById(
            "champion-player-hp-fill"
        );


    const botFill =
        document.getElementById(
            "champion-bot-hp-fill"
        );


    const playerText =
        document.getElementById(
            "champion-player-hp-text"
        );


    const botText =
        document.getElementById(
            "champion-bot-hp-text"
        );


    const playerPercent =
        Math.max(
            0,
            Math.min(
                100,
                (
                    Champion.playerHP /
                    CHAMPION_MAX_HP
                ) * 100
            )
        );


    const botPercent =
        Math.max(
            0,
            Math.min(
                100,
                (
                    Champion.botHP /
                    CHAMPION_MAX_HP
                ) * 100
            )
        );


    if (playerFill) {

        playerFill.style.width =
            `${playerPercent}%`;

    }


    if (botFill) {

        botFill.style.width =
            `${botPercent}%`;

    }


    if (playerText) {

        playerText.textContent =
            `${Champion.playerHP} / ${
                CHAMPION_MAX_HP
            }`;

    }


    if (botText) {

        botText.textContent =
            `${Champion.botHP} / ${
                CHAMPION_MAX_HP
            }`;

    }

}


/* =========================================================
   LOG
   ========================================================= */

function clearChampionBattleLog() {

    const log =
        document.getElementById(
            "champion-battle-log"
        );


    if (!log) return;


    log.innerHTML = "";

}


function addChampionLog(message) {

    const log =
        document.getElementById(
            "champion-battle-log"
        );


    if (!log) return;


    const entry =
        document.createElement("div");


    entry.className =
        "champion-log-entry";


    entry.innerHTML =
        message;


    log.appendChild(
        entry
    );


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

    if (!Champion.battleRunning) {
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


    if (
        Champion.playerHP > 0
    ) {

        finishChampionWin();

    } else {

        finishChampionLoss();

    }

}


/* =========================================================
   WIN
   ========================================================= */

function finishChampionWin() {

    /*
       Give FishBot's coins.
    */

    if (
        Champion.botCoins > 0 &&
        typeof coins !==
        "undefined"
    ) {

        coins +=
            Champion.botCoins;

    }


    /*
       Give FishBot's items.
    */

    if (
        typeof inventory !==
        "undefined" &&
        Array.isArray(inventory)
    ) {

        Champion.botItems.forEach(
            item => {

                inventory.push({
                    ...item
                });

            }
        );

    }


    safeSaveInventory();

    safeUpdateCoins();

    safeRenderInventory();

    safePopulateCoinflip();

    safeUpdateBackpack();


    addChampionLog(
        "🏆 <strong>VICTORY!</strong>"
    );


    addChampionLog(
        `You defeated FishBot and won ${
            Champion.totalBotWager.toFixed(2)
        } ⛃!`
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


    const result =
        document.getElementById(
            "champion-result"
        );


    if (title) {

        title.textContent =
            "🏆 VICTORY!";

    }


    if (message) {

        message.textContent =
            "FishBot has been defeated!";

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
   LOSS
   ========================================================= */

function finishChampionLoss() {

    addChampionLog(
        "🔪 <strong>DEFEAT!</strong>"
    );


    addChampionLog(
        `FishBot won your ${
            Champion.totalPlayerWager.toFixed(2)
        } ⛃ wager.`
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


    const result =
        document.getElementById(
            "champion-result"
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

            <div class="
                champion-loss-winnings
            ">

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
   WINNINGS
   ========================================================= */

function buildWinningsHTML() {

    let html = "";


    if (Champion.botCoins > 0) {

        html += `

            <div class="
                champion-winning-entry
            ">

                🪙

                <strong>
                    ${
                        Champion.botCoins
                            .toFixed(2)
                    }
                    coins
                </strong>

            </div>

        `;

    }


    Champion.botItems.forEach(
        item => {

            html += `

                <div class="
                    champion-winning-entry
                ">

                    <img
                        src="${escapeChampionHTML(
                            item.image || ""
                        )}"
                        alt=""
                        onerror="
                            this.style.display='none';
                        "
                    >

                    <span>

                        ${escapeChampionHTML(
                            item.name
                        )}

                        <small>
                            ${
                                Number(
                                    item.price
                                ).toFixed(2)
                            } ⛃
                        </small>

                    </span>

                </div>

            `;

        }
    );


    if (!html) {

        html =
            "Nothing was won.";

    }


    return html;

}


/* =========================================================
   RESET
   ========================================================= */

function resetChampion() {

    if (
        Champion.battleTimer
    ) {

        clearTimeout(
            Champion.battleTimer
        );

    }


    Champion.coinWager =
        0;


    Champion.selectedItems =
        [];


    Champion.botItems =
        [];


    Champion.botCoins =
        0;


    Champion.totalPlayerWager =
        0;


    Champion.totalBotWager =
        0;


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


    renderChampionItemList();

    updateChampionWagerDisplay();

    updateChampionHP();

    updateChampionStatus();

}


/* =========================================================
   UTILITIES
   ========================================================= */

function randomInteger(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


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


    return phrases[
        Math.floor(
            Math.random() *
            phrases.length
        )
    ];

}


function escapeChampionHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


})();
