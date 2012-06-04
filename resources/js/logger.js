function Logger() {
    
    this.view = null;
    this.logs = new Array();
    this.queue = new Array();
    this.engine = null;
    
    this.queueTimer = null;
    
    this.logAction = function(string, actorName, timeBeforeLog, duration, sticky) {
        
        if(actorName == null) {
            actorName = Config.SYSTEM_NAME;
        }
        
        if(duration == null) duration = 3000;
        if(sticky == null) sticky = false;
        
        var loggedAction = { 'id' : this.logs.length, 'date' : new Date(), 'content' : string, 'author' : actorName, 
                                'duration' : duration, 'sticky' : sticky };
        
        
        if(timeBeforeLog == false) {
            this.executeLog(loggedAction);
        }
        else {
            setTimeout(function(that, loggedAction) { that.executeLog(loggedAction) }, timeBeforeLog, this, loggedAction);
        }
    }
    
    this.executeLog = function(loggedAction) {
        this.logs.push(loggedAction);

        this.growlNotification(loggedAction);
        this.addToView(loggedAction);
    }

    this.growlNotification = function(loggedAction) {

        var message = loggedAction.author + ' : ' + loggedAction.content;
    
        var options = {
            'life' : loggedAction.duration,
            'sticky' : loggedAction.sticky,
            'position' : 'bottom-right'
        };
    
        $.jGrowl(message, options);
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