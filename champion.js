/* 
   CHAMPION MODE
 */

const CHAMPION_MAX_HP = 100;

const CHAMPION_CRIT_CHANCE = 0.16;
const CHAMPION_CRIT_MULTIPLIER = 3;

const CHAMPION_MISS_CHANCE = 0.1;

const CHAMPION_MINI_CRIT_CHANCE = 0.24;
const CHAMPION_MINI_CRIT_MULTIPLIER = 2;



const BOT_MIN_MULTIPLIER = 0.10;
const BOT_MAX_MULTIPLIER = 2.75;




const CHAMPION_TURN_DELAY = 1450;


const MAX_BATTLE_LOG_ENTRIES = 5;



const CHAMPION_HP_BAR_LENGTH = 20;



const BOT_ITEM_SEARCH_ATTEMPTS = 250;

const BOT_MAX_ITEMS = 20;



const BOT_TARGET_TOLERANCE = 0.01;




const BOT_EXPENSIVE_ITEM_BIAS = 1.75;



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
        "fills the enemy with needles for",
        "shoots fent dealing"
    ],

    "Loose Cannon": [
        "fires an exploding cannonball for",
        "double donks the enemy for"
    ],

    "Frontier Justice": [
        "fires a vengeful blast for",
        "retaliates for"
    ],

    "Awper Hand": [
        "headshots for",
        "fires a charged shot for"
    ],

    "Cow Mangler 5000": [
        "fires an exploding ray for",
        "mangles the enemy for"
    ],

    "Cleaner's Carbine": [
        "sprays bullets for",
        "empties a mag into the enemy for"
    ],

    "Ambassador": [
        "lands a flawless headshot for",
        "fires a perfect shot for"
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
        "unleashes a wall of bullets for",
        "riddles the enemy with bullets for"
    ],

    "Horseless Headless Horsemann's Headtaker": [
        "decapitates the enemy for",
        "chops the enemy for"
    ],

    "Direct Hit": [
        "lands a direct rocket hit for",
        "airshots the enemy for"
    ],

    "✨Golden Frying Pan": [
        "✨ OBLITERATES reality for"
    ]

};



const CHAMPION_CRIT_PHRASES = [

    "💥 DEVASTATING CRIT!!!",
    "💥 MASSIVE CRITICAL HIT!!!",
    "💥 HEAVY CRITICAL HIT!!!",
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



const Champion = {

    
    coinWager: 0,

    selectedItems: [],


    playerWagerItems: [],

    playerWagerCoins: 0,


    

    botItems: [],

    botCoins: 0,



    totalPlayerWager: 0,

    totalBotWager: 0,


    battleRunning: false,

    playerHP: CHAMPION_MAX_HP,

    botHP: CHAMPION_MAX_HP,

    turn: "player",

    round: 1,

    battleTimer: null,



    payoutComplete: false

};



document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupChampion();

    }
);



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




    if (refreshInventoryButton) {

        refreshInventoryButton.onclick =
            refreshChampionInventory;

    }




    renderChampionItemList();

    updateChampionWagerDisplay();

    updateChampionHP();

}




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
        Update main inventory if the functions
        exist in script.js.
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

/*
    FishBot's new wager algorithm.

    IMPORTANT:

    The old algorithm tried to randomly build a
    combination and could easily end up with:

        $1 item
        $1 item
        $2 item
        $1 item
        $2 item
        $1 item
        ...

    even when a $10 or $15 item would have fit.

    The new algorithm instead:

        1. Calculates a random target inside the
           0.20x - 2.00x range.

        2. Finds combinations of expensive items
           that stay underneath that target.

        3. Strongly prefers fewer items.

        4. Strongly prefers higher-value items.

        5. Adds coins to fill whatever value is
           left over.

    This prevents FishBot from clogging the player's
    inventory with tons of tiny items.
*/


