/*************** Ecoutes d'event et leur déclenchement ***************/

//element html utiles pour les events et manip du dom
const actionResetButton = document.getElementById("action-reset");
const actionDrawButton = document.getElementById("action-draw");

//Ecoutes d'event sur les boutons
actionResetButton.addEventListener("click", actionReset);
actionDrawButton.addEventListener("click", actionDraw);




// fonction qui fait le fetch() et contacte l api
async function callApi(uri) {
    console.log("-- callAPI - start --");
    console.log("uri = ", uri)

    try {
    //fetch(), appel a l api et reception de la reponse
    const response = await fetch(uri);

        if (response.ok) { //pour confirmer que le statut HTTP est dans la plage de succès (200-299)

            //Récupération des données JSON recues de l api
            const data = await response.json();
            console.log("data = ", data);

            console.log("-- callAPI - end --");

            //renvoi des données
            return data;
        } else {
            console.error(`Erreur HTTP : ${response.status} - ${response.statusText}`); //description de l echec ex : 404
            alert("Impossible de récupérer les données. Veuillez réessayer plus tard.");
        }
    } catch (error) {
        console.error("Erreur lors de l'appel API : ", error.message); // description de l error capturée 
        alert("Impossible de récupérer les données. Veuillez réessayer plus tard.");
    }
}

/*************** Demande d'un nouveau deck ***************/
//l'uri du endpoint de dde de nouveau deck
const API_ENDPOINT_NEW_DECK = "https://deckofcardsapi.com/api/deck/new"; //url recupéré sur api des cartes

//fonction de dde de nouveau deck
async function getNewDeck() {
    return await callApi(API_ENDPOINT_NEW_DECK);
}

/*************** Mélange du deck ***************/


function createPick() {
    const pickHtmlElement = document.createElement("div");
    pickHtmlElement.classList.add('pioche');

    // Récup du parent
    const actionsContainer = document.getElementById('actions-container');
    
    // Insertion
    actionsContainer.insertBefore(pickHtmlElement, actionsContainer.firstChild);
    return pickHtmlElement;
}

/************************* Mélange du deck ******************/
// Fonction pour créer la pile de 52 cartes
function createPileOfCards() {
    // Sélectionner le conteneur parent
    const piocheContainer = document.querySelector('.pioche');

   
    
    // Créer les 52 cartes
    for (let i = 0; i < 52; i++) {
        // Créer l'élément image pour chaque carte
        const card = document.createElement('img');
        card.src = "../img/dosCarte.jpg"; 
        card.alt = "Pioche de carte";
        card.classList.add('pioche-card');
        
        // Appliquer le décalage pour chaque carte
        card.style.position = 'absolute';  
        card.style.left = `${i * 0.3}px`;  // Décalage vertical de 2px à chaque carte
        card.style.top = `${i * 0.2}px`;  // Décalage vertical de 2px à chaque carte

        // Ajouter la carte au conteneur de la pioche
        piocheContainer.appendChild(card);
    }
}

// Appeler la fonction pour créer la pile
createPileOfCards();


//on pioche
let idDeck = null;

//fonction fléchée qui renvoie uri dyn de dde de mélange du deck et de pioche
const getApiEndpointShuffleDeck = () => `https://deckofcardsapi.com/api/deck/${idDeck}/shuffle/`;


//Fonction qui mélange le deck
async function shuffleDeck() {
    return await callApi(getApiEndpointShuffleDeck());
}


/*************** Récupération des cartes piochées ***************/

// on aura besoin de let idDeck = null; initialisé L32

//fonction fléchée qui renvoie uri dyn de dde de mélange du deck et de pioche
const getApiEndpointDrawCard = () => `https://deckofcardsapi.com/api/deck/${idDeck}/draw/?count=1`;


//fonction de dde de pioche dans le deck
async function drawCard() {       
    return await callApi(getApiEndpointDrawCard());
}


/*************** Nettoyage avt recup du nouveau deck ***************/ 

// on aura besoin de let idDeck = null; initialisé L32

