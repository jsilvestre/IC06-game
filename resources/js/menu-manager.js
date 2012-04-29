function MenuManager() {
    
    
    this.checkGameReadyToStart = function() {
        
        var isReady = true;
        
        $('.playerName').each(function() {

            if($(this).val() == "" || $(this).val().length > 10) {
               isReady = false;
            }
        });
        
        if(!isReady) return false;
        
        var rolePicked = [];
        
        $('.playerRole').each(function() {
            if(rolePicked.indexOf($(this).val()) == -1) {
                rolePicked.push($(this).val());
            }
            else if(rolePicked.indexOf($(this).val()) >= 0) {
                isReady = false;
            }
        });
        
        return isReady;  
    }
    
    this.disableStartGameButton = function() {
        
        if(this.checkGameReadyToStart()) {
            $('#start-game').removeClass('button-disable').addClass('button').click(this.startGame);
        }
        else {
            $('#start-game').removeClass('button').addClass('button-disable').unbind('click');
        }
    }
    
    this.addRoleOptions = function() {
        $('#menu-content-play .player').each(function() {
            
            var temp = $('<select class="playerRole"></select>');
            
            temp.append('<option value="'+Config.ROLE_BRUTE+'">Brute</option>');
            temp.append('<option value="'+Config.ROLE_PIRATE+'" disabled>Pirate</option>');
            temp.append('<option value="'+Config.ROLE_ARCHITECT+'">Architecte</option>');
            temp.append('<option value="'+Config.ROLE_EXPERT+'">Expert en armement</option>');
            temp.append('<option value="'+Config.ROLE_SPY+'">Informateur</option>');
            temp.append('<option value="'+Config.ROLE_EXPLORER+'" disabled>Explorateur</option>');
            temp.append('<option value="'+Config.ROLE_SHIELD+'">Bouclier</option>');
            
            $(this).append(temp);
        });
        
        $('.playerRole').change({menu : this}, function(event) {
           event.data.menu.disableStartGameButton(); 
        });
    }
    
    this.startGame = function(debug) {

        // we hide the menu and show the game UI
        $('#game-menu').hide();
        $('#game').show();
        
        // create the game engine
        SingletonEngine.engine = new Engine();
        SingletonEngine.engine.debug = debug;

        // add all the players
        if(debug == true) {
            SingletonEngine.engine.addPlayer("Player1", Config.ROLE_BRUTE);
            SingletonEngine.engine.addPlayer("Player2", Config.ROLE_ARCHITECT);
            SingletonEngine.engine.addPlayer("Player3", Config.ROLE_EXPLORER);
            
            $('#startGame').click(function () {
               SingletonEngine.engine.startGame();
               $('#startGame').unbind('click');
            });
        }
        else {
            $('#menu-content-play .player').each(function() {
                SingletonEngine.engine.addPlayer($(this).children('.playerName').val(), $(this).children('.playerRole').val());
            });
        }
        
        // load the map
        SingletonEngine.engine.loadMap("test");
        
        // add the handler when a click is made on the map
        $('#map').click(function(event) { 
            SingletonEngine.engine.selectPlanet(event);               
        });
    }
    
    this.enableDebugMode = function() {

        SingletonEngine.engine.addPlayer("Player1", Config.ROLE_BRUTE);
        SingletonEngine.engine.addPlayer("Player2", Config.ROLE_ARCHITECT);
        SingletonEngine.engine.addPlayer("Player3", Config.ROLE_EXPLORER);

    }
}