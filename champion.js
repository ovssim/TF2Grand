/* =========================================================
   CHAMPION MODE
   ========================================================= */

/*
    Champion Mode uses variables/functions from script.js:

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

const CHAMPION_CRIT_CHANCE = 0.24;
const CHAMPION_CRIT_MULTIPLIER = 3;

const CHAMPION_MISS_CHANCE = 0.15;

const CHAMPION_MINI_CRIT_CHANCE = 0.16;
const CHAMPION_MINI_CRIT_MULTIPLIER = 2;


/*
    FishBot wager range.

    Minimum: 70%
    Maximum: 300%
*/

const BOT_MIN_MULTIPLIER = 0.70;
const BOT_MAX_MULTIPLIER = 3.00;


/*
    Battle speed.

    Lower = faster
    Higher = slower
*/

const CHAMPION_TURN_DELAY = 1200;


/*
    Maximum number of battle-log messages
    displayed at once.
*/

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
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupChampion();

});


/* =========================================================
   SETUP
   ========================================================= */

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

        addCoinButton.onclick =
            addChampionCoins;

    }


    if (startButton) {

        startButton.onclick =
            startChampionBattle;

    }


    if (closeResultButton) {

        closeResultButton.onclick =
            resetChampion;

    }


    renderChampionItemList();

    updateChampionWagerDisplay();

}


/* =========================================================
   CHECK CASE DATA
   ========================================================= */

function championCasesReady() {

    /*
        Supported structures:

        cases = [...]

        OR

        cases = {
            cases: [...]
        }
    */


    if (Array.isArray(cases)) {

        return cases.length > 0;

    }


    if (
        cases &&
        Array.isArray(cases.cases)
    ) {

        return cases.cases.length > 0;

    }


    return false;

}


/* =========================================================
   GET CASE ARRAY
   ========================================================= */

function getChampionCases() {

    if (Array.isArray(cases)) {

        return cases;

    }


    if (
        cases &&
        Array.isArray(cases.cases)
    ) {

        return cases.cases;

    }


    return [];

}


/* =========================================================
   GET ALL CASE ITEMS
   ========================================================= */

function getChampionItemPool() {

    const pool = [];

    const caseList =
        getChampionCases();


    if (!caseList.length) {

        console.error(
            "Champion Mode: No cases are available.",
            cases
        );

        return pool;

    }


    caseList.forEach(gameCase => {

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

                name:
                    String(
                        item.name ||
                        "Unknown Item"
                    ),

                rarity:
                    String(
                        item.rarity ||
                        "common"
                    ),

                price,

                weight:
                    Number(item.weight) || 1,

                image:
                    item.image || ""

            });

        });

    });


    console.log(
        `Champion Mode: Found ${pool.length} possible bot items.`
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


    inventory.forEach((item, index) => {

        if (!item) return;


        const alreadySelected =
            Champion.selectedItems.includes(index);


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
                src="${item.image || ""}"
                alt=""
            >

            <div class="champion-wager-item-info">

                <span>
                    ${escapeChampionHTML(item.name)}
                </span>

                <small>
                    ${Number(
                        item.price || 0
                    ).toFixed(2)} ⛃
                </small>

            </div>

            <div class="champion-item-check">

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

    });

}


/* =========================================================
   TOGGLE ITEM
   ========================================================= */

function toggleChampionItem(index) {

    if (Champion.battleRunning) return;


    const position =
        Champion.selectedItems.indexOf(index);


    if (position >= 0) {

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
   ADD COINS TO WAGER
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
            `You only have ${coins.toFixed(2)} coins.`
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


    Champion.selectedItems.forEach(index => {

        const item =
            inventory[index];


        if (!item) return;


        const price =
            Number(item.price);


        if (
            Number.isFinite(price) &&
            price > 0
        ) {

            total += price;

        }

    });


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
        COINS
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


        coinDiv
            .querySelector("button")
            .onclick = () => {

                Champion.coinWager = 0;

                updateChampionWagerDisplay();

            };


        selectedBox.appendChild(
            coinDiv
        );

    }


    /*
        ITEMS
    */

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


        div
            .querySelector("button")
            .onclick = () => {

                const position =
                    Champion.selectedItems.indexOf(
                        index
                    );


                if (position >= 0) {

                    Champion.selectedItems.splice(
                        position,
                        1
                    );

                }


                renderChampionItemList();

                updateChampionWagerDisplay();

            };


        selectedBox.appendChild(div);

    });


    /*
        EMPTY
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
   CREATE BOT WAGER
   ========================================================= */

