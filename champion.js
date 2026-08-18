/* =========================================================
   CHAMPION MODE
   ========================================================= */

const CHAMPION_MAX_HP = 1000;

const CHAMPION_CRIT_CHANCE = 0.24;
const CHAMPION_CRIT_MULTIPLIER = 3;

const CHAMPION_MISS_CHANCE = 0.15;

const CHAMPION_MINI_CRIT_CHANCE = 0.16;
const CHAMPION_MINI_CRIT_MULTIPLIER = 2;

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


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupChampion();

});


function setupChampion() {

    const coinInput =
        document.getElementById("champion-coin-input");

    const addCoinButton =
        document.getElementById("champion-add-coins");

    const startButton =
        document.getElementById("champion-start-btn");

    const closeResultButton =
        document.getElementById("champion-close-result");


    if (coinInput) {

        coinInput.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                addChampionCoins();

            }

        });

    }


    if (addCoinButton) {

        addCoinButton.addEventListener(
            "click",
            addChampionCoins
        );

    }


    if (startButton) {

        startButton.addEventListener(
            "click",
            startChampionBattle
        );

    }


    if (closeResultButton) {

        closeResultButton.addEventListener(
            "click",
            resetChampion
        );

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

}


/* =========================================================
   ITEM POOL
   ========================================================= */

