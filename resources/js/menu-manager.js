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
            
            temp.append('<option value="'+Config.ROLE_BRUTE.id+'">Brute</option>');
            temp.append('<option value="'+Config.ROLE_PIRATE.id+'">Pirate</option>');
            temp.append('<option value="'+Config.ROLE_ARCHITECT.id+'">Architecte</option>');
            temp.append('<option value="'+Config.ROLE_EXPERT.id+'">Expert en armement</option>');
            temp.append('<option value="'+Config.ROLE_SPY.id+'">Informateur</option>');
            temp.append('<option value="'+Config.ROLE_SHIELD.id+'">Bouclier</option>');
            
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
        
        SingletonEngine.engine.tutorialMode = $('input[name="tutorialMode"]').is(':checked');

        // add all the players
        if(debug == true) {
            SingletonEngine.engine.addPlayer("Player1", Config.ROLE_PIRATE);
            SingletonEngine.engine.addPlayer("Player2", Config.ROLE_ARCHITECT);
            SingletonEngine.engine.addPlayer("Player3", Config.ROLE_EXPERT);
        }
        else {
            $('#menu-content-play .player').each(function() {
                var roleList = [Config.ROLE_BRUTE, Config.ROLE_ARCHITECT, Config.ROLE_PIRATE, Config.ROLE_SPY, Config.ROLE_EXPERT, Config.ROLE_SHIELD];
                for(var i in roleList) {

                    if(roleList[i].id == $(this).children('.playerRole').val()) {
                        SingletonEngine.engine.addPlayer($(this).children('.playerName').val(), roleList[i]);
                        break;
                    }
                }
            });
        }
        
        // load the map
        SingletonEngine.engine.loadMap("test");
        
        // add the handler when a click is made on the map
        $('#map').click(function(event) { 
            SingletonEngine.engine.selectPlanet(event);               
        });
    }
}