function createBotWager(playerWager) {

    const pool =
        getChampionItemPool();


    /*
        Don't create a fake wager if the
        item pool isn't available.
    */

    if (!pool.length) {

        console.error(
            "Champion Mode: FishBot has no available items."
        );


        return {

            coins: 0,

            items: [],

            total: 0

        };

    }


    /*
        Random multiplier from 70% to 300%.
    */

    const multiplier =
        BOT_MIN_MULTIPLIER +
        Math.random() *
        (
            BOT_MAX_MULTIPLIER -
            BOT_MIN_MULTIPLIER
        );


    const desiredValue =
        playerWager * multiplier;


    /*
        Shuffle items.
    */

    const shuffled =
        [...pool].sort(
            () => Math.random() - 0.5
        );


    /*
        Only consider items that don't
        exceed the target.
    */

    const affordable =
        shuffled.filter(item => {

            return (
                item.price <= desiredValue
            );

        });


    /*
        Largest first.
    */

    affordable.sort(
        (a, b) =>
            b.price - a.price
    );


    const selected = [];

    let total = 0;


    /*
        Build wager from multiple items.
    */

    for (const item of affordable) {

        if (
            total >= desiredValue
        ) {

            break;

        }


        if (
            total + item.price
            <= desiredValue
        ) {

            selected.push({
                ...item
            });


            total +=
                Number(item.price);

        }

    }


    /*
        Find the single closest item.
    */

    let bestSingle = null;

    let bestDifference =
        Infinity;


    pool.forEach(item => {

        const difference =
            Math.abs(
                item.price -
                desiredValue
            );


        if (
            difference <
            bestDifference
        ) {

            bestDifference =
                difference;

            bestSingle =
                item;

        }

    });


    /*
        Use the single item if it is
        closer to the target.
    */

    if (
        bestSingle &&
        bestDifference <
        Math.abs(
            total -
            desiredValue
        )
    ) {

        selected.length = 0;


        selected.push({
            ...bestSingle
        });


        total =
            Number(
                bestSingle.price
            );

    }


    /*
        Maximum allowed wager.
    */

    const maxAllowed =
        playerWager *
        BOT_MAX_MULTIPLIER;


    /*
        Remove items if somehow
        over the maximum.
    */

    while (
        total > maxAllowed &&
        selected.length > 0
    ) {

        selected.pop();


        total =
            selected.reduce(
                (sum, item) =>
                    sum +
                    Number(item.price),
                0
            );

    }


    /*
        Fill the remaining target
        with FishBot coins.
    */

    let botCoins = 0;


    const remaining =
        desiredValue -
        total;


    if (
        remaining > 0.01
    ) {

        botCoins =
            Number(
                Math.min(
                    remaining,
                    desiredValue
                ).toFixed(2)
            );


        total += botCoins;

    }


    /*
        Final safety clamp.
    */

    if (
        total > maxAllowed
    ) {

        const itemTotal =
            selected.reduce(
                (sum, item) =>
                    sum +
                    Number(item.price),
                0
            );


        botCoins =
            Math.max(
                0,
                Number(
                    (
                        maxAllowed -
                        itemTotal
                    ).toFixed(2)
                )
            );


        total =
            itemTotal +
            botCoins;

    }


    return {

        coins: Number(
            botCoins.toFixed(2)
        ),

        items: selected,

        total: Number(
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
            `Bot Wager: ${botWager.total.toFixed(2)} ⛃`;

    }


    if (!items) return;


    items.innerHTML = "";


    /*
        BOT COINS
    */

    if (botWager.coins > 0) {

        const div =
            document.createElement("div");


        div.className =
            "champion-bot-entry";


        div.innerHTML =
            `🪙 ${botWager.coins.toFixed(2)} coins`;


        items.appendChild(div);

    }


    /*
        BOT ITEMS
    */

    botWager.items.forEach(item => {

        const div =
            document.createElement("div");


        div.className =
            "champion-bot-entry";


        div.innerHTML = `

            <img
                src="${item.image || ""}"
                alt=""
            >

            <span>
                ${escapeChampionHTML(item.name)}
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
   START CHAMPION BATTLE
   ========================================================= */

function startChampionBattle() {

    if (Champion.battleRunning) return;


    /*
        Make sure case data has loaded.
    */

    if (!championCasesReady()) {

        alert(
            "Cases are still loading. Please wait a moment and try again."
        );


        console.warn(
            "Champion Mode: Cases are not ready.",
            cases
        );


        return;

    }


    /*
        Clean invalid inventory indexes
        BEFORE calculating the wager.
    */

    Champion.selectedItems =
        Champion.selectedItems.filter(index => {

            return (

                Number.isInteger(index) &&

                inventory[index] &&

                Number.isFinite(
                    Number(
                        inventory[index].price
                    )
                ) &&

                Number(
                    inventory[index].price
                ) >= 0

            );

        });


    /*
        Calculate actual wager.
    */

    const actualPlayerWager =
        calculatePlayerWager();


    if (
        actualPlayerWager <= 0
    ) {

        alert(
            "You must wager coins or at least one item."
        );

        return;

    }


    /*
        Make sure player has enough coins.
    */

    if (
        Champion.coinWager > coins
    ) {

        alert(
            `You only have ${coins.toFixed(2)} coins.`
        );

        return;

    }


    /*
        Create FishBot wager BEFORE
        changing player inventory.
    */

    const botWager =
        createBotWager(
            actualPlayerWager
        );


    /*
        Make sure FishBot has a valid wager.
    */

    if (
        botWager.total <= 0 ||
        (
            botWager.items.length === 0 &&
            botWager.coins <= 0
        )
    ) {

        alert(
            "FishBot couldn't create a valid wager. Make sure your cases have items with valid prices."
        );


        console.error(
            "Champion Mode: Invalid FishBot wager.",
            botWager
        );


        return;

    }


    /*
        Save battle values.
    */

    Champion.totalPlayerWager =
        Number(
            actualPlayerWager.toFixed(2)
        );


    Champion.totalBotWager =
        Number(
            botWager.total.toFixed(2)
        );


    Champion.botItems =
        botWager.items.map(item => ({
            ...item
        }));


    Champion.botCoins =
        Number(
            botWager.coins || 0
        );


    /*
        Remove player's coin wager.
    */

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


    /*
        Remove selected inventory items.

        Highest indexes first so the indexes
        don't shift.
    */

    const indexesToRemove =
        [...Champion.selectedItems]
            .sort(
                (a, b) => b - a
            );


    indexesToRemove.forEach(index => {

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


    /*
        Save inventory.
    */

    saveInventory();

    renderInventory();

    populateCoinflipDropdown();

    updateBackpackValue();


    /*
        Clear current wager.
    */

    Champion.selectedItems = [];

    Champion.coinWager = 0;


    renderChampionItemList();

    updateChampionWagerDisplay();


    /*
        Display FishBot wager.
    */

    displayBotWager(
        botWager
    );


    /*
        Start battle.
    */

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


    const status =
        document.getElementById(
            "champion-battle-status"
        );


    if (status) {

        status.textContent =
            "⚔️ Battle starting...";

    }


    addChampionLog(
        "⚔️ Champion Mode has begun!"
    );


    addChampionLog(
        `Your wager: ${Champion.totalPlayerWager.toFixed(2)} ⛃`
    );


    addChampionLog(
        `FishBot wager: ${Champion.totalBotWager.toFixed(2)} ⛃`
    );


    /*
        Start battle.
    */

    setTimeout(() => {

        championTurn();

    }, 900);

}


/* =========================================================
   BATTLE TURN
   ========================================================= */

function championTurn() {

    if (
        !Champion.battleRunning
    ) {

        return;

    }


    /*
        Check for death.
    */

    if (
        Champion.playerHP <= 0 ||
        Champion.botHP <= 0
    ) {

        finishChampionBattle();

        return;

    }


    if (
        Champion.turn === "player"
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

function championAttack(attacker) {

    if (
        !Champion.battleRunning
    ) {

        return;

    }


    /*
        Choose random weapon.
    */

    const weapon =
        CHAMPION_WEAPONS[
            Math.floor(
                Math.random() *
                CHAMPION_WEAPONS.length
            )
        ];


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


        if (
            attacker === "player"
        ) {

            addChampionLog(
                `🏆 Champion uses ${weapon}, but ${phrase}`
            );

        } else {

            addChampionLog(
                `🐟 FishBot uses ${weapon}, but ${phrase}`
            );

        }


        finishTurn(
            attacker
        );


        return;

    }


    /*
        BASE DAMAGE
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
        CRIT
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
        MINI CRIT
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
        APPLY DAMAGE
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


    updateChampionHP();


    /*
        CRIT MESSAGE
    */

    if (crit) {

        addChampionLog(
            `💥 ${
                attacker === "player"
                    ? "Champion"
                    : "FishBot"
            } — ${
                CHAMPION_CRIT_PHRASES[
                    Math.floor(
                        Math.random() *
                        CHAMPION_CRIT_PHRASES.length
                    )
                ]
            }`
        );

    }


    /*
        MINI CRIT MESSAGE
    */

    else if (miniCrit) {

        addChampionLog(
            `⚡ ${
                attacker === "player"
                    ? "Champion"
                    : "FishBot"
            } — ${
                CHAMPION_MINI_CRIT_PHRASES[
                    Math.floor(
                        Math.random() *
                        CHAMPION_MINI_CRIT_PHRASES.length
                    )
                ]
            }`
        );

    }


    /*
        ATTACK MESSAGE
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
        CHECK DEATH.
    */

    if (
        Champion.botHP <= 0 ||
        Champion.playerHP <= 0
    ) {

        setTimeout(() => {

            finishChampionBattle();

        }, 800);


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

    if (
        !Champion.battleRunning
    ) {

        return;

    }


    /*
        Player -> Bot
        Bot -> Player
    */

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


    setTimeout(() => {

        championTurn();

    }, CHAMPION_TURN_DELAY);

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
        Champion.turn === "player"
    ) {

        status.textContent =
            `🏆 Your turn — Round ${Champion.round}`;

    } else {

        status.textContent =
            `🐟 FishBot's turn — Round ${Champion.round}`;

    }

}


/* =========================================================
   UPDATE HP
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


    if (!log) return;


    log.innerHTML = "";

}


/* =========================================================
   ADD BATTLE LOG
   ========================================================= */

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


    log.appendChild(entry);


    /*
        Keep log small.
    */

    while (
        log.children.length >
        MAX_BATTLE_LOG_ENTRIES
    ) {

        log.removeChild(
            log.firstElementChild
        );

    }


    /*
        Scroll to newest message.
    */

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
        Champion.playerHP > 0
    ) {

        finishChampionWin();

    } else {

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


    /*
        Give FishBot's coins.
    */

    if (
        Champion.botCoins > 0
    ) {

        coins +=
            Champion.botCoins;

    }


    /*
        Give FishBot's items.
    */

    Champion.botItems.forEach(item => {

        inventory.push({
            ...item
        });

    });


    /*
        Save.
    */

    saveInventory();

    updateCoins();

    renderInventory();

    populateCoinflipDropdown();

    updateBackpackValue();


    /*
        Battle messages.
    */

    addChampionLog(
        "🏆 <strong>VICTORY!</strong>"
    );


    addChampionLog(
        `You defeated FishBot and won ${Champion.totalBotWager.toFixed(2)} ⛃!`
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
        The player's wager was already removed
        when the battle started.

        Therefore nothing is returned.
    */

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
   WINNINGS HTML
   ========================================================= */

function buildWinningsHTML() {

    let html = "";


    /*
        COINS
    */

    if (
        Champion.botCoins > 0
    ) {

        html += `

            <div class="champion-winning-entry">

                🪙

                <strong>

                    ${Champion.botCoins.toFixed(2)}
                    coins

                </strong>

            </div>

        `;

    }


    /*
        ITEMS
    */

    Champion.botItems.forEach(item => {

        html += `

            <div class="champion-winning-entry">

                <img
                    src="${item.image || ""}"
                    alt=""
                >

                <span>

                    ${escapeChampionHTML(item.name)}

                    <small>

                        ${Number(
                            item.price
                        ).toFixed(2)} ⛃

                    </small>

                </span>

            </div>

        `;

    });


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

    /*
        Stop battle.
    */

    Champion.battleRunning =
        false;


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


    /*
        Clear any pending timer.
    */

    if (
        Champion.battleTimer
    ) {

        clearTimeout(
            Champion.battleTimer
        );


        Champion.battleTimer =
            null;

    }


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

}


/* =========================================================
   RANDOM INTEGER
   ========================================================= */

function randomInteger(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


/* =========================================================
   DAMAGE PHRASE
   ========================================================= */

function getChampionDamagePhrase(weapon) {

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


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeChampionHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}
