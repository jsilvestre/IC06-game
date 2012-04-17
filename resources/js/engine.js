var Config = {
    
    moveInterval : 25, // l'interval entre deux tick pour le déplacement en ms
    moveTime : 1500, // le temps qu'un déplacement doit durer en ms
    
    LIMIT_DRAW_VERTICAL : 50, // le nombre de px minimum entre deux planètes liées (pour la liaison classique)
    
    PLANET_HITBOX : 30,
    
    CARD_TYPE_PLANET : "planet",
    CARD_TYPE_SPECIAL_EVENT : "specialevent",
    CARD_TYPE_MASSIVE_INVASION : "massiveincasion",
    
    NUM_ZONES : 4, // nombre de zones de jeu
    
    INVASION_SPEED_METER : [2, 2, 3, 3, 4, 4], // jauge de vitesse d'invasion
    
    SYSTEM_NAME : "Système",
    
    ROLE_BRUTE : "role_brute",
    ROLE_PIRATE : "role_pirate",
    ROLE_ARCHITECT : "role_architecte",
    ROLE_EXPERT : "role_expert",
    ROLE_SPY : "role_informateur",
    ROLE_EXPLORER : "role_explorateur",
    ROLE_SHIELD : "role_bouclier",
};

var SingletonEngine = {
    engine : null,
}

function Engine() {
    
    this.logger = null;
    
    this.map = null;
    
    this.selectedPlanet = null;
    
    this.players = [];
    this.currentPlayer = 0;
    
    this.nbTurns = 0;
    this.currentNumLaboratory = 0;
    
    this.canvas = null;
    this.canvasContext = null;
    this.canvasBuffer = null;
    this.canvasBufferContenxt = null;
    
    this.playerMoveIntervalId = null;
    this.playerTurnInterval = null;
    this.timerIntervalId = null;
    this.tempoPlayerTurnInterval = null;
    this.tempoInvasionPhaseInterval = null;
    this.tempoFlashInvadedPlanets = null;
    
    this.newTurnDate = null;
    
    this.currentInvasionSpeedIndex = 0;
    
    this.weaponsFound = [];
        
    this.decks = {
        "information" : new Deck(),
        "invaders" : new Deck(),
    };
    
    // Charge le fichier représentant la map
    this.loadMap = function(mapName) {
        $.ajax({
            type: "GET",
            url: "resources/maps/" + mapName + ".json",
            dataType: "json",
            success: function(data) {
                this.initializeGame(data);
            },
            context: this
        });
    }
    
    // Initialise la partie
    this.initializeGame = function(jsonObject) {
        
        this.logger = new Logger();
        this.logger.engine = this;
        this.logger.view = $('#chat-log ul');
        
        this.loadConfiguration(jsonObject);
        this.buildMapModel(jsonObject);
        this.buildDecks();
        
        this.weaponsFound["a"] = false;
        this.weaponsFound["b"] = false;
        this.weaponsFound["c"] = false;
        this.weaponsFound["d"] = false;                    
        
        this.log("Map has been loaded.");
        
        this.canvas = $('#map');
        this.canvasContext = this.canvas[0].getContext('2d');
        
        this.canvasBuffer = document.createElement('canvas');
        this.canvasBuffer.width = this.canvas.width();
        this.canvasBuffer.height = this.canvas.height();
        this.canvasBufferContext = this.canvasBuffer.getContext('2d');
        
        this.currentDestination = null; // utiliser pour les déplacements traversant plusieurs planètes
        
        this.enableAllActions();
        this.initializePlayers();
        this.initializeInventories();
        this.updatePlayerList();
        
        this.initializeInvasion();
        
        this.initializeInvasionSpeedMeterView();
        this.updateInvasionSpeedMeterView();
        this.updateWeaponsListView();
        
        this.render();
        
        this.log("Game is ready.", Config.SYSTEM_NAME);
    }
    
    this.loadConfiguration = function(jsonObject) {
        
        for(var key in jsonObject.config) {
            Config[key] = jsonObject.config[key];
        }
    }
    
    this.log = function(string, actorName) {
        this.logger.logAction(string, actorName);
    }
    
    this.initializePlayers = function() {
        var player = new Player();
        player.id = 0;
        player.name = "Joseph";
        player.planet = this.map.planets[1];
        player.x = player.planet.x;
        player.y = player.planet.y;
        player.role = Config.ROLE_SPY;
        this.players.push(player);
    
        player = new Player();
        player.id = 1;
        player.name = "Player2";
        player.planet = this.map.planets[1];
        player.x = player.planet.x;
        player.y = player.planet.y;
        this.players.push(player);
        
        
        player = new Player();
        player.id = 2;
        player.name = "Player3";
        player.planet = this.map.planets[3];
        player.x = player.planet.x;
        player.y = player.planet.y;
        this.players.push(player);
        
        this.currentPlayer = 0;
        
        this.log("Players have been created.", Config.SYSTEM_NAME);
    }
    
    this.initializeInventories = function() {
        // 4 cards, one of each color
        var i, j;
        
        for(i = 0; i < this.players.length; i++) {
            for(j = 0; j < Config.NUM_CARD_START; j++) {
                this.players[i].inventory.addCard(this.decks.information.removeCard("first"));
            }
        }
        
        this.log("Cards have been distributed.", Config.SYSTEM_NAME);
    }
    
    this.initializeInvasion = function() {
        
        var attackedPlanetId;
        
        for(var i = 3; i > 0; i--) {
            for(var j = 0; j < Config.NUM_PLANET_INITIAL_INVASION; j++) {
                attackedPlanetId = this.decks.invaders.removeCard("first").value;
                this.map.planets[attackedPlanetId].threatLvl = i;
            }
        }
    }
    
    // Exécute le rendu du jeu
    this.render = function() {
        
        this.canvasContext.clearRect(0, 0, this.canvas.width(), this.canvas.height());
        this.canvasBufferContext.clearRect(0, 0, this.canvas.width(), this.canvas.height());
        
        this.renderMap();
        this.renderPlayers();
        
        this.canvasContext.drawImage(this.canvasBuffer, 0, 0);
    }
    
    // Exécute le rendu de la vue de la map
    this.renderMap = function() {
        this.map.draw(this.canvasBufferContext);
    }
    
    // Exécute le rendu de la vue des joueurs
    this.renderPlayers = function() {
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].draw(this.canvasBufferContext);
        }        
    }
    
    this.movePlayer = function() {
        if(this.selectedPlanet != null && this.selectedPlanet != this.players[this.currentPlayer].planet) {
            
            if(this.players[this.currentPlayer].planet.isBoundTo(this.selectedPlanet)) {            
                this.startMoveTo(this.players[this.currentPlayer], this.selectedPlanet);
                this.getCurrentPlayer().pa--;                
            }
            else {   
                // look if the user can go recursively to the planet
                var result = this.determinePathRecursivelyTo(this.players[this.currentPlayer].planet, this.selectedPlanet, new Array());
                if(result != null) {
                    this.startMoveTo(this.players[this.currentPlayer], result);
                    this.getCurrentPlayer().pa = this.getCurrentPlayer().pa - (result.length - 1);
                }
            }

            this.updatePaView();
            this.log("Déplacement vers " + this.selectedPlanet.name);
        }
    }
    
    this.movePlayerWithTargetResource = function() {

        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);

        if(this.checkTargetMoveOk()) {

            player.inventory.removeCard(card.id);
            player.pa--;
            this.updatePaView();
            this.updatePlayerList();
            
            this.startMoveTo(this.getCurrentPlayer(), this.selectedPlanet);
        }
        
    }
    
    this.movePlayerWithCurrentResource = function() {

        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(player.planet.id);

        if(this.checkCurrentMoveOk()) {
            player.inventory.removeCard(card.id);
            player.pa--;
            this.updatePaView();
            this.updatePlayerList();
            
            this.startMoveTo(this.getCurrentPlayer(), this.selectedPlanet);
        }        
    }
    
    this.movePlayerByLabo = function() {
        
        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        if(this.checkLaboMoveOk()) {
            player.pa--;
            this.updatePaView();
            this.updatePlayerList();
            
            this.startMoveTo(this.getCurrentPlayer(), this.selectedPlanet);
        }        
    }
    
    this.startMoveTo = function(player, planet) {
        this.playerMoveIntervalId = setInterval(function(that, dest) { that.executeMove(dest); }, 
                                    Config.moveInterval, 
                                    this, 
                                    planet);
    }
    
    this.determinePathRecursivelyTo = function(planet, targetPlanet, visitedPlanets) {

        if(visitedPlanets.indexOf(planet.id) == -1) {
            
            var currentPlanetArray = [];
            
            if(planet.id == targetPlanet.id) {
                currentPlanetArray.push(planet.id);
                return currentPlanetArray;
            }
            else {
                
                visitedPlanets.push(planet.id);
                var tmpVisitedPlanets = visitedPlanets.slice(0);
                var tmp = new Array();
                for(var i in planet.boundPlanets) {
                    tmp.push(this.determinePathRecursivelyTo(this.map.planets[planet.boundPlanets[i]], targetPlanet, tmpVisitedPlanets));
                }
                
                var shortestPath = null;
                for(var j = 0; j < tmp.length; j++) {
                    
                    if(tmp[j] != null) {                    
                        if(shortestPath == null) {
                            shortestPath = tmp[j];
                        }
                        else {
                            if(shortestPath.length > tmp[j].length) {
                                shortestPath = tmp[j];
                            }
                        }
                    }
                }
                
                currentPlanetArray.push(planet.id);
                if(shortestPath == null) {
                    return null;
                }
                else {
                    currentPlanetArray = currentPlanetArray.concat(shortestPath);
                }
                
                return currentPlanetArray;
            }
        }
        else {
            return null;
        }
        
    }
    
    this.executeMove = function(planetDest) {
    
        if(planetDest instanceof Array) {
            if(this.currentDestination == null) {
                this.currentDestination = this.map.planets[planetDest[1]];
            }
        }
        else {
            this.currentDestination = planetDest;
        }
        
        var isPlayerAtDestination = this.players[this.currentPlayer].move(this.currentDestination, this.playerMoveIntervalId);
        
        if(isPlayerAtDestination instanceof Planet) {
            
            if(planetDest instanceof Array && planetDest.indexOf(isPlayerAtDestination.id) + 1 < planetDest.length) {
                this.currentDestination = this.map.planets[planetDest[planetDest.indexOf(isPlayerAtDestination.id) + 1]];
            }
            else {
                this.currentDestination = null;
                clearInterval(this.playerMoveIntervalId);
                this.updateCurrentPlanetInfo();
            }            
        }
        
        this.render();
    }
    
    this.selectPlanet = function(event) {
        
        var x = event.pageX - event.target.offsetLeft | event.offsetX;
        var y = event.pageY - event.target.offsetTop | event.offsetY;

        var planetFound;
        
        planetFound = this.map.searchPlanet(x, y);
        
        if(planetFound != null) {
            
            if(this.selectedPlanet != null && this.selectedPlanet != planetFound) {
                this.selectedPlanet.isSelected = false;
            }

            planetFound.isSelected = true;
        }
        else {
            if(this.selectedPlanet != null) {
                this.selectedPlanet.isSelected = false;
            }
        }
        
        if(this.selectedPlanet != null || planetFound != null) {
            this.render();
        }
        
        this.selectedPlanet = planetFound;
        
        this.updateCurrentPlanetInfo();
    }
    
    this.hoverPlanet = function(planetId, isHovering) {
        if(this.map.planets[planetId] != null) {
            this.map.planets[planetId].isHovering = isHovering;
            this.render();
        }
    }
    
    this.disableAllActions = function() {

        var actions = [
            { 'idt' : '#moveClassic', 'eventType' : 'click' },
            { 'idt' : '#moveTarget', 'eventType' : 'click' },
            { 'idt' : '#moveCurrent', 'eventType' : 'click' },
            { 'idt' : '#moveLabo', 'eventType' : 'click' },
            { 'idt' : '#fightAction', 'eventType' : 'click' },
            { 'idt' : '#buildAction', 'eventType' : 'click' },
            { 'idt' : '#createAction', 'eventType' : 'click' }
        ];

        this.disableActions(actions);
    }
    
    this.enableAllActions = function() {    
        this.enableClassicMoveAction();
        this.enableTargetMoveAction();
        this.enableCurrentMoveAction();
        this.enableLaboMoveAction();
        this.enableFightAction();
        this.enableBuildAction();
        this.enableCreateAction();
    }
    
    this.disableActions = function(actions) {
        for(var i = 0; i < actions.length; i++) {
            this.disableAction(actions[i].idt, actions[i].eventType);
        }
    }
    
    this.disableAction = function(idt, type) {
        $(idt).unbind(type).addClass('disable');
    }
    
    this.enableClassicMoveAction = function() {
        $('#moveClassic').unbind('click').click({engine : this}, function(event) { event.data.engine.movePlayer(); })
                         .removeClass('disable');
    }
    
    this.enableTargetMoveAction = function() {
        $('#moveTarget').unbind('click').click({engine : this}, function(event) { event.data.engine.movePlayerWithTargetResource(); })
                        .removeClass('disable');
    }
    
    this.enableCurrentMoveAction = function() {
        $('#moveCurrent').unbind('click').click({engine : this}, function(event) { event.data.engine.movePlayerWithCurrentResource(); })
                         .removeClass('disable');
    }
    
    this.enableLaboMoveAction = function() {
        $('#moveLabo').unbind('click').click({engine : this}, function(event) { event.data.engine.movePlayerByLabo(); })
                      .removeClass('disable');
    }
    
    this.enableFightAction = function() {
        $('#fightAction').unbind('click').click({engine : this}, function(event) { event.data.engine.playerFight(); })
                         .removeClass('disable');
    }

    this.enableBuildAction = function() {
        $('#buildAction').unbind('click').click({engine : this}, function(event) { event.data.engine.playerBuild(); })
                         .removeClass('disable');
    }
    
    this.enableCreateAction = function() {
        $('#createAction').unbind('click').click({engine : this}, function(event) { event.data.engine.playerCreateWeapon(); })
                          .removeClass('disable');
    }

    this.checkClassicMoveOk = function() {
        if(this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;

        var result = this.determinePathRecursivelyTo(this.getCurrentPlayer().planet, this.selectedPlanet, new Array());

        return this.getCurrentPlayer().planet.id != this.selectedPlanet.id && this.getCurrentPlayer().pa >= result.length - 1;
    }
    
    this.checkTargetMoveOk = function() {
        if(this.selectedPlanet == null || this.getCurrentPlayer() == null) return;
        
        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        return player.planet.id != this.selectedPlanet.id && player.pa > 0 && card != null;
    }
    
    this.checkCurrentMoveOk = function() {
        if(this.selectedPlanet == null || this.getCurrentPlayer() == null) return;

        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(player.planet.id);

        return player.planet.id != this.selectedPlanet.id && player.pa > 0 && card != null;
    }
    
    this.checkLaboMoveOk = function() {
        if(this.selectedPlanet == null || this.getCurrentPlayer() == null) return;

        var player = this.getCurrentPlayer();

        return player.planet.id != this.selectedPlanet.id && player.pa > 0 
            && player.planet.hasLaboratory && this.selectedPlanet.hasLaboratory        
    }
    
    this.checkFightActionOk = function() {
        if(this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;
        
        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        return player.planet.id == this.selectedPlanet.id && player.pa > 0 && this.selectedPlanet.threatLvl > 0 && card != null;
    }
    
    this.checkBuildActionOk = function() {
        if(this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;
        
        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        return player.planet.id == this.selectedPlanet.id && player.pa > 0 && !this.selectedPlanet.hasLaboratory 
            && this.currentNumLaboratory < Config.NUM_MAX_LABORATORY && (card != null || player.hasRole(Config.ROLE_ARCHITECT));
    }
    
    this.checkCreateActionOk = function(selectedCards) {
        
        var planet;
        
        for(var i = 0; i < selectedCards.length; i++) {
            planet = this.map.planets[selectedCards[i].value];
            if(planet.zone != this.selectedPlanet.zone) {
                return false;
            }
        }
        
        return (selectedCards.length == 5 || (this.getCurrentPlayer().hasRole(Config.ROLE_EXPERT) && selectedCards.length == 4)) 
                && this.getCurrentPlayer().pa > 0;
    }
    
    this.checkGiveActiontOk = function(planetID) {
        
        if(this.getCurrentPlayer() == null || this.getCurrentPlayer().planet.id == planetID) return false;
        
        var cardCurrentPlanet = this.getCurrentPlayer().inventory.getCardByValue(this.getCurrentPlayer().planet.id);
        
        return cardCurrentPlanet != false && this.getCurrentPlayer().pa > 0;
    }
    
    // Construit le modèle de la map grâce au JSON
    this.buildMapModel = function(map) {
        
        this.map = new Map();
        
        var planet;
        
        for(var i = 0; i < map.planets.length; i++) {
            planet = new Planet();
            planet.id = map.planets[i].id;
            planet.name = map.planets[i].name;
            planet.zone = map.planets[i].zone;
            planet.x = map.planets[i].pos.x;
            planet.y = map.planets[i].pos.y;
            
            for(var j = 0; j < map.relations.length; j++) {
                if(map.relations[j][0] == planet.id) {
                    planet.boundPlanets.push(map.relations[j][1]);
                }
                else if(map.relations[j][1] == planet.id) {
                    planet.boundPlanets.push(map.relations[j][0]);
                }
            }

            this.map.planets[planet.id] = planet;
        }
    }
    
    this.buildDecks = function() {
        var cardId = 0;
                
        for(var i in this.map.planets) {
            this.decks.information.addCard({"id" : cardId, "type" : Config.CARD_TYPE_PLANET, "value" : i});
            this.decks.invaders.addCard({"id" : cardId, "value" : i});

            cardId++;
        }
        
        this.decks.information.initializeOriginalCards();
        this.decks.invaders.initializeOriginalCards();
        
        this.decks.information.shuffle(10);
        this.decks.invaders.shuffle(10);
    }
    
    this.startGame = function() {
        this.currentPlayer = -1; // so the first player plays the first.
        this.newPlayerTurn();
    }
    
    this.newPlayerTurn = function() {
        
        clearInterval(this.tempoFlashInvadedPlanets);
        clearInterval(this.tempoInvasionPhaseInterval);
        
        $('#playerList .inventory li').removeClass('selected'); // clear the inventory selection
        
        this.map.unHoverPlanets();
        this.render();
        
        this.disableAllActions();
        
        // the next player is selected
        if(this.currentPlayer >= 0) {
            this.players[this.currentPlayer].isPlaying = false;
        }
        
        if(this.currentPlayer < this.players.length - 1) {
            this.currentPlayer++;
        }
        else { // if the turn is over, we start it again
            this.currentPlayer = 0;
            this.nbTurn++;
        }
        this.players[this.currentPlayer].isPlaying = true;
        
        // Give some cards to the player
        var giftCard;
        for(j = 0; j < Config.NUM_CARD_BY_TURN; j++) {
            giftCard = this.decks.information.removeCard("first");

            if(giftCard != false) {
                this.players[this.currentPlayer].inventory.addCard(giftCard);
            }
            else {
                this.triggerGameOver(); // game over, you loser
                return;
            }
        }
        
        this.players[this.currentPlayer].pa = Config.NUM_PA_TURN;
        
        this.updatePlayerList();
        this.updatePaView();
        
        // timer between two turns
        this.updateTimerWrapper("Début du tour dans");
        this.startTimer(Math.round(new Date().getTime() / 1000), Config.TIME_BETWEEN_TURN / 1000);
        this.tempoPlayerTurnInterval = setTimeout(function(that) { that.runPlayerTurn(); }, Config.TIME_BETWEEN_TURN + 1000, this);
    }
    
    this.runPlayerTurn = function() {
        clearInterval(this.tempoPlayerInterval);
        
        this.log("Début du tour.");
        this.enableAllActions();

        // start the timer for the turn
        this.updateTimerWrapper("Fin du tour dans");
        this.newTurnDate = Math.round(new Date().getTime() / 1000);
        this.startTimer(this.newTurnDate, Config.TURN_DURATION / 1000);
        
        this.playerTurnInterval = setTimeout(function(that) { that.runInvasionPhase(); }, Config.TURN_DURATION + 1000, this);
    }
    
    this.runInvasionPhase = function() {
        clearInterval(this.playerTurnInterval);
        
        this.stopTimer();
        this.updateTimerWrapper("PHASE D'INVASION");
        $('#timer span').html("");

        var attackedPlanetId, attackedPlanet;
        var attackedPlanets =  [];
        // increase the threat lvl
        for(var i = 0; i < Config.INVASION_SPEED_METER[this.currentInvasionSpeedIndex]; i++) {

            attackedPlanetId = this.decks.invaders.removeCard("first").value;
            attackedPlanet = this.map.planets[attackedPlanetId];
            if(attackedPlanet.threatLvl == 3) {
                // trigger a forced colonization
            }
            else {
                attackedPlanet.threatLvl = attackedPlanet.threatLvl + 1;
                attackedPlanet.isHovering = true;
                attackedPlanets.push(attackedPlanetId);
            }
        }

        this.makePlanetsFlash(attackedPlanets);
        
        this.tempoInvasionPhaseIntervalId = setTimeout(function(that) { that.newPlayerTurn(); }, Config.INVASION_PHASE_DURATION + 1000, this);
    }
    
    this.playerFight = function() {
        
        var player = this.players[this.currentPlayer];
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        if(this.checkFightActionOk()) {
            player.fight(this.selectedPlanet, card);
            this.updatePaView();
            this.updatePlayerList();
            this.updateCurrentPlanetInfo();
            this.render();
        }
    }
    
    this.playerCreateWeapon = function() {
        
        var selectedCards = [];
        var engine = this;
        $('#playerList .inventory li.selected').each(function() {
            selectedCards.push(engine.getCurrentPlayer().inventory.getCardByValue($(this).find('span').html()));
        });
        
        if(this.checkCreateActionOk(selectedCards)) {

            var planet;
            var cardsToRemove = [];
            for(i = 0; i < this.decks.invaders.cards.length; i++) {
                planet = this.map.planets[this.decks.invaders.cards[i].value];
                
                if(planet.zone == this.selectedPlanet.zone) {
                    cardsToRemove.push(this.decks.invaders.cards[i].id);
                }
            }
            
            for(i = 0; i < cardsToRemove.length; i++) {
                this.decks.invaders.removeCard(cardsToRemove[i], true);
            }
        
            this.getCurrentPlayer().createWeapon(selectedCards);
            this.weaponsFound[this.getCurrentPlayer().planet.zone] = true;
            this.updateWeaponsListView();
            this.updatePlayerList();
            this.updatePaView();
            this.checkForVictory();
            
            this.log("arme créée avec succès !");
        }
        else {
            this.log("Erreur - selectionner 5 GT de la même zone.");
            return false;
        }
    }
    
    this.playerBuild = function() {
        var player = this.players[this.currentPlayer];
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        if(this.checkBuildActionOk()) {

            player.buildLaboratory(this.selectedPlanet, card);
            this.currentNumLaboratory++;
            this.updatePaView();
            this.updatePlayerList();
            this.render();
        }
    }

    // rework : using drag'n'drop to perform the action will be better.
    this.playerGiftAction = function(playerTargetName, planetID) {

        var playerTarget = this.getPlayerByName(playerTargetName);

        if(this.getCurrentPlayer().planet.id == planetID || this.getCurrentPlayer().planet.id != playerTarget.planet.id) return;

        if(!this.getCurrentPlayer().hasRole(Config.ROLE_SPY)) {
            var cardCurrentPlanet = this.getCurrentPlayer().inventory.getCardByValue(this.getCurrentPlayer().planet.id);        
            if(!cardCurrentPlanet) return;
            this.getCurrentPlayer().inventory.removeCard(cardCurrentPlanet.id);
        }
        
        var cardGiven = this.getCurrentPlayer().inventory.getCardByValue(planetID);
        this.getCurrentPlayer().inventory.removeCard(cardGiven.id);
        this.getCurrentPlayer().pa--;
        playerTarget.inventory.addCard(cardGiven);
        
        this.updatePaView();
        setTimeout("SingletonEngine.engine.updatePlayerList()", 1); // mandatory to avoid bug
    }
    
    this.makePlanetsFlash = function(planets) {
        for(var i = 0; i < planets.length; i++) {
            this.map.planets[planets[i]].isHovering = !this.map.planets[planets[i]].isHovering;
        }
        
        this.render();
        
        this.tempoFlashInvadedPlanets = setTimeout(function(that, planets) { that.makePlanetsFlash(planets); }, 250,
                                                    this, planets);
    }
    
    this.startTimer = function(startDate, duration) {
        
        this.updateTimer(startDate, duration);
        
        clearInterval(this.timerIntervalId);     
        this.timerIntervalId = setInterval(function(that, dateStart, duration) { that.updateTimer(dateStart, duration); }, 1000, 
                                            this, 
                                            startDate,
                                            duration);        
    }
    
    this.stopTimer = function() {
        clearInterval(this.timerIntervalId);
    }
    
    this.updateTimer = function(dateStart, duration) {
        var currentTime = Math.round(new Date().getTime() / 1000);
        var counter = Math.max(0, dateStart + duration - currentTime);

        $('#timer span').html(counter+ '    s');
    }
    
    this.updateTimerWrapper = function(value) {
        var currentTimeView = $('#timer span');
        
        $('#timer').html(value + ' <span>' + currentTimeView.html() + '</span>');
    }
    
    this.updateCurrentPlanetInfo = function() {
        
        var div = $('#planet-info .alternative-content');
        var p = this.selectedPlanet;
        
        if(this.selectedPlanet != null) {
            
            this.checkClassicMoveOk() ? this.enableClassicMoveAction() : this.disableAction('#moveClassic', 'click');
            this.checkTargetMoveOk() ? this.enableTargetMoveAction() : this.disableAction('#moveTarget', 'click');
            this.checkCurrentMoveOk() ? this.enableCurrentMoveAction() : this.disableAction('#moveCurrent', 'click');
            this.checkLaboMoveOk() ? this.enableLaboMoveAction() : this.disableAction('#moveLabo', 'click');
            this.checkFightActionOk() ? this.enableFightAction() : this.disableAction('#fightAction', 'click');
            this.checkBuildActionOk() ? this.enableBuildAction() : this.disableAction('#buildAction', 'click');
            
            var selectedCards = [];
            var engine = this;
            $('#playerList .inventory li.selected').each(function() {
                selectedCards.push(engine.getCurrentPlayer().inventory.getCardByValue($(this).find('span').html()));
            });
            this.checkCreateActionOk(selectedCards) ? this.enableCreateAction() : this.disableAction('#createAction', 'click');
            
            
            $('.default-content').hide();
            var html = '<p>Nom : ' + p.name + '</p><p>Zone : ' + p.zone + '</p><p>Niveau de menace : ' + this.selectedPlanet.threatLvl + '</p>';
            div.find('.info').html(html);
            div.show();
        }
        else {
            div.hide();
            $('.default-content').show();
        }
    }
    
    this.triggerWin = function()  {
        clearInterval(this.timerIntervalId);
        clearInterval(this.playerMoveIntervalId);
        clearInterval(this.playerTurnInterval);
        clearInterval(this.timerIntervalId);
        clearInterval(this.tempoPlayerTurnInterval);
        clearInterval(this.tempoInvasionPhaseInterval);
        clearInterval(this.tempoFlashInvadedPlanets);
        
        $('#win').show();
    }
    
    this.checkForVictory = function() {
        if(this.zones['a'] == true && this.zones['b'] == true && this.zones['c'] == true && this.zones['d'] == true) {
            this.triggerWin();
        }
    }
    
    this.triggerGameOver = function() {
        clearInterval(this.timerIntervalId);
        clearInterval(this.playerMoveIntervalId);
        clearInterval(this.playerTurnInterval);
        clearInterval(this.timerIntervalId);
        clearInterval(this.tempoPlayerTurnInterval);
        clearInterval(this.tempoInvasionPhaseInterval);
        clearInterval(this.tempoFlashInvadedPlanets);
        
        $('#game-over').show();
    }
    
    this.updatePlayerList = function() {
        
        $('#playerList .inventory li').unbind('hover').unbind('click').draggable('destroy');
        $('#playerList li.player').droppable('destroy');
        
        var div = $('#playerList');
        div.html('');
        
        var tmpAdded;
        
        for(var i = 0; i < this.players.length; i++) {
            tmpAdded = $('<li class="player"><span>' + this.players[i].name + '</span></li>');
            
            if(this.players[i].isPlaying) {
                tmpAdded.addClass('isPlaying');
            }
            
            tmpAdded.append(this.getPlayerInventoryView(this.players[i]));
            
            div.append(tmpAdded) ;
        }
        
        var engine = this;
        
        $('#playerList .inventory li').hover(function() {
            engine.hoverPlanet($(this).children('span').html(), true);
        }, function() {
            engine.hoverPlanet($(this).children('span').html(), false);
        });
        
        $('#playerList .inventory li').click(function() {

            var playerName = $(this).parent().parent().parent().find('span').html();
            if(playerName == engine.getCurrentPlayer().name) {
                $(this).toggleClass('selected');
            }
        });

        $('#playerList li.player').each(function() {
           
            if(engine.getPlayerByName($(this).children('span').html()) == engine.getCurrentPlayer()) {

                $(this).find('.inventory li').draggable({
                                    			appendTo: "body",
                                                helper : "clone",
                                                cursor: "move",
                                                cursorAt: { top: -10, left: -20 },
                		                    });
            }
        });

        $('#playerList li.player').droppable({
                                    tolerance: 'pointer',
                        			drop: function(event, ui) {                  			    
                        			    var playerTarget = $(this).children('span').html(); // player target
                                        var planetID = ui.draggable.children('span').html(); // planet
                                        SingletonEngine.engine.playerGiftAction(playerTarget, planetID);
                        			}
                            });
    }
    
    this.getPlayerInventoryView = function(player) {

        var view = $('<div class="inventory"></div');
        var listView = $('<ul></ul>');
        var card;
        for(var i = 0; i < player.inventory.cards.length; i++) {
            card = player.inventory.cards[i];

            listView.append($('<li>Guide touristique de ' + this.map.planets[card.value].name + '<span>' + this.map.planets[card.value].id + '</span></li>'));
        }
        
        if(player.inventory.cards.length == 0) {
            view.append($("<p>Aucun guides touristique dans l'inventaire</p>"));
        }
        
        view.append(listView);        

        return view;
    }
    
    this.initializeInvasionSpeedMeterView = function() {
        
        var view = $('#invasionSpeedMeter');
        
        for(var i = 0; i < Config.INVASION_SPEED_METER.length; i++) {
            view.append('<p>' + Config.INVASION_SPEED_METER[i] +'</p>')
        }
    }
    
    this.updatePaView = function() {
        $('#paCounter span.currentValue').html(this.players[this.currentPlayer].pa);
    }
    
    this.updateInvasionSpeedMeterView = function() {
        
        $('#invasionSpeed span').html(Config.INVASION_SPEED_METER[this.currentInvasionSpeedIndex]);
        
        $('#invasionSpeedMeter p').removeClass('isSelected');
        $('#invasionSpeedMeter p').eq(this.currentInvasionSpeedIndex).addClass('isSelected');
    }
    
    this.updateWeaponsListView = function() {
        
        var counter = 0;
        for(var i in this.weaponsFound) {
            if(this.weaponsFound[i] == true) {
                $('#zone-'+i).addClass('isFound');
                counter++;
            }
        }
        
        $('#weaponsCounter span.currentValue').html(counter);
    }
    
    this.getPlayerByName = function(name) {
        for(var i = 0; i < this.players.length; i++) {
            if(this.players[i].name == name) {
                return this.players[i];
            }
        }
        
        return false;
    }
    
    this.getCurrentPlayer = function() {
        return this.players[this.currentPlayer];
    }
}