function getChampionItemPool() {

    const pool = [];

    if (!Array.isArray(cases)) {

        console.error(
            "Champion Mode: cases is not loaded."
        );

        return pool;

    }


    cases.forEach(gameCase => {

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


            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return;
            }


            pool.push({

                name: item.name,

                rarity: item.rarity,

                price: price,

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
   PLAYER INVENTORY
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


    inventory.forEach((item, index) => {

        if (!item) return;


        const selected =
            Champion.selectedItems.includes(index);


        const div =
            document.createElement("div");


        div.className =
            "champion-wager-item" +
            (selected ? " selected" : "");


        div.innerHTML = `

            <img
                src="${item.image || ""}"
                alt=""
                class="champion-item-image"
            >

            <div class="champion-wager-item-info">

                <strong>
                    ${escapeChampionHTML(item.name)}
                </strong>

                <span>
                    ${Number(item.price || 0).toFixed(2)} ⛃
                </span>

            </div>

            <div class="champion-item-check">

                ${selected ? "✓" : "+"}

            </div>
        `;


        div.addEventListener(
            "click",
            () => toggleChampionItem(index)
        );


        container.appendChild(div);

    });

}


/* =========================================================
   SELECT / DESELECT ITEM
   ========================================================= */

function toggleChampionItem(index) {

    if (Champion.battleRunning) return;


    if (
        !inventory[index]
    ) {
        return;
    }


    const position =
        Champion.selectedItems.indexOf(index);


    if (position !== -1) {

        Champion.selectedItems.splice(
            position,
            1
        );

    } else {

        Champion.selectedItems.push(index);

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

}


/* =========================================================
   COIN WAGER
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


    if (amount > Number(coins)) {

        alert(
            `You only have ${Number(coins).toFixed(2)} coins.`
        );

        return;

    }


    Champion.coinWager =
        Number(amount.toFixed(2));


    input.value = "";


    updateChampionWagerDisplay();

}


/* =========================================================
   PLAYER WAGER VALUE
   ========================================================= */

function calculatePlayerWager() {

    let total =
        Number(Champion.coinWager) || 0;


    Champion.selectedItems.forEach(index => {

        const item =
            inventory[index];


        if (!item) return;


        total +=
            Number(item.price) || 0;

    });


    return Number(
        total.toFixed(2)
    );

}


/* =========================================================
   PLAYER WAGER DISPLAY
   ========================================================= */

function updateChampionWagerDisplay() {

    const value =
        document.getElementById(
            "champion-wager-value"
        );


    const selected =
        document.getElementById(
            "champion-selected-items"
        );


    const total =
        calculatePlayerWager();


    if (value) {

        value.textContent =
            `Wager: ${total.toFixed(2)} ⛃`;

    }


    if (!selected) return;


    selected.innerHTML = "";


    /* COINS */

    if (Champion.coinWager > 0) {

        const div =
            document.createElement("div");


        div.className =
            "champion-selected-entry";


        div.innerHTML = `

            <span>
                🪙 ${Champion.coinWager.toFixed(2)} coins
            </span>

            <button type="button">
                ✖
            </button>

        `;


        div.querySelector("button")
            .onclick = () => {

                Champion.coinWager = 0;

                updateChampionWagerDisplay();

            };


        selected.appendChild(div);

    }


    /* ITEMS */

    Champion.selectedItems.forEach(index => {

        const item =
            inventory[index];


        if (!item) return;


        const div =
            document.createElement("div");


        div.className =
            "champion-selected-entry";


        div.innerHTML = `

            <img
                src="${item.image || ""}"
                alt=""
            >

            <span>
                ${escapeChampionHTML(item.name)}
                -
                ${Number(item.price).toFixed(2)} ⛃
            </span>

            <button type="button">
                ✖
            </button>

        `;


        div.querySelector("button")
            .onclick = () => {

                const position =
                    Champion.selectedItems.indexOf(index);


                if (position !== -1) {

                    Champion.selectedItems.splice(
                        position,
                        1
                    );

                }


                renderChampionItemList();

                updateChampionWagerDisplay();

            };


        selected.appendChild(div);

    });


    if (
        Champion.coinWager <= 0 &&
        Champion.selectedItems.length === 0
    ) {

        selected.innerHTML = `
            <div class="champion-empty">
                No wager selected.
            </div>
        `;

    }

}


/* =========================================================
   RANDOM BOT ITEM
   ========================================================= */

function chooseRandomBotItem(pool) {

    if (!pool.length) {
        return null;
    }


    /*
        Use the existing case weight system
        when choosing an item.
    */

    const totalWeight =
        pool.reduce(
            (sum, item) =>
                sum + Math.max(0, Number(item.weight) || 1),
            0
        );


    let random =
        Math.random() * totalWeight;


    for (const item of pool) {

        random -=
            Math.max(
                0,
                Number(item.weight) || 1
            );


        if (random <= 0) {

            return {
                ...item
            };

        }

    }


    return {
        ...pool[
            Math.floor(
                Math.random() * pool.length
            )
        ]
    };

}


/* =========================================================
   CREATE BOT WAGER
   ========================================================= */

function createBotWager(playerWager) {

    const pool =
        getChampionItemPool();


    if (
        !pool.length ||
        playerWager <= 0
    ) {

        return {
            items: [],
            coins: 0,
            total: 0
        };

    }


    /*
        Decide the bot's wager percentage.

        Example:

        Player = 10

        Random multiplier = 2.37

        Bot target = 23.70
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
        Only use items that fit under
        the maximum allowed value.
    */

    const usableItems =
        pool.filter(
            item =>
                Number(item.price) <= maxAllowed
        );


    if (!usableItems.length) {

        return {
            items: [],
            coins: 0,
            total: 0
        };

    }


    /*
        Randomize the pool.
    */

    const shuffled =
        [...usableItems].sort(
            () => Math.random() - 0.5
        );


    /*
        Sort by price, largest first.

        This allows combinations such as:

        $8 + $4 + $2
        instead of only one $8 item.
    */

    shuffled.sort(
        (a, b) =>
            Number(b.price) -
            Number(a.price)
    );


    const selected = [];

    let total = 0;


    /*
        Build a collection close to the target.
    */

    for (const item of shuffled) {

        const price =
            Number(item.price);


        if (
            total + price <= target
        ) {

            selected.push({
                ...item
            });


            total += price;

        }


        if (
            total >= target * 0.90
        ) {

            break;

        }

    }


    /*
        Try random additional items
        if we're still below target.
    */

    for (
        let i = 0;
        i < 50 &&
        total < target * 0.90;
        i++
    ) {

        const item =
            chooseRandomBotItem(
                usableItems
            );


        if (!item) continue;


        const price =
            Number(item.price);


        if (
            total + price <= target
        ) {

            selected.push({
                ...item
            });


            total += price;

        }

    }


    /*
        If we somehow didn't find anything,
        choose one valid random item.
    */

    if (!selected.length) {

        const candidates =
            usableItems.filter(
                item =>
                    Number(item.price) <= maxAllowed
            );


        if (candidates.length) {

            const item =
                chooseRandomBotItem(
                    candidates
                );


            selected.push({
                ...item
            });


            total =
                Number(item.price);

        }

    }


    /*
        IMPORTANT:

        We are NOT using the bot's coins
        to artificially inflate the wager.

        The bot wager consists of actual items.
    */

    return {

        items: selected,

        coins: 0,

        total: Number(
            total.toFixed(2)
        ),

        multiplier

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
            `FishBot Wager: ${botWager.total.toFixed(2)} ⛃`;

    }


    if (!items) return;


    items.innerHTML = "";


    botWager.items.forEach(item => {

        const div =
            document.createElement("div");


        div.className =
            "champion-bot-entry";


        div.innerHTML = `

            <img
                src="${item.image || ""}"
                alt=""
                class="champion-bot-item-image"
            >

            <div>

                <strong>
                    ${escapeChampionHTML(item.name)}
                </strong>

                <small>
                    ${Number(item.price).toFixed(2)} ⛃
                </small>

            </div>

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


    const playerWager =
        calculatePlayerWager();


    if (playerWager <= 0) {

        alert(
            "You need to wager coins or items first."
        );

        return;

    }


    /*
        Validate item indexes BEFORE
        doing anything destructive.
    */

    Champion.selectedItems =
        Champion.selectedItems.filter(
            index =>
                inventory[index] &&
                Number(inventory[index].price) > 0
        );


    const actualWager =
        calculatePlayerWager();


    if (actualWager <= 0) {

        alert(
            "Your wager is empty."
        );

        return;

    }


    /*
        Make FishBot's wager first.

        NOTHING has been removed yet.
    */

    const botWager =
        createBotWager(
            actualWager
        );


    if (
        !botWager.items.length ||
        botWager.total <= 0
    ) {

        alert(
            "FishBot could not create a valid item wager."
        );

        return;

    }


    /*
        Store the battle wagers.
    */

    Champion.totalPlayerWager =
        actualWager;


    Champion.totalBotWager =
        botWager.total;


    Champion.botItems =
        botWager.items.map(
            item => ({ ...item })
        );


    Champion.botCoins = 0;


    /*
        SHOW BOT WAGER BEFORE STARTING.
    */

    displayBotWager(
        botWager
    );


    /*
        TAKE PLAYER COINS.
    */

    if (Champion.coinWager > 0) {

        coins -=
            Champion.coinWager;


        coins =
            Number(
                coins.toFixed(2)
            );


        updateCoins();

    }


    /*
        TAKE PLAYER ITEMS.

        Reverse order is important because
        inventory indexes change when splice()
        is used.
    */

    const indexes =
        [...Champion.selectedItems]
            .sort(
                (a, b) => b - a
            );


    indexes.forEach(index => {

        if (
            index >= 0 &&
            index < inventory.length
        ) {

            inventory.splice(
                index,
                1
            );

        }

    });


    saveInventory();

    renderInventory();

    populateCoinflipDropdown();

    updateBackpackValue();


    /*
        Clear wager selection.
    */

    Champion.coinWager = 0;

    Champion.selectedItems = [];


    renderChampionItemList();

    updateChampionWagerDisplay();


    /*
        Start the actual battle.
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
        `🏆 Your wager: ${Champion.totalPlayerWager.toFixed(2)} ⛃`
    );


    addChampionLog(
        `🐟 FishBot wager: ${Champion.totalBotWager.toFixed(2)} ⛃`
    );


    setTimeout(
        championTurn,
        900
    );

}


/* =========================================================
   TURN
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
            `${attackerName} uses ${weapon}, but ${phrase}`
        );


        finishChampionTurn(
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


    let crit = false;

    let miniCrit = false;


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
        Math.floor(damage);


    /*
        APPLY DAMAGE
    */

    if (attacker === "player") {

        Champion.botHP =
            Math.max(
                0,
                Champion.botHP - damage
            );

    } else {

        Champion.playerHP =
            Math.max(
                0,
                Champion.playerHP - damage
            );

    }


    updateChampionHP();


    /*
        CRIT MESSAGE
    */

    if (crit) {

        addChampionLog(
            `💥 ${
                CHAMPION_CRIT_PHRASES[
                    Math.floor(
                        Math.random() *
                        CHAMPION_CRIT_PHRASES.length
                    )
                ]
            }`
        );

    }


    if (miniCrit) {

        addChampionLog(
            `⚡ ${
                CHAMPION_MINI_CRIT_PHRASES[
                    Math.floor(
                        Math.random() *
                        CHAMPION_MINI_CRIT_PHRASES.length
                    )
                ]
            }`
        );

    }


    const phrase =
        getChampionDamagePhrase(
            weapon
        );


    addChampionLog(
        `${attackerName} uses ${weapon} and ${phrase} <strong>${damage}</strong> damage to ${targetName}.`
    );


    /*
        DEAD?
    */

    if (
        Champion.playerHP <= 0 ||
        Champion.botHP <= 0
    ) {

        setTimeout(
            finishChampionBattle,
            800
        );

        return;

    }


    finishChampionTurn(
        attacker
    );

}


/* =========================================================
   NEXT TURN
   ========================================================= */

function finishChampionTurn(attacker) {

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
        Champion.turn === "player"
    ) {

        status.textContent =
            `🏆 Champion's turn • Round ${Champion.round}`;

    } else {

        status.textContent =
            `🐟 FishBot's turn • Round ${Champion.round}`;

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
                Champion.playerHP /
                CHAMPION_MAX_HP *
                100
            )
        );


    const botPercent =
        Math.max(
            0,
            Math.min(
                100,
                Champion.botHP /
                CHAMPION_MAX_HP *
                100
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
            `${Champion.playerHP} / ${CHAMPION_MAX_HP}`;

    }


    if (botText) {

        botText.textContent =
            `${Champion.botHP} / ${CHAMPION_MAX_HP}`;

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


    if (log) {

        log.innerHTML = "";

    }

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


    if (Champion.battleTimer) {

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
        Give the exact items FishBot wagered.
    */

    Champion.botItems.forEach(item => {

        inventory.push({
            name: item.name,
            rarity: item.rarity,
            price: Number(item.price),
            weight: Number(item.weight) || 1,
            image: item.image || ""
        });

    });


    /*
        Save.
    */

    saveInventory();

    renderInventory();

    populateCoinflipDropdown();

    updateBackpackValue();

    updateChampionWagerDisplay();


    addChampionLog(
        "🏆 <strong>VICTORY!</strong>"
    );


    addChampionLog(
        `You won ${Champion.totalBotWager.toFixed(2)} ⛃ worth of items!`
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


    addChampionLog(
        "🔪 <strong>DEFEAT!</strong>"
    );


    addChampionLog(
        `FishBot won your ${Champion.totalPlayerWager.toFixed(2)} ⛃ wager.`
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

            <div class="champion-loss-winnings">

                You lost:

                <strong>
                    ${Champion.totalPlayerWager.toFixed(2)} ⛃
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

    if (
        !Champion.botItems.length
    ) {

        return "Nothing was won.";

    }


    let html = "";


    Champion.botItems.forEach(item => {

        html += `

            <div class="champion-winning-entry">

                <img
                    src="${item.image || ""}"
                    alt=""
                >

                <div>

                    <strong>
                        ${escapeChampionHTML(item.name)}
                    </strong>

                    <small>
                        ${Number(item.price).toFixed(2)} ⛃
                    </small>

                </div>

            </div>

        `;

    });


    return html;

}


/* =========================================================
   RESET
   ========================================================= */

function resetChampion() {

    if (Champion.battleTimer) {

        clearTimeout(
            Champion.battleTimer
        );

        Champion.battleTimer =
            null;

    }


    Champion.coinWager = 0;

    Champion.selectedItems = [];

    Champion.botItems = [];

    Champion.botCoins = 0;

    Champion.totalPlayerWager = 0;

    Champion.totalBotWager = 0;

    Champion.battleRunning = false;

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


    const preview =
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


    if (preview) {

        preview.style.display =
            "none";

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

    updateChampionHP();

}


/* =========================================================
   HELPERS
   ========================================================= */

function randomInteger(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


function getChampionDamagePhrase(weapon) {

    const phrases =
        CHAMPION_DAMAGE_PHRASES[
            weapon
        ];


    if (
        !phrases ||
        !phrases.length
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
