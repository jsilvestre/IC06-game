var Config = {
    
    
    moveInterval : 25, // l'interval entre deux tick pour le déplacement en ms
    moveTime : 1500, // le temps qu'un déplacement doit durer en ms
    
    LIMIT_DRAW_VERTICAL : 50, // le nombre minimum entre deux planètes liés en px (pour la liaison classique)
    
    PLANET_HITBOX : 15
};

function Engine() {
    
    this.map = {
        "view" : null,
        "planets" : []
    };
    
    this.selectedPlanet = null;
    
    this.players = [];
    
    this.canvas = null;
    this.canvasContext = null;
    this.canvasBuffer = null;
    this.canvasBufferContenxt = null;
    
    this.playerMoveIntervalId = null;
    
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
        
        this.buildMapModel(jsonObject);  
        
        this.canvas = $('#map');
        this.canvasContext = this.canvas[0].getContext('2d');
        
        this.canvasBuffer = document.createElement('canvas');
        this.canvasBuffer.width = 1000;
        this.canvasBuffer.height = 400;
        this.canvasBufferContext = this.canvasBuffer.getContext('2d');
        
        this.map.view = new Map();
        this.map.view.initialize(this.map.planets);
        
        var player = new Player();
        player.id = 0;
        player.name = "Joseph";
        player.planet = this.map.planets["p2"];
        player.x = player.planet.x;
        player.y = player.planet.y;
        this.players.push(player);
    
        this.render();
    }
    
    // Exécute le rendu du jeu
    this.render = function() {
        
        this.canvasContext.clearRect(0, 0, 1000, 400);
        this.canvasBufferContext.clearRect(0, 0, 1000, 400);
        
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
            }

            this.map.planets[planet.id] = planet;
        }        
    }
    
    this.movePlayer = function() {
        this.playerMoveIntervalId = setInterval(function(that, dest) { that.executeMove(dest); }, Config.moveInterval, this, this.map.planets["p1"]);
    }
    
    this.executeMove = function(planetDest) {
    
        this.players[0].move(planetDest, this.playerMoveIntervalId);
        
        this.render();
    }
}

function Map() {
    
    this.canvas = null;
    this.planets = new Array();
    
    // Initialise la map
    this.initialize = function(planets) {
        
        this.planets = planets;       
    }
    
    // Dessine la vue de la map
    this.draw = function(canvasContext) {
        
        for(var i in this.planets) {
            this.planets[i].draw(canvasContext); // draw the planet
            
            // draw the relationship between this planet and others
            for(var j = 0; j < this.planets[i].boundPlanets.length; j++) {
                this.drawRelation(canvasContext, this.planets[i], this.planets[this.planets[i].boundPlanets[j]]);
            }
        }
    }
    
    // Dessine les liens entre les planètes
    this.drawRelation = function(canvasContext, planetSource, planetDest) {
        canvasContext.beginPath();
        
        var additionner = [0, 0];
        
        // si la distance entre les deux planètes est trop petite, on dessine le trait verticalement
        if(Math.abs(planetSource.x - planetDest.x) < Config.LIMIT_DRAW_VERTICAL) {
            
            // permet de supprimer la notion d'ordre dans les relations (JSON)
            if(planetSource.y - planetDest.y <= 0) {
                additionner[0] = Config.PLANET_HITBOX;
                additionner[1] = 0;
            }
            else {
                additionner[0] = 0;
                additionner[1] = Config.PLANET_HITBOX;
            }
            
            canvasContext.moveTo(planetSource.x + Config.PLANET_HITBOX / 2, planetSource.y + additionner[0]);
            canvasContext.lineTo(planetDest.x + Config.PLANET_HITBOX / 2, planetDest.y + additionner[1]);
        }
        else {

            // permet de supprimer la notion d'ordre dans les relations (JSON)
            if(planetSource.x - planetDest.x <= 0) {
                additionner[0] = Config.PLANET_HITBOX;
                additionner[1] = 0;
            }
            else {
                additionner[0] = 0;
                additionner[1] = Config.PLANET_HITBOX;
            }            
            
            canvasContext.moveTo(planetSource.x + additionner[0], planetSource.y + Config.PLANET_HITBOX / 2);
            canvasContext.lineTo(planetDest.x + additionner[1], planetDest.y + Config.PLANET_HITBOX / 2);
        }

        canvasContext.stroke();
        canvasContext.closePath();        
    }
}

