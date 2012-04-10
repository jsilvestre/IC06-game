function Logger() {
    
    this.view = null;
    this.logs = new Array();
    this.engine = null;
    
    this.logAction = function(string, actorName) {
        
        if(actorName == null) {
            
            var actor = this.engine.getCurrentPlayer();
            
            if(actor == null) {
                actorName = "Système";
            }
            else {
                actorName = actor.name;
            }
        }
        
        var loggedAction = { 'date' : new Date(), 'content' : string, 'author' : actorName };
        
        this.logs.push(loggedAction);
        this.addToView(loggedAction);
    }
    
    this.addToView = function(loggedAction) {
        
        var h = loggedAction.date.getHours();
        var m = loggedAction.date.getMinutes();
        var s = loggedAction.date.getSeconds();
        
        var date = '<span class="date">[' + h + ':' + m + ':' + s + ']</span> ';        
        var actor = '<span class="actor">' + loggedAction.author + '</span>';

        this.view.html('<li>' + date + actor + ': ' + loggedAction.content + '</li>' + this.view.html());
    }    
}