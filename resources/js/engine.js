var jsonMap = "{title : 'My test map'}";

function Engine() {
    
    this.map = {
        "view" : null,
        "planets" : []
    };
    
    this.players = [];
    
    this.canvas = null;
    this.canvasContext = null;
    this.canvasBuffer = null;
    this.canvasBufferContenxt = null;
    
    this.playerMoveIntervalId = null;
    
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
    
    this.render = function() {
        
        this.canvasContext.clearRect(0, 0, 1000, 400);
        this.canvasBufferContext.clearRect(0, 0, 1000, 400);
        
        this.renderMap();
        this.renderPlayers();
        
        this.canvasContext.drawImage(this.canvasBuffer, 0, 0);
    }
    
    this.renderMap = function() {
        this.map.view.draw(this.canvasBufferContext);
    }
    
    this.renderPlayers = function() {
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].draw(this.canvasBufferContext);
        }        
    }
    
    this.buildMapModel = function(map) {
        
        var planet;
        
        for(var i = 0; i < map.planets.length; i++) {
            planet = new Planet();
            planet.id = map.planets[i].id;
            planet.name = map.planets[i].name;
            planet.type = map.planets[i].type;
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
        this.playerMoveIntervalId = setInterval(function(that, dest) { that.executeMove(dest); }, 25, this, this.map.planets["p5"]);
    }
    
    this.executeMove = function(planetDest) {
    
        this.players[0].move(planetDest, this.playerMoveIntervalId);
        
        this.render();
    }
}

function Map() {
    
    this.canvas = null;
    this.planets = new Array();
    
    this.initialize = function(planets) {
        
        this.planets = planets;       
    }

    this.draw = function(canvasContext) {
        
        for(var i in this.planets) {
            this.planets[i].draw(canvasContext); // draw the planet
            
            // draw the relationship between this planet and others
            for(var j = 0; j < this.planets[i].boundPlanets.length; j++) {
                this.drawRelation(canvasContext, this.planets[i], this.planets[this.planets[i].boundPlanets[j]]);
            }
        }
    }
    
    this.drawRelation = function(canvasContext, planetSource, planetDest) {
        canvasContext.beginPath();
        canvasContext.moveTo(planetSource.x + 15, planetSource.y + 7.5);
        canvasContext.lineTo(planetDest.x, planetDest.y + 7.5);
        canvasContext.stroke();
        canvasContext.closePath();        
    }
}

function Planet() {
    
    this.id = "";
    this.name = "";
    this.type = "";
    this.x = 0;
    this.y = 0;
    this.boundPlanets = [];    
    
    this.draw = function(canvasContext) {
        canvasContext.beginPath();
        canvasContext.fillStyle = this.getColorZone();
        canvasContext.fillRect(this.x, this.y, 15, 15);
        
        canvasContext.fillStyle = "#000";
        canvasContext.fillText(this.name, this.x - 15, this.y + 30);
        canvasContext.closePath();
    }
    
    this.getColorZone = function() {
        switch(this.type) {
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
    
    this.draw  = function(canvasContext) {
    
        canvasContext.beginPath();
        canvasContext.fillStyle = "#d53ec4";
        canvasContext.fillRect(this.x, this.y, 5, 5);
        canvasContext.closePath();        
    }
    
    this.move = function(planetDest, playerMoveIntervalId) {
        var distance = Math.sqrt(Math.pow(planetDest.y - this.planet.y, 2) + Math.pow(planetDest.x - this.planet.x, 2));

        var speed = 25 * distance / 1500; // in pixel / tick
        
        var coeff = (planetDest.y - this.planet.y) / (planetDest.x - this.planet.x);
        if((planetDest.x - this.planet.x) == 0) {
            coeff = 1;
        }
        
        var adjust = this.y - this.x * coeff;
            
        var direction;
        if(planetDest.x > this.planet.x || planetDest.y > this.planet.y) {
            direction = 1;
        }
        else {
            direction = -1;
        }

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
    
    this.setPlanet = function(planetDest) {
        this.x = planetDest.x;
        this.y = planetDest.y;
        this.planet = planetDest;        
    }
}