function Planet() {
    
    this.id = "";
    this.name = "";
    this.zone = "";
    this.x = 0;
    this.y = 0;
    this.boundPlanets = [];
    
    // Dessine la vue de la planète
    this.draw = function(canvasContext) {
        canvasContext.beginPath();
        canvasContext.fillStyle = this.getColorZone();
        canvasContext.fillRect(this.x, this.y, Config.PLANET_HITBOX, Config.PLANET_HITBOX);
        
        canvasContext.fillStyle = "#000";
        canvasContext.fillText(this.name, this.x - 15, this.y + 30);
        canvasContext.closePath();
    }
    
    // Donne la couleur en fonction de la zone de la planète
    this.getColorZone = function() {
        switch(this.zone) {
            case "threat-a" :
                return "red";
            case "threat-b":
                return "blue";
            case "threat-c":
                return "green";
            case "threat-d":
                return "yellow";
            default:
                return "black";
        }
    }
}

function Player() {
    
    this.id = 0;
    this.name = "Player";
    this.x = 0;
    this.y = 0;
    this.planet = null;
    
    // Dessine la vue du joueur
    this.draw  = function(canvasContext) {
    
        canvasContext.beginPath();
        canvasContext.fillStyle = "#d53ec4";
        canvasContext.fillRect(this.x, this.y, 5, 5);
        canvasContext.closePath();        
    }
    
    // Déplace le joueur sur une aurte planète
    this.move = function(planetDest, playerMoveIntervalId) {
        
        // distance entre deux points
        var distance = Math.sqrt(Math.pow(planetDest.y - this.planet.y, 2) + Math.pow(planetDest.x - this.planet.x, 2));

        // la vitesse à laquelle se déplace la vue du joueur
        var speed = Config.moveInterval * distance / Config.moveTime; // en pixel / tick
        
        // le coefficient directeur de la droite
        var coeff = (planetDest.y - this.planet.y) / (planetDest.x - this.planet.x);
        if((planetDest.x - this.planet.x) == 0) {
            coeff = 1;
        }
        
        // la variable d'ajustement de l'équation de la droite
        var adjust = this.y - this.x * coeff;
            
        var direction; // la direction du déplacement
        if(planetDest.x > this.planet.x || planetDest.y > this.planet.y) {
            direction = 1;
        }
        else {
            direction = -1;
        }

        // si l'équation de la droite est du type y = A on ne fait varier que le paramètre y
        if(coeff != 1) {
            this.x = this.x + speed * direction;
            this.y = this.x * coeff + adjust;
        }
        else {
            this.y = this.y + speed * direction;
        }

        // conditions d'arrêt : ne pas toucher à moins savoir ce qu'on fait
        if( ((planetDest.x > this.planet.x) && (((planetDest.y > this.planet.y) && (this.x > planetDest.x || this.y > planetDest.y)) ||
            (!(planetDest.y > this.planet.y) && (this.x > planetDest.x || this.y < planetDest.y)))) ||
            
            (!(planetDest.x > this.planet.x) && (((planetDest.y > this.planet.y) && (this.x < planetDest.x || this.y > planetDest.y)) ||
            (!(planetDest.y > this.planet.y) && (this.x < planetDest.x || this.y < planetDest.y)))) ) {
                
                this.setPlanet(planetDest);
                clearInterval(playerMoveIntervalId);
        }
    }
    
    // Affecte une nouvelle planète au joueur
    this.setPlanet = function(planetDest) {
        this.x = planetDest.x;
        this.y = planetDest.y;
        this.planet = planetDest;        
    }
}