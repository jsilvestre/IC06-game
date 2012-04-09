var Config = {
    
    TURN_DURATION : 5000,  // durée d'un tour en ms
    TIME_BETWEEN_TURN : 5000, // durée entre deux tours
    INVASION_PHASE_DURATION : 5000, // durée de la phase d'invasion    
    
    moveInterval : 25, // l'interval entre deux tick pour le déplacement en ms
    moveTime : 1500, // le temps qu'un déplacement doit durer en ms
    
    LIMIT_DRAW_VERTICAL : 50, // le nombre de px minimum entre deux planètes liées (pour la liaison classique)
    
    PLANET_HITBOX : 30,
    
    CARD_TYPE_PLANET : "planet",
    CARD_TYPE_SPECIAL_EVENT : "specialevent",
    CARD_TYPE_MASSIVE_INVASION : "massiveincasion",
    
    NUM_ZONES : 4, // nombre de zones de jeu
    
    NUM_CARD_START : 3,
    NUM_CARD_BY_TURN : 2, // nombre de cartes données par tour à un joueur
    
    NUM_PA_TURN : 4, // nombre de PA par tour
    
    NUM_PLANET_INITIAL_INVASION : 3, // nombre de planète envahi à chaque round d'invasion au début de la partie
    
    INVASION_SPEED_METER : [2, 2, 3, 3, 4, 4], // jauge de vitesse d'invasion
    
    NUM_MAX_LABORATORY : 5, // nombre max de laboratoire dans une partie
};

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
        this.logger.view = $('#logger');
            
        this.buildMapModel(jsonObject);
        this.buildDecks();
        
        this.log("Map has been loaded.");
        
        this.canvas = $('#map');
        this.canvasContext = this.canvas[0].getContext('2d');
        
        this.canvasBuffer = document.createElement('canvas');
        this.canvasBuffer.width = this.canvas.width();
        this.canvasBuffer.height = this.canvas.height();
        this.canvasBufferContext = this.canvasBuffer.getContext('2d');
        
        this.currentDestination = null; // utiliser pour les déplacements traversant plusieurs planètes
        
        this.initializePlayers();
        this.initializeInventories();
        this.updatePlayerList();
        
        this.initializeInvasion();
        
        this.initializeInvasionSpeedMeterView();
        this.updateInvasionSpeedMeterView();
        
        this.render();
        
        this.log("Game is ready.");
    }
    
    this.log = function(string) {
        this.logger.logAction(string);
    }
    
    this.initializePlayers = function() {
        var player = new Player();
        player.id = 0;
        player.name = "Joseph";
        player.planet = this.map.planets[4];
        player.x = player.planet.x;
        player.y = player.planet.y;                       
        this.players.push(player);
    
        player = new Player();
        player.id = 1;
        player.name = "Player2";
        player.planet = this.map.planets[2];
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
        
        this.log("Players have been created.");
    }
    
    this.initializeInventories = function() {
        // 4 cards, one of each color
        var i, j;
        
        for(i = 0; i < this.players.length; i++) {
            for(j = 0; j < Config.NUM_CARD_START; j++) {
                this.players[i].inventory.addCard(this.decks.information.removeCard("first"));
            }
        }
        
        this.log("Cards have been distributed.");
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
            }
            else {   
                // look if the user can go recursively to the planet
                var result = this.determinePathRecursivelyTo(this.players[this.currentPlayer].planet, this.selectedPlanet, new Array());
                if(result != null) {
                    this.startMoveTo(this.players[this.currentPlayer], result);
                }
            }
            
            this.log(this.players[this.currentPlayer].name + " has moved to " + this.selectedPlanet.name);
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
        
        this.map.unHoverPlanets();
        this.render();
        
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
        
        this.log(this.players[this.currentPlayer].name + "'s turn has started.");

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
        
        if(player.planet.id == this.selectedPlanet.id && player.pa > 0 && this.selectedPlanet.threatLvl > 0
            && card != null) {        
            player.fight(this.selectedPlanet);
            player.inventory.removeCard(card.id);
            this.updatePaView();
            this.updatePlayerList();
            this.render();
        }
    }
    
    this.playerBuild = function() {
        var player = this.players[this.currentPlayer];
        var card = player.inventory.getCardByValue(this.selectedPlanet.id);
        
        if(player.planet.id == this.selectedPlanet.id && player.pa > 0 && !this.selectedPlanet.hasLaboratory 
            && this.currentNumLaboratory < Config.NUM_MAX_LABORATORY && card != null) {

            player.buildLaboratory(this.selectedPlanet);
            player.inventory.removeCard(card.id);
            this.currentNumLaboratory++;
            this.updatePaView();
            this.updatePlayerList();
            this.render();
        }
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
            $('.default-content').hide();
            var html = '<p>Nom : ' + p.name + '</p><p>Zone : ' + p.zone + '</p>';
            div.find('.info').html(html);
            div.show();
        }
        else {
            div.hide();
            $('.default-content').show();
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
        
        $('#playerList .inventory li').unbind('hover');
        
        var div = $('#playerList');
        div.html('');
        
        var tmpAdded;
        
        for(var i = 0; i < this.players.length; i++) {
            tmpAdded = $('<li><span>' + this.players[i].name + '</span></li>');
            
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
    }
    
    this.getPlayerInventoryView = function(player) {

        var view = $('<div class="inventory"></div');
        var listView = $('<ul></ul>');
        var card;
        for(var i = 0; i < player.inventory.cards.length; i++) {
            card = player.inventory.cards[i];
            listView.append($('<li>Guide touristique de ' + this.map.planets[card.value].name + '<span>' + this.map.planets[card.value].id + '</span></li>'));
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
}