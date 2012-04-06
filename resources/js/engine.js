var Config = {
    
    TURN_DURATION : 10000,  // durée d'un tour en ms
    TIME_BETWEEN_TURN : 5000, // durée entre deux tours
    
    moveInterval : 25, // l'interval entre deux tick pour le déplacement en ms
    moveTime : 1500, // le temps qu'un déplacement doit durer en ms
    
    LIMIT_DRAW_VERTICAL : 50, // le nombre minimum entre deux planètes liés en px (pour la liaison classique)
    
    PLANET_HITBOX : 30,
    
    CARD_TYPE_PLANET : "planet",
    CARD_TYPE_SPECIAL_EVENT : "specialevent",
    CARD_TYPE_MASSIVE_INVASION : "massiveincasion",
};

function Engine() {
    
    this.logger = null;
    
    this.map = {
        "view" : null,
        "planets" : []
    };
    
    this.selectedPlanet = null;
    
    this.players = [];
    this.currentPlayer = 0;
    
    this.nbTurns = 0;
    
    this.canvas = null;
    this.canvasContext = null;
    this.canvasBuffer = null;
    this.canvasBufferContenxt = null;
    
    this.playerMoveIntervalId = null;
    this.gameTurnIntervalId = null;
    this.timerIntervalId = null;
    this.tempoPlayerTurnInterval = null;
    
    this.newTurnDate = null;
    
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
        
        this.log("Map has been loaded.");
        
        this.canvas = $('#map');
        this.canvasContext = this.canvas[0].getContext('2d');
        
        this.canvasBuffer = document.createElement('canvas');
        this.canvasBuffer.width = this.canvas.width();
        this.canvasBuffer.height = this.canvas.height();
        this.canvasBufferContext = this.canvasBuffer.getContext('2d');
        
        this.map.view = new Map();
        this.map.view.initialize(this.map.planets);
        
        this.currentDestination = null; // utiliser pour les déplacements traversant plusieurs planètes
        
        this.initializePlayers();       
        
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
        player.inventory.addCard(this.decks.information.removeCard(0));
        player.inventory.addCard(this.decks.information.removeCard(1));
        player.inventory.addCard(this.decks.information.removeCard(2));
        player.inventory.addCard(this.decks.information.removeCard(3));                        
        this.players.push(player);
    
        player = new Player();
        player.id = 1;
        player.name = "Player2";
        player.planet = this.map.planets[2];
        player.x = player.planet.x;
        player.y = player.planet.y;
        player.inventory.addCard(this.decks.information.removeCard(4));
        this.players.push(player);
        
        
        player = new Player();
        player.id = 2;
        player.name = "Player3";
        player.planet = this.map.planets[3];
        player.x = player.planet.x;
        player.y = player.planet.y;
        player.inventory.addCard(this.decks.information.getCard(5));
        player.inventory.addCard(this.decks.information.getCard(6));
        this.players.push(player);
        
        this.currentPlayer = 0;
        
        this.updatePlayerList();
        
        this.log("Players have been created.");
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
        this.map.view.draw(this.canvasBufferContext);
    }
    
    // Exécute le rendu de la vue des joueurs
    this.renderPlayers = function() {
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].draw(this.canvasBufferContext);
        }        
    }
    
    this.movePlayer = function() {
        if(this.selectedPlanet != null) {
            
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
        
        planetFound = this.map.view.searchPlanet(x, y);
        
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
    
    // Construit le modèle de la map grâce au JSON
    this.buildMapModel = function(map) {
        
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
        
        this.buildDecks();
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
        
        clearInterval(this.gameTurnIntervalId);
        
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
        
        this.updatePlayerList();
        
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
        
        this.gameTurnIntervalId = setTimeout(function(that) { that.newPlayerTurn(); }, Config.TURN_DURATION + 1000, this);
    }
    
    this.startTimer = function(startDate, duration) {
        
        this.updateTimer(startDate, duration);
        
        clearInterval(this.timerIntervalId);        
        this.timerIntervalId = setInterval(function(that, dateStart, duration) { that.updateTimer(dateStart, duration); }, 1000, 
                                            this, 
                                            startDate,
                                            duration);        
    }
    
    this.updateTimer = function(dateStart, duration) {
        var currentTime = Math.round(new Date().getTime() / 1000);
        var counter = Math.max(0, dateStart + duration - currentTime);

        $('#timer span').html(counter);
    }
    
    this.updateTimerWrapper = function(value) {
        var currentTimeView = $('#timer span');
        
        $('#timer').html(value + ' <span>' + currentTimeView.html() + '</span>s');
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
    
    this.updatePlayerList = function() {
        
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
    }
    
    this.getPlayerInventoryView = function(player) {
        
        var view = $('<div class="inventory"></div');
        var listView = $('<ul></ul>');
        var card;
        for(var i = 0; i < player.inventory.cards.length; i++) {
            card = player.inventory.cards[i];
            listView.append($('<li>Guide touristique de ' + this.map.planets[card.value].name + '</li>'));
        }
        
        view.append(listView);        

        return view;
    }
}