//supprime les carte de l'ancien deck du DOM
const cleanDomCardsFromPreviousDeck = () =>

    //Récup des cartes par class CSS    
    document.querySelectorAll(".card")
    
    //et pour chacune de ces cartes
    .forEach((child) => child.remove());


//ré init (dde new deck + melange)

async function actionReset() {

    //vider le DOM de l ancien deck
    cleanDomCardsFromPreviousDeck();

    //recup new deck
    const newDeckResponse = await getNewDeck();

    //recup id du new deck dans les datas recues et maj variables globale
    idDeck = newDeckResponse.deck_id;

    const button = document.getElementById('action-draw');
    button.style.display = 'block'; 

     
    //melange du deck
    await shuffleDeck();
}



/******************* Mise en place des piles **********************/

//fonction fléchée qui ajoute les cartes a une pile
const getApiEndpointAddToPile = (pileName, cardCode) => 
    `https://deckofcardsapi.com/api/deck/${idDeck}/pile/${pileName}/add/?cards=${cardCode}`;



//element html utiles pour les event et pour la manip du dom
const cardsContainer = document.getElementById("cards-container");

//fonction créer une pile
function createContainPile(suit) {
    const pileHtmlElement = document.createElement("div");
    pileHtmlElement.classList.add(suit);
    pileHtmlElement.classList.add('pile');
    cardsContainer.append(pileHtmlElement);
    return pileHtmlElement;
}

// Fonction pour ajouter une carte à la pile correspondante
async function addCardToDomBySuit(suit, imgUri, code) {
    // Recherche de la div correspondant au suit
    let pileHtmlElement = document.querySelector(`.${suit}`);

    // Si la div n'existe pas encore, on la crée
    if (!pileHtmlElement) {
        pileHtmlElement = createContainPile(suit);
    }
    
    //creation element html 'img' class css "card" et attribut html "src" : l uri sera recue en argument
    const imgCardHtmlElement = document.createElement("img");
    imgCardHtmlElement.classList.add(code);    
    imgCardHtmlElement.classList.add('card');    
    imgCardHtmlElement.src = imgUri;

    // Ajout de l'image dans la pile correspondante
    pileHtmlElement.append(imgCardHtmlElement);

    // Ajout de la carte dans la pile côté API
    const uriAddToPile = getApiEndpointAddToPile(suit.toLowerCase(), code);
    await callApi(uriAddToPile);
}

 


//fonction qui dde a piocher une carte puis qui fait appel pour l integrer dans le dom
async function actionDraw() {

    // Désactive temporairement le bouton de pioche
    actionDrawButton.disabled = true;

    // Attend 2 secondes avant de continuer
    await wait2sec();

    // l appel a l api pour dder au croupier de piocher une carte et de nous la renvoyer
    const drawCardResponse = await drawCard();

    // if (drawCardResponse.cards && drawCardResponse.cards.length > 0) {
        //recup uri de l img de cette carte dans les données recues
        const imgUri = drawCardResponse.cards[0].image;

        // Le suit de la carte tirée
        const suit = drawCardResponse.cards[0].suit; 

        // Le code de la carte tirée    
        const code = drawCardResponse.cards[0].code;

    // Ajout de la carte à la bonne pile
    addCardToDomBySuit(suit, imgUri, code);    

    // //si solde carte = 0 alors draw = casper
    if (drawCardResponse.remaining === 0) {
        actionDrawButton.style.display = 'none'; 
    } 
    
    }



/*********************** Délai de pioche **************/
//Stockage timer du moment (ms)
const timerStart = new Date().getTime();

//Renvoie string en ms ecoulées depuis timerStart
function getCurrMs() {
    return `[${new Date().getTime() - timerStart} ms]`;
};

//fonction qui attend 2sec avt succes
async function wait2sec() {
    console.log(getCurrentMs() + "wait2sec - start"); // timer du début

    return new Promise((resolve, reject) => {
    setTimeout(() => {
        console.log(getCurrMs() + "wait2sec - end"); // timer pendant
        resolve("ok"); 
    }, 2000);
});
}
 




/*************** appel ini lancement de l appli ***************/
actionReset();