function createBotWager(playerWager) {

    const pool =
        getChampionItemPool();


    /*
        If there are no case items,
        FishBot uses coins.
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
        Pick a random target between the
        minimum and maximum multiplier.
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
        Clean the item pool.
    */

    const validItems =
        pool.filter(
            (item) => {

                const price =
                    Number(
                        item &&
                        item.price
                    );


                return (
                    item &&
                    Number.isFinite(price) &&
                    price > 0
                );

            }
        );


    if (!validItems.length) {

        return {

            coins:
                Number(
                    target.toFixed(2)
                ),

            items: [],

            total:
                Number(
                    target.toFixed(2)
                )

        };

    }


    /*
        Sort by price descending.

        Expensive items are at the front.
    */

    validItems.sort(
        (a, b) =>
            Number(b.price) -
            Number(a.price)
    );


    /*
        =====================================================
        HELPER: SCORE A COMBINATION
        =====================================================

        We want:

        1. High total value.
        2. Few items.
        3. Expensive individual items.
        4. A little randomness.

        The score is NOT just total value.

        Otherwise FishBot could select 10 cheap items
        that happen to equal the target.
    */

    function scoreCombination(
        items,
        total
    ) {

        if (
            !Array.isArray(items) ||
            total <= 0
        ) {

            return -Infinity;

        }


        const difference =
            Math.abs(
                target -
                total
            );


        /*
            Higher value gets a large score.
        */

        let score =
            total * 100;


        /*
            Being close to the target is valuable.
        */

        score -=
            difference * 250;


        /*
            Strong penalty for each additional item.

            This is what prevents the bot from
            choosing many cheap items.
        */

        score -=
            items.length * 80;


        /*
            Reward expensive average item value.
        */

        const averagePrice =
            total /
            items.length;


        score +=
            averagePrice *
            40 *
            BOT_EXPENSIVE_ITEM_BIAS;


        /*
            Small random variation so FishBot does
            not always make the exact same wager.
        */

        score +=
            Math.random() * 25;


        return score;

    }


    /*
        =====================================================
        HELPER: TRY RANDOM EXPENSIVE COMBINATION
        =====================================================
    */

    function createCandidate() {

        /*
            Shuffle the items while heavily favoring
            expensive items.

            We calculate a weighted random score for
            each item.
        */

        const randomized =
            validItems
                .map(
                    (item) => {

                        const price =
                            Number(
                                item.price
                            );


                        /*
                            Bigger prices receive a
                            larger weight.

                            random value is divided by
                            the price bias so expensive
                            items rise toward the front.
                        */

                        const weight =
                            Math.pow(
                                Math.max(
                                    0.01,
                                    price
                                ),
                                BOT_EXPENSIVE_ITEM_BIAS
                            );


                        return {

                            item:
                                item,

                            sortValue:
                                Math.random() /
                                weight

                        };

                    }
                )
                .sort(
                    (a, b) =>
                        a.sortValue -
                        b.sortValue
                )
                .map(
                    (entry) =>
                        entry.item
                );


        const candidate = [];

        let total = 0;


        /*
            First pass:

            Try expensive items from the randomized
            expensive-biased order.
        */

        for (
            const item of randomized
        ) {

            if (
                candidate.length >=
                BOT_MAX_ITEMS
            ) {

                break;

            }


            const price =
                Number(
                    item.price
                );


            if (
                total + price >
                target
            ) {

                continue;

            }


            /*
                Expensive items have a higher
                probability of being accepted.
            */

            const normalized =
                Math.min(
                    1,
                    price /
                    Math.max(
                        1,
                        target
                    )
                );


            const chance =
                0.25 +
                (
                    normalized *
                    0.75
                );


            if (
                Math.random() <
                chance
            ) {

                candidate.push({
                    ...item
                });

                total += price;

            }


            if (
                Math.abs(
                    target -
                    total
                ) <=
                BOT_TARGET_TOLERANCE
            ) {

                break;

            }

        }


        /*
            Second pass:

            Try to improve the candidate with
            the most expensive fitting items.
        */

        const expensiveFirst =
            [...validItems].sort(
                (a, b) =>
                    Number(b.price) -
                    Number(a.price)
            );


        for (
            const item of expensiveFirst
        ) {

            if (
                candidate.length >=
                BOT_MAX_ITEMS
            ) {

                break;

            }


            const price =
                Number(
                    item.price
                );


            if (
                total + price >
                target
            ) {

                continue;

            }


            /*
                Avoid using the exact same item
                object multiple times in one wager
                unless the case pool itself contains
                duplicate entries.
            */

            const alreadyUsed =
                candidate.some(
                    (existing) => {

                        return (
                            existing.name ===
                                item.name &&
                            Number(
                                existing.price
                            ) ===
                                Number(
                                    item.price
                                ) &&
                            existing.image ===
                                item.image
                        );

                    }
                );


            if (alreadyUsed) {

                continue;

            }


            const newTotal =
                total +
                price;


            const currentDifference =
                Math.abs(
                    target -
                    total
                );


            const newDifference =
                Math.abs(
                    target -
                    newTotal
                );


            /*
                Add the item if it improves the
                target or if the candidate is still
                quite small.
            */

            if (
                newDifference <
                    currentDifference ||
                candidate.length === 0
            ) {

                candidate.push({
                    ...item
                });

                total =
                    newTotal;

            }


            if (
                Math.abs(
                    target -
                    total
                ) <=
                BOT_TARGET_TOLERANCE
            ) {

                break;

            }

        }


        return {

            items:
                candidate,

            total:
                Number(
                    total.toFixed(2)
                )

        };

    }


    /*
        =====================================================
        SEARCH FOR THE BEST COMBINATION
        =====================================================
    */

    let bestItems = [];

    let bestTotal = 0;

    let bestScore = -Infinity;


    for (
        let attempt = 0;
        attempt < BOT_ITEM_SEARCH_ATTEMPTS;
        attempt++
    ) {

        const candidate =
            createCandidate();


        const score =
            scoreCombination(
                candidate.items,
                candidate.total
            );


        if (
            score >
            bestScore
        ) {

            bestScore =
                score;

            bestItems =
                candidate.items.map(
                    (item) => ({
                        ...item
                    })
                );

            bestTotal =
                candidate.total;

        }


        /*
            Perfect enough.

            No reason to keep searching if the bot
            has a high-value combination that is
            within one cent of the target.
        */

        if (
            Math.abs(
                target -
                bestTotal
            ) <=
            BOT_TARGET_TOLERANCE &&
            bestItems.length <= 2
        ) {

            break;

        }

    }


    /*
        =====================================================
        FALLBACK: MOST EXPENSIVE FITTING ITEM
        =====================================================

        If the randomized search somehow failed,
        pick the most expensive item that fits.
    */

    if (
        bestItems.length === 0
    ) {

        const fittingItems =
            validItems.filter(
                (item) => {

                    return (
                        Number(item.price) <=
                        target
                    );

                }
            );


        if (
            fittingItems.length > 0
        ) {

            fittingItems.sort(
                (a, b) =>
                    Number(b.price) -
                    Number(a.price)
            );


            /*
                Choose randomly from the top few
                expensive fitting items.
            */

            const topCount =
                Math.min(
                    5,
                    fittingItems.length
                );


            const selected =
                fittingItems[
                    Math.floor(
                        Math.random() *
                        topCount
                    )
                ];


            bestItems = [
                {
                    ...selected
                }
            ];


            bestTotal =
                Number(
                    selected.price
                );

        }

    }


    /*
        =====================================================
        ADD COINS TO FILL REMAINING VALUE
        =====================================================

        This is important.

        FishBot doesn't need to add a bunch of
        cheap items just to reach the target.

        Instead, coins make up the difference.
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

        Never exceed the maximum allowed wager.
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


    /*
        Final total.
    */

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

        Display expensive items first.
    */

    const sortedBotItems =
        [...botWager.items].sort(
            (a, b) =>
                Number(b.price || 0) -
                Number(a.price || 0)
        );


    sortedBotItems.forEach(
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
        Create FishBot wager before removing
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


    /*
        =====================================================
        RESET PAYOUT FLAG
        =====================================================
    */

    Champion.payoutComplete =
        false;


    /*
        =====================================================
        SAVE PLAYER'S ORIGINAL COIN WAGER
        =====================================================
    */

    Champion.playerWagerCoins =
        Number(
            Champion.coinWager.toFixed(2)
        );


    /*
        =====================================================
        SAVE PLAYER'S ORIGINAL ITEMS
        =====================================================

        IMPORTANT:

        We clone every item BEFORE inventory.splice()
        removes it from the inventory.

        This means the actual item data survives
        the battle.
    */

    Champion.playerWagerItems =
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
                (item) =>
                    item !== null
            );


    /*
        Store battle wager.
    */

    Champion.totalPlayerWager =
        Number(
            playerWager.toFixed(2)
        );


    Champion.totalBotWager =
        Number(
            botWager.total.toFixed(2)
        );


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


    /*
        =====================================================
        REMOVE PLAYER COIN WAGER
        =====================================================
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
        =====================================================
        REMOVE PLAYER ITEM WAGERS
        =====================================================

        Remove backwards so inventory indexes
        do not shift.
    */

    const indexesToRemove =
        [
            ...Champion.selectedItems
        ]
        .sort(
            (a, b) =>
                b - a
        );


    indexesToRemove.forEach(
        (index) => {

            if (
                Array.isArray(inventory) &&
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
        Save the inventory after removing wagers.
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
        Clear currently selected wager.

        The ORIGINAL wager is still safely stored in:

            Champion.playerWagerItems
            Champion.playerWagerCoins
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
            10,
            30
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
        Player wins when FishBot reaches zero
        while the player is still alive.
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
   RETURN PLAYER WAGER
   ========================================================= */

/*
    This function handles the player's original
    wager separately from the FishBot winnings.

    It exists specifically to make sure the player's
    wagered items are NEVER accidentally forgotten.
*/

function returnPlayerWager() {

    /*
        Never pay the same wager twice.
    */

    if (
        Champion.payoutComplete
    ) {

        return;

    }


    /*
        =====================================================
        RETURN PLAYER COINS
        =====================================================
    */

    if (
        Champion.playerWagerCoins > 0
    ) {

        coins +=
            Number(
                Champion.playerWagerCoins
            );

        coins =
            Number(
                coins.toFixed(2)
            );

    }


    /*
        =====================================================
        RETURN PLAYER ITEMS
        =====================================================
    */

    if (
        Array.isArray(
            Champion.playerWagerItems
        )
    ) {

        Champion.playerWagerItems.forEach(
            (item) => {

                if (!item) return;


                /*
                    Create a fresh copy.

                    This prevents references from the
                    temporary battle state being shared
                    with the inventory.
                */

                inventory.push({
                    ...item
                });

            }
        );

    }

}


/* =========================================================
   GIVE BOT WINNINGS
   ========================================================= */

/*
    Gives the FishBot wager to the player.

    Items are sorted from highest value to lowest value
    before being added to inventory.

    The bot itself already selected a small number of
    higher-value items, so this should keep the inventory
    much cleaner.
*/

function giveBotWinnings() {

    /*
        =====================================================
        BOT COINS
        =====================================================
    */

    if (
        Champion.botCoins > 0
    ) {

        coins +=
            Number(
                Champion.botCoins
            );

        coins =
            Number(
                coins.toFixed(2)
            );

    }


    /*
        =====================================================
        BOT ITEMS
        =====================================================
    */

    const sortedBotItems =
        Array.isArray(
            Champion.botItems
        )
            ? [...Champion.botItems].sort(
                (a, b) =>
                    Number(
                        b.price || 0
                    ) -
                    Number(
                        a.price || 0
                    )
            )
            : [];


    sortedBotItems.forEach(
        (item) => {

            if (!item) return;


            inventory.push({
                ...item
            });

        }
    );

}


/* =========================================================
   SAVE CHAMPION PAYOUT
   ========================================================= */

function saveChampionPayout() {

    /*
        Save inventory and all related UI.
    */

    saveInventory();


    if (
        typeof updateCoins ===
        "function"
    ) {

        updateCoins();

    }


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
   PLAYER WIN
   ========================================================= */

function finishChampionWin() {

    /*
        Do not allow a second payout.
    */

    if (
        Champion.payoutComplete
    ) {

        return;

    }


    /*
        =====================================================
        RETURN PLAYER'S ORIGINAL WAGER
        =====================================================
    */

    returnPlayerWager();


    /*
        =====================================================
        GIVE FISHBOT'S WAGER
        =====================================================
    */

    giveBotWinnings();


    /*
        Mark payout complete BEFORE saving.

        This protects against accidental duplicate
        calls to finishChampionWin().
    */

    Champion.payoutComplete =
        true;


    /*
        =====================================================
        SAVE EVERYTHING
        =====================================================
    */

    saveChampionPayout();


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
        Battle log.
    */

    addChampionLog(
        "🏆 <strong>VICTORY!</strong>"
    );


    addChampionLog(
        `You defeated FishBot and won ${
            Champion.totalBotWager.toFixed(2)
        } ⛃!`
    );


    addChampionLog(
        `Your ${
            Champion.totalPlayerWager.toFixed(2)
        } ⛃ wager was returned!`
    );


    /*
        Result title.
    */

    if (title) {

        title.textContent =
            "🏆 VICTORY!";

    }


    /*
        Result message.
    */

    if (message) {

        message.textContent =
            "FishBot has been defeated! You won FishBot's vault!";

    }


    /*
        Winnings display.
    */

    if (winnings) {

        winnings.innerHTML =
            buildWinningsHTML();

    }


    /*
        Show result.
    */

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

        Therefore nothing is returned on a loss.

        FishBot's wager is also not added to the
        player's inventory.
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


    /*
        =====================================================
        PLAYER WAGER RETURN
        =====================================================
    */

    if (
        Champion.playerWagerCoins > 0
    ) {

        html += `

            <div
                class="champion-winning-entry">

                ↩️

                <strong>

                    Your ${
                        Champion.playerWagerCoins
                            .toFixed(2)
                    } coins returned

                </strong>

            </div>

        `;

    }


    /*
        Player's returned items.
    */

    const sortedReturnedItems =
        [...Champion.playerWagerItems].sort(
            (a, b) =>
                Number(b.price || 0) -
                Number(a.price || 0)
        );


    sortedReturnedItems.forEach(
        (item) => {

            html += `

                <div
                    class="champion-winning-entry">

                    ↩️

                    <img
                        src="${escapeChampionAttribute(
                            item.image || ""
                        )}"
                        alt=""
                    >

                    <span>

                        Your wager returned:

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


    /*
        =====================================================
        FISHBOT COINS
        =====================================================
    */

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


    /*
        =====================================================
        FISHBOT ITEMS
        =====================================================
    */

    const sortedBotItems =
        [...Champion.botItems].sort(
            (a, b) =>
                Number(b.price || 0) -
                Number(a.price || 0)
        );


    sortedBotItems.forEach(
        (item) => {

            html += `

                <div
                    class="champion-winning-entry">

                    🎁

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


    Champion.coinWager = 0;

    Champion.selectedItems = [];

    Champion.playerWagerItems = [];

    Champion.playerWagerCoins = 0;

    Champion.botItems = [];

    Champion.botCoins = 0;

    Champion.totalPlayerWager = 0;

    Champion.totalBotWager = 0;

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

    Champion.payoutComplete =
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
