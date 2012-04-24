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
    
    this.startGame = function() {

        // we hide the menu and show the game UI
        $('#game-menu').hide();
        $('#game').show();
        
        // create the game engine
        SingletonEngine.engine = new Engine();

        // add all the players
        $('#menu-content-play .player').each(function() {
            SingletonEngine.engine.addPlayer($(this).children('.playerName').val(), $(this).children('.playerRole').val());
        });
        
        // load the map
        SingletonEngine.engine.loadMap("test");
        
        // add the handler when a click is made on the map
        $('#map').click(function(event) { 
            SingletonEngine.engine.selectPlanet(event);               
        });
    }
}