function Engine() {
    
    this.logger = null;
    
    this.map = null;
    
    this.selectedPlanet = null;
    
    this.players = [];
    this.currentPlayer = 0;
    
    this.pirateCurrentSelection = null;
    
    this.nbTurns = 0;
    this.currentNumLaboratory = 0;
    this.numForcedColonization = 0;
    
    this.tutorialMode = false;
    this.treveMode = false;
    
    this.isGameOver = false;
    
    this.canvas = null;
    this.canvasContext = null;
    this.canvasBuffer = null;
    this.canvasBufferContenxt = null;
    
    this.playerMoveIntervalId = null;
    this.playerTurnInterval = null;
    this.timerIntervalId = null;
    this.tempoPlayerTurnInterval = null;
    this.tempoInvasionPhaseInterval = null;
    this.tempoFlashPlanets = [];
    
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
                this.loadResources(data);
            },
            context: this
        });
    }
    
    this.loadResources = function(data) {
        var resourceManager = new ResourceManager();
        resourceManager.loadImages(function(images) {
            SingletonEngine.engine.resources = images;
            SingletonEngine.engine.initializeGame(data);
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
        this.initializeBonusMalusCards(); // must be called after initializeInventories()
        this.updatePlayerList();
        
        this.initializeInvasion();
        
        this.initializeInvasionSpeedMeterView();
        this.updateInvasionSpeedMeterView();
        this.updateWeaponsListView();
        this.updateNumForcedColonizationView();
        
        this.render();
        
        // start all the game mechanics
        SingletonEngine.engine.startGame();
    }
    
    this.loadConfiguration = function(jsonObject) {
        
        for(var key in jsonObject.config) {
            Config[key] = jsonObject.config[key];
        }
    }
    
    this.log = function(log) {
        this.logger.logAction(log.value, log.author, log.timeBeforeLog, log.duration, log.sticky);
    }

    this.initializePlayers = function() {
        
        /* for debug DEBUG only */
        this.currentPlayer = 0;
        
        var mapID = 1, mapLaboID;
        
        if(!isNaN(parseInt(Config.START_MODE)) && Config.START_MODE > 0 && Config.START_MODE <= this.map.planets.length) {
            mapID = Config.START_MODE;
        }
        
        if(Config.START_MODE == "random") {
            mapID = Math.max(1,  Math.round(Math.random() * 1000) % this.map.planets.length);
        }
        
        mapLaboID = mapID; // if all the players start on the same planet, a  laboratory is built on this planet
        
        for(var i = 0; i < this.players.length; i++) {
            
            if(Config.START_MODE == "all_random") {
                mapID = Math.max(1,  Math.round(Math.random() * 1000) % this.map.planets.length);
            }
            
            this.players[i].planet = this.map.planets[mapID];
            this.players[i].x = this.map.planets[mapID].x;
            this.players[i].y = this.map.planets[mapID].y;

            this.players[i].resource = this.resources.roles[this.players[i].role.id];
        }
        
        if(Config.START_MODE == "all_random") {
            mapLaboID = Math.max(1,  Math.round(Math.random() * 1000) % this.map.planets.length);
        }
        
        this.map.planets[mapLaboID].hasLaboratory = true;
        this.currentNumLaboratory++;
    }
    
    this.addPlayer = function(playerName, playerRole) {
        
        var player = new Player();
        player.id = this.players.length;
        player.name = playerName;
        player.role = playerRole;

        this.players.push(player);
    }
    
    this.initializeInventories = function() {
        // 4 cards, one of each color
        var i, j;
        
        for(i = 0; i < this.players.length; i++) {
            for(j = 0; j < Config.NUM_CARD_START; j++) {
                this.players[i].inventory.addCard(this.decks.information.removeCard("first"));
            }
        }
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
    
    this.initializeBonusMalusCards = function() {
        this.intializeMassiveInvasionCards();
        this.initializeBonusCards();

        // special events cannot occured in the first turn # could be a bottleneck for performance...
        var condition = false;        
        while(!condition) {
            
            this.decks.information.shuffle(10);
            
            condition = true;
            for(i = 0; i < this.players.length*2; i+=2) {
                condition = condition && (this.decks.information.cards[i].type == Config.CARD_TYPE_PLANET
                                      && this.decks.information.cards[i+1].type == Config.CARD_TYPE_PLANET);
            }
        }
    }
    
    this.intializeMassiveInvasionCards = function() {

        var nextCardID = this.decks.information.cards.length;

        for(var i = 0; i < Config.NUM_MASSIVE_INVASION_CARDS; i++) {    
            this.decks.information.addCard({"id" : nextCardID, "type" : Config.CARD_TYPE_MASSIVE_INVASION, "value" : null});
            nextCardID++;
        }
    }
    
    this.initializeBonusCards = function() {
        
        var nextCardID = this.decks.information.cards.length;

        for(var key in Config.SPECIAL_EVENT) {
            this.decks.information.addCard({"id" : nextCardID, "type" : Config.CARD_TYPE_SPECIAL_EVENT, "value" : Config.SPECIAL_EVENT[key]});
            nextCardID++;
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
        
        var position = [];
        
        for(var i = 0; i < this.players.length; i++) {

            if(position[this.players[i].planet.id] == null) {
                position[this.players[i].planet.id] = 0;
            }
            
            position[this.players[i].planet.id]++;
            
            this.players[i].draw(this.canvasBufferContext, position[this.players[i].planet.id]);
        }
    }
    
    this.movePlayer = function() {
        
        var player;
        
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
            player = this.pirateCurrentSelection;
        }
        else {
            player = this.getCurrentPlayer();
        }
        
        if(this.selectedPlanet != null && this.selectedPlanet != player.planet) {
            
            if(player.planet.isBoundTo(this.selectedPlanet)) {            
                this.startMoveTo(player, this.selectedPlanet);
                this.getCurrentPlayer().pa--;                
            }
            else {   
                // look if the user can go recursively to the planet
                var result = this.determinePathRecursivelyTo(player.planet, this.selectedPlanet, new Array());
                if(result != null) {
                    this.startMoveTo(player, result);
                    this.getCurrentPlayer().pa = this.getCurrentPlayer().pa - (result.length - 1);
                }
            }

            this.updatePaView();
        }
    }
    
    this.movePlayerWithTargetResource = function() {

        var currentPlayer = this.getCurrentPlayer();
        var card = currentPlayer.inventory.getCardByValue(this.selectedPlanet.id);

        if(this.checkTargetMoveOk()) {

            currentPlayer.inventory.removeCard(card.id);
            currentPlayer.pa--;
            this.updatePaView();
            this.updatePlayerList();

            if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
                player = this.pirateCurrentSelection;
            }
            else {
                player = this.getCurrentPlayer();
            }
            
            this.startMoveTo(player, this.selectedPlanet);
        }
        
    }
    
    this.movePlayerWithCurrentResource = function() {

        var currentPlayer = this.getCurrentPlayer();
        
        var player;
        
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
            player = this.pirateCurrentSelection;
        }
        else {
            player = this.getCurrentPlayer();
        }        
        
        var card = currentPlayer.inventory.getCardByValue(player.planet.id);

        if(this.checkCurrentMoveOk()) {
            currentPlayer.inventory.removeCard(card.id);
            currentPlayer.pa--;
            this.updatePaView();
            this.updatePlayerList();
            
            this.startMoveTo(player, this.selectedPlanet);
        }        
    }
    
    this.movePlayerByLabo = function() {
        
        var currentPlayer = this.getCurrentPlayer();
        var card = currentPlayer.inventory.getCardByValue(this.selectedPlanet.id);
        
        if(this.checkLaboMoveOk()) {
            currentPlayer.pa--;
            this.updatePaView();
            this.updatePlayerList();
            
            if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
                player = this.pirateCurrentSelection;
            }
            else {
                player = this.getCurrentPlayer();
            }
            
            this.startMoveTo(player, this.selectedPlanet);
        }        
    }
    
    this.startMoveTo = function(player, planet) {
        this.playerMoveIntervalId = setInterval(function(that, player, dest) { that.executeMove(player, dest); }, 
                                    Config.moveInterval, 
                                    this,
                                    player,
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
    
    this.executeMove = function(player, planetDest) {
    
        if(planetDest instanceof Array) {
            if(this.currentDestination == null) {
                this.currentDestination = this.map.planets[planetDest[1]];
            }
        }
        else {
            this.currentDestination = planetDest;
        }
        
        var isPlayerAtDestination = player.move(this.currentDestination, this.playerMoveIntervalId);
        
        if(isPlayerAtDestination instanceof Planet) {
            
            if(planetDest instanceof Array && planetDest.indexOf(isPlayerAtDestination.id) + 1 < planetDest.length) {
                this.currentDestination = this.map.planets[planetDest[planetDest.indexOf(isPlayerAtDestination.id) + 1]];
            }
            else {
                
                if(this.getCurrentPlayer().hasRole(Config.ROLE_BRUTE)) {
                    if(this.weaponsFound[this.currentDestination.zone] && this.currentDestination.threatLvl > 0) {
                        this.currentDestination.threatLvl = 0;
                    }
                }
                
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
        if(!this.isPlayerTurnRunning() || this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;
        
        var player;
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
            player = this.pirateCurrentSelection;
        }
        else {
            player = this.getCurrentPlayer();
        }

        var result = this.determinePathRecursivelyTo(player.planet, this.selectedPlanet, new Array());

        return player.planet.id != this.selectedPlanet.id && this.getCurrentPlayer().pa >= result.length - 1;
    }
    
    this.checkTargetMoveOk = function() {
        if(!this.isPlayerTurnRunning() || this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;
        
        var player;
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
            player = this.pirateCurrentSelection;
        }
        else {
            player = this.getCurrentPlayer();
        }
                
        var card = this.getCurrentPlayer().inventory.getCardByValue(this.selectedPlanet.id);
        
        return player.planet.id != this.selectedPlanet.id && this.getCurrentPlayer().pa > 0 && card != null;
    }
    
    this.checkCurrentMoveOk = function() {
        if(!this.isPlayerTurnRunning() || this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;

        var player; 
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
            player = this.pirateCurrentSelection;
        }
        else {
            player = this.getCurrentPlayer();
        }
        
        var card = this.getCurrentPlayer().inventory.getCardByValue(player.planet.id);

        return player.planet.id != this.selectedPlanet.id && this.getCurrentPlayer().pa > 0 && card != null;
    }
    
    this.checkLaboMoveOk = function() {
        if(!this.isPlayerTurnRunning() || this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;

        var player;
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE) && this.pirateCurrentSelection != null) {
            player = this.pirateCurrentSelection;
        }
        else {
            player = this.getCurrentPlayer();
        }

        return player.planet.id != this.selectedPlanet.id && this.getCurrentPlayer().pa > 0 
            && player.planet.hasLaboratory && this.selectedPlanet.hasLaboratory        
    }
    
    this.checkFightActionOk = function() {
        if(!this.isPlayerTurnRunning() || this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;
        
        var player = this.getCurrentPlayer();
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        return player.planet.id == this.selectedPlanet.id && player.pa > 0 && this.selectedPlanet.threatLvl > 0 
               && (card != null || player.hasRole(Config.ROLE_BRUTE));
    }
    
    this.checkBuildActionOk = function() {
        if(!this.isPlayerTurnRunning() || this.selectedPlanet == null || this.getCurrentPlayer() == null) return false;
        
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
                && this.getCurrentPlayer().pa > 0 && this.isPlayerTurnRunning();
    }
    
    this.checkGiveActiontOk = function(planetID) {
        
        if(!this.isPlayerTurnRunning() || this.getCurrentPlayer() == null || this.getCurrentPlayer().planet.id == planetID) return false;
        
        var cardCurrentPlanet = this.getCurrentPlayer().inventory.getCardByValue(this.getCurrentPlayer().planet.id);
        
        return cardCurrentPlanet != false && this.getCurrentPlayer().pa > 0;
    }
    
    // Construit le modèle de la map grâce au JSON
    this.buildMapModel = function(map) {
        
        this.map = new Map();
        this.map.resource = this.resources.map;
        
        var planet, random, t;
        
        for(var i = 0; i < map.planets.length; i++) {
            planet = new Planet();
            planet.id = map.planets[i].id;
            planet.name = map.planets[i].name;
            planet.zone = map.planets[i].zone;
            planet.x = map.planets[i].pos.x;
            planet.y = map.planets[i].pos.y;

            random = Math.max(1, Math.round(Math.random() * 1000) % 10);

            planet.resource = this.resources.planets[random+'-'+planet.zone];
            
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
        
        if(this.modeTutorial == true) {
            this.log(Config.MESS.TUTO_START);
            this.log(Config.MESS.TUTO_EXPL_A);
            this.log(Config.MESS.TUTO_EXPL_B);
            this.log(Config.MESS.TUTO_EXPL_C);
            this.log(Config.MESS.TUTO_EXPL_D);
            this.log(Config.MESS.TUTO_EXPL_E);
        }
        else {
            this.log(Config.MESS.START);
        }
    }
    
    this.newPlayerTurn = function() {

        if(this.isGameOver) return;
        
        // reset the timers
        this.resetPlanetFlashTimer();        
        this.tempoInvasionPhaseInterval = null;
        
        $('#playerList .inventory li').removeClass('selected'); // clear the inventory selection
        
        this.map.removePlanetHighlights();

        this.render();
        
        this.disableAllActions();
        
        // the next player is selected
        if(this.currentPlayer >= 0) {
            this.players[this.currentPlayer].isPlaying = false;
        }
        
        this.nbTurns++;

        if(this.currentPlayer < this.players.length - 1) {
            this.currentPlayer++;
        }
        else { // if the turn is over, we start it again
            this.currentPlayer = 0;
        }

        this.players[this.currentPlayer].isPlaying = true;

        // Give some cards to the player
        var giftCard;
        var cardsGiven = [];
        for(j = 0; j < Config.NUM_CARD_BY_TURN; j++) {
            giftCard = this.decks.information.removeCard("first");

            if(giftCard != false) {
                if(giftCard.type == Config.CARD_TYPE_PLANET) {
                    this.players[this.currentPlayer].inventory.addCard(giftCard);
                    cardsGiven.push(giftCard.value);
                }
                else if(giftCard.type == Config.CARD_TYPE_MASSIVE_INVASION) {
                    this.triggerMassiveInvasion();
                }
                else if(giftCard.type == Config.CARD_TYPE_SPECIAL_EVENT) {

                    switch(giftCard.value) {
                        case Config.SPECIAL_EVENT.FRIENDLY_FIRE:
                            this.runSpecialEventFriendlyFire();
                            break;
                        case Config.SPECIAL_EVENT.TREVE:
                            this.runSpecialEventTreve();
                            break;
                        case Config.SPECIAL_EVENT.COUNTER_SPY:
                            this.runSpecialEventCounterSpy();
                            break;
                    }
                }
            }
            else {
                this.triggerGameOver(); // game over, you loser
                return;
            }
        }

        this.makePlanetsFlash(cardsGiven, Config.FLASH_TYPE.INFORMATION_GIVEN);
        
        if(this.debug != true) {
            this.players[this.currentPlayer].pa = Config.NUM_PA_TURN;
        }
        else {
            this.players[this.currentPlayer].pa = 99;
        }
        
        this.updatePlayerList();
        this.updatePaView();
        
        var durationBetweenTurn = Config.TIME_BETWEEN_TURN;
        // for the first turn, the times are increased
        if(this.nbTurns == 1) {
            durationBetweenTurn += Config.FIRST_TURN_PREPARATION_DURATION;
            
            // if the tutorial mode is enable, we also add time
            if(this.tutorialMode == true) {
                durationBetweenTurn += Config.TUTORIAL.TIME.TIMER_BETWEEN_TURN;
            }
        }

        // timer between two turns
        this.updateTimerWrapper("Début du tour dans");
        this.startTimer(Math.round(new Date().getTime() / 1000), durationBetweenTurn / 1000);
        this.tempoPlayerTurnInterval = setTimeout(function(that) { that.runPlayerTurn(); }, durationBetweenTurn + 1000, this);
    }
    
    this.triggerMassiveInvasion = function() {
        if(this.currentInvasionSpeedIndex + 1 < Config.INVASION_SPEED_METER.length) {
            this.currentInvasionSpeedIndex++;
            
            var planetID = this.decks.invaders.removeCard("first").value;
            this.map.planets[planetID].threatLvl = 3;
            
            this.makePlanetsFlash([planetID], Config.FLASH_TYPE.PLANET_MASSIVELY_INVADED);
            
            this.decks.invaders.restore();
        }
        
        this.updateInvasionSpeedMeterView();
        this.render();
    }
    
    this.runPlayerTurn = function() {
        
        if(this.isGameOver) return;

        // reset the timers
        this.resetPlanetFlashTimer();
        this.tempoPlayerTurnInterval = null;
        
        this.map.removePlanetHighlights();
        this.render();
        
        $('#passTurn').click(function() {
            SingletonEngine.engine.runInvasionPhase();
        });

        var realTurnDuration = Config.TURN_DURATION;
        if(this.getCurrentPlayer().planet.threatLvl > 0) {
            realTurnDuration = realTurnDuration - Config.TIME_REDUCTION_BY_THREAT_LVL * this.getCurrentPlayer().planet.threatLvl;
        }
        
        var turnDuration = realTurnDuration;
        // for the first turn, the times are increased
        if(this.nbTurns == 1) {
            this.log(Config.MESS.TUTO_EXPL_G);
        }
        if(this.nbTurns == 1 || this.nbTurns == 2 || this.nbTurns == 3) {
            // if it is the first turn of each player, the turn duration is not decreased by the threat lvl
            turnDuration = Config.TURN_DURATION;
            if(this.tutorialMode == true && this.nbTurns == 1) {
                turnDuration += Config.TUTORIAL.TIME.TURN_DURATION;
            }
        }

        // start the timer for the turn
        this.updateTimerWrapper("Fin du tour dans");
        this.newTurnDate = Math.round(new Date().getTime() / 1000);
        this.startTimer(this.newTurnDate, turnDuration / 1000);
        
        this.playerTurnInterval = setTimeout(function(that) { that.runInvasionPhase(); }, turnDuration + 1000, this);
        
        this.updateCurrentPlanetInfo(); // to enable available actions
    }
    
    this.runInvasionPhase = function() {
        
        if(this.isGameOver) return;

        clearTimeout(this.playerTurnInterval);
        this.playerTurnInterval = null; // reset the timer
        
        this.updateCurrentPlanetInfo(); // to keep players from doing anything
        
        $('#passTurn').unbind('click'); // prevent player from passing a turn here
        
        // we clear the player selection handler if the current plauyer is a pirate
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE)) {
            $('#playerList li.player span').unbind('click');
            this.pirateCurrentSelection = null;
             $('#playerList li.player').removeClass('selected');
        }
        
        this.stopTimer();
        this.updateTimerWrapper("PHASE D'INVASION");
        $('#timer span').html("");

        if(!this.treveMode) {
            var attackedPlanetId, attackedPlanet;
            var attackedPlanets =  [];
            var colonizedPlanets = [];
            var temp;
            // increase the threat lvl
            for(var i = 0; i < Config.INVASION_SPEED_METER[this.currentInvasionSpeedIndex]; i++) {

                attackedPlanetId = this.decks.invaders.removeCard("first").value;
                this.doAttackPlanet(attackedPlanetId, colonizedPlanets, attackedPlanets);
            }

            this.makePlanetsFlash(attackedPlanets, Config.FLASH_TYPE.PLANET_UNDER_ATTACK);
            this.makePlanetsFlash(colonizedPlanets, Config.FLASH_TYPE.PLANET_COLONIZED);
        }
        else {
            this.treveMode = false;
        }
        
        var invasionPhaseDuration = Config.INVASION_PHASE_DURATION;
        // for the first turn, the times are increased
        if(this.nbTurns == 1) {
            this.log(Config.MESS.TUTO_EXPL_F);
        }

        if(this.tutorialMode == true && this.nbTurns == 1) {
            invasionPhaseDuration+= Config.TUTORIAL.TIME.INVASION_PHASE_DURATION;
        }

        this.tempoInvasionPhaseInterval = setTimeout(function(that) { that.newPlayerTurn(); }, invasionPhaseDuration + 1000, this);
    }
    
    this.forcedColonization = function(rootPlanet, colonizedPlanets, attackedPlanets) {
        
        this.numForcedColonization++;
        colonizedPlanets.push(rootPlanet.id);
        this.updateNumForcedColonizationView();

        if(this.numForcedColonization >= Config.NUM_FORCED_COLONIZATION_MAX) {
            this.triggerGameOver();
            return;
        }
        
        for(var i = 0; i < rootPlanet.boundPlanets.length; i++) {
            this.doAttackPlanet(rootPlanet.boundPlanets[i], colonizedPlanets, attackedPlanets);
        }
    }
    
    this.doAttackPlanet = function(attackedPlanetId, colonizedPlanets, attackedPlanets) {
        attackedPlanet = this.map.planets[attackedPlanetId];
        
        var isProtected = false;
        var protectorName = null;
        for(var p in this.players && !isProtected) {
           if(this.players[p].planet.id == attackedPlanetId && this.players[p].hasRole(Config.ROLE_SHIELD)) {
               isProtected = true;
               protectorName = this.players[p].name;
           }
        }
        
        if(!isProtected) {
            if(attackedPlanet.threatLvl == 3) {
                // trigger a forced colonization
                var parsedPlanets = [];
                if(colonizedPlanets.indexOf(attackedPlanet.id) == -1) {
                    this.forcedColonization(attackedPlanet, colonizedPlanets, attackedPlanets);
                }
            }
            else {                
                attackedPlanet.threatLvl = attackedPlanet.threatLvl + 1;
                attackedPlanets.push(attackedPlanetId);
            }
        }
        else {
            var message = { value : attackedPlanet.name + ' attaquée mais protégée par la présence de ' + protectorName + ' (rôle Bouclier)' };
            this.log(message);
        }
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
            this.weaponsFound[this.selectedPlanet.zone] = true;
            this.updateWeaponsListView();
            this.updatePlayerList();
            this.updatePaView();
            this.checkForVictory();
            
            var message = { value : "L'arme de la zone " + this.selectedPlanet.zone + "a été créée avec succès !" };
            this.log(message);
        }
        else {
            var message = { value : "Vous devez sélectionner 5 (ou 4 si vous êtes un expert en armement) guides touristiques de la même zone." };
            this.log(message);
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
            this.updateCurrentPlanetInfo();
            this.render();
        }
    }

    // rework : using drag'n'drop to perform the action will be better.
    this.playerGiftAction = function(playerTargetName, planetID) {

        var playerTarget = this.getPlayerByName(playerTargetName);

        if(this.checkGiveActiontOk(planetID)) {

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
    }
    
    this.runSpecialEventCounterSpy = function() {
        var planetList = "";
        var z = 0;
        var planetID;
        while(z < Config.COUNTER_SPY_NUM_CARDS) {
            planetID = this.decks.invaders.cards[z].value;
            planetList = planetList + this.map.planets[planetID].name  + ", ";
            z++;
        }
        
        planetList = planetList.substr(0, planetList.length - 2);
        var message = { value : "Contre-espagionage. Les " + Config.COUNTER_SPY_NUM_CARDS + " prochaines cibles sont : " + planetList + "." };
        this.log(message);
    }
    
    this.runSpecialEventTreve = function() {
        this.treveMode = true;
        
        var message = { value : "Trêve du confiseur. Pas de phase d'invasion à la fin du tour." };
        this.log(message);
    }
    
    this.runSpecialEventFriendlyFire = function() {
        
        var parsedPlanets = [];
        var boundPlanetID;
        
        for(var i = 1; i < this.map.planets.length; i++) {
            for(var j = 1; j < this.map.planets[i].boundPlanets.length; j++) {

                if(this.map.planets[i].zone != this.map.planets[this.map.planets[i].boundPlanets[j]].zone) {
                    if(parsedPlanets.indexOf(this.map.planets[i].id) == -1) {
                        this.map.planets[i].threatLvl = Math.max(0, this.map.planets[i].threatLvl - 1);
                        parsedPlanets.push(this.map.planets[i].id);
                    }
                    
                    boundPlanetID = this.map.planets[i].boundPlanets[j];
                    
                    if(parsedPlanets.indexOf(boundPlanetID) == -1) {
                        this.map.planets[boundPlanetID].threatLvl = Math.max(0, this.map.planets[boundPlanetID].threatLvl - 1);
                        parsedPlanets.push(boundPlanetID);
                    }
                }
            }
        }

        this.makePlanetsFlash(parsedPlanets, Config.FLASH_TYPE.PLANET_UNDER_ATTACK);
        
        var message = { value : "Evénement spécial : feu allié. Les planètes adjacentes de zones différentes voient leur niveau de menace baisser." };
        this.log(message);
    }
    
    this.makePlanetsFlash = function(planets, type) {

        for(var i = 0; i < planets.length; i++) {
            if(type == Config.FLASH_TYPE.PLANET_UNDER_ATTACK) {
                this.map.planets[planets[i]].isUnderAttack = !this.map.planets[planets[i]].isUnderAttack;
            }
            else if(type == Config.FLASH_TYPE.PLANET_COLONIZED) {
                this.map.planets[planets[i]].isColonizedByForce = !this.map.planets[planets[i]].isColonizedByForce;
            }
            else if(type == Config.FLASH_TYPE.PLANET_MASSIVELY_INVADED) {
                this.map.planets[planets[i]].isMassivelyInvaded = !this.map.planets[planets[i]].isMassivelyInvaded;
            }
            else if(type == Config.FLASH_TYPE.INFORMATION_GIVEN) {
                this.map.planets[planets[i]].isGivenToPlayer = !this.map.planets[planets[i]].isGivenToPlayer;
            }
        }
        
        this.render();
        
        this.tempoFlashPlanets[type+Math.random()] = setTimeout(function(that, planets, type) { that.makePlanetsFlash(planets, type); }, 250,
                                                    this, planets, type);
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
        this.isGameOver = true;
        
        clearInterval(this.playerMoveIntervalId); this.playerMoveIntervalId = null;
        clearInterval(this.timerIntervalId); this.timerIntervalId = null;
        
        clearTimeout(this.playerTurnInterval); this.playerTurnInterval = null;
        clearTimeout(this.tempoPlayerTurnInterval); this.tempoPlayerTurnInterval = null;
        clearTimeout(this.tempoInvasionPhaseInterval); this.tempoInvasionPhaseInterval = null;
        
        this.resetPlanetFlashTimer();

        $('#win').show();
    }
    
    this.checkForVictory = function() {
        if(this.weaponsFound['a'] == true && this.weaponsFound['b'] == true && 
           this.weaponsFound['c'] == true && this.weaponsFound['d'] == true) {
            this.triggerWin();
        }
    }
    
    this.triggerGameOver = function() {
        this.isGameOver = true;
        
        clearInterval(this.playerMoveIntervalId); this.playerMoveIntervalId = null;
        clearInterval(this.timerIntervalId); this.timerIntervalId = null;
        
        clearTimeout(this.playerTurnInterval); this.playerTurnInterval = null;
        clearTimeout(this.tempoPlayerTurnInterval); this.tempoPlayerTurnInterval = null;
        clearTimeout(this.tempoInvasionPhaseInterval); this.tempoInvasionPhaseInterval = null;
        
        this.resetPlanetFlashTimer();

        console.debug(this.nbTurns);

        $('#game-over').show();
    }
    
    this.updatePlayerList = function() {
        
        $('#playerList .inventory li').unbind('hover').unbind('click').draggable('destroy');
        $('#playerList li.player').droppable('destroy');
        
        var div = $('#playerList');
        div.html('');
        
        var tmpAdded;
        
        for(var i = 0; i < this.players.length; i++) {
            tmpAdded = $('<li class="player"><span>' + this.players[i].name + '</span> <div class="player-role"></div></li>');

            tmpAdded.children('.player-role').append(this.players[i].resource);
            
            if(this.players[i].isPlaying) {
                tmpAdded.addClass('isPlaying');
            }
            
            if(this.pirateCurrentSelection == this.players[i]) {
                tmpAdded.addClass('selected');
            }
            
            tmpAdded.append('<div class="inventory"></div');
            tmpAdded.children('.inventory').append('<p class="role">'+this.players[i].role.label+'</p>');
            tmpAdded.children('.inventory').append(this.getPlayerInventoryView(this.players[i]));

            div.append(tmpAdded);
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
                engine.updateCurrentPlanetInfo();
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
                            
        if(this.getCurrentPlayer().hasRole(Config.ROLE_PIRATE)) {
            // add the click handler
            $('#playerList li.player span').each(function() {
                if($(this).html() != SingletonEngine.engine.getCurrentPlayer().name) {
                    $(this).click(function() {
                        var player = SingletonEngine.engine.getPlayerByName($(this).html());

                         $('#playerList li.player').removeClass('selected');

                        if(SingletonEngine.engine.pirateCurrentSelection == player) {
                            SingletonEngine.engine.pirateCurrentSelection = null;
                        }
                        else {
                            SingletonEngine.engine.pirateCurrentSelection = player;
                            $(this).parent().addClass('selected');
                        }
                    });
                }
            });
        }
    }
    
    this.getPlayerInventoryView = function(player) {

        var listView = $('<ul></ul>');
        var card;
        var color;
        for(var i = 0; i < player.inventory.cards.length; i++) {
            card = player.inventory.cards[i];

            color = this.map.planets[card.value].zone;

            listView.append($('<li>Guide touristique de ' + this.map.planets[card.value].name + '<span>' + this.map.planets[card.value].id + '</span><div class="colorZone ' + this.map.planets[card.value].zone + '"></div</li>'));
        }
        
        if(player.inventory.cards.length == 0) {
            view.append($("<p>Aucun guides touristique dans l'inventaire</p>"));
        }

        return listView;
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
    
    this.updateNumForcedColonizationView = function() {
        $('#forcedColonization span.currentValue').html(this.numForcedColonization);
        $('#forcedColonization span.maxValue').html(Config.NUM_FORCED_COLONIZATION_MAX);
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
    
    this.isInvasionPhaseRunning = function() {
        return this.tempoInvasionPhaseInterval != null;
    }
    
    this.isPlayerTurnRunning = function() {
        return this.playerTurnInterval != null;
    }
    
    this.isPlayerPreTurnRunning = function() {
        return this.tempoPlayerTurnInterval != null;
    }
    
    this.resetPlanetFlashTimer = function() {
        // reset the timers
        for(var i in this.tempoFlashPlanets) {
            clearTimeout(this.tempoFlashPlanets[i]);
            this.tempoFlashPlanets[i] = null;
        }
    }
}