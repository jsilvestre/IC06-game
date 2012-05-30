function Logger() {
    
    this.view = null;
    this.logs = new Array();
    this.queue = new Array();
    this.engine = null;
    
    this.queueTimer = null;
    
    this.logAction = function(string, actorName, duration, sticky) {
        
        if(actorName == null) {
            
            var actor = this.engine.getCurrentPlayer();
            
            if(actor == null) {
                actorName = "Système";
            }
            else {
                actorName = actor.name;
            }
        }
        
        if(duration == null) duration = 3000;
        if(sticky == null) sticky = true;
        
        var loggedAction = { 'id' : this.logs.length, 'date' : new Date(), 'content' : string, 'author' : actorName, 
                                'duration' : duration, 'sticky' : sticky };
        
        this.logs.push(loggedAction);

        this.queue.push(loggedAction);
        this.addToView(loggedAction);
    }
    
    this.startGrowlNotification = function() {
        
        this.queueTimer = setInterval(function(that) { that.growlNotification();}, 1000, this);
    }
    
    this.growlNotification = function() {
        
        if(this.queue.length > 0) {
            var loggedAction = this.queue.pop();
            var message = loggedAction.author + ' : ' + loggedAction.content;
        
            var options = {
                'life' : loggedAction.duration,
                'sticky' : loggedAction.sticky,
                'position' : 'bottom-right'
            };
        
            $.jGrowl(message, options);
        }
    }
    
    this.stopGrowlNotification = function() {
        clearInterval(this.queueTimer);
        this.queueTimer = null;
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