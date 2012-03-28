function Logger() {
    
    this.view = null;
    this.logs = new Array();
    
    this.logAction = function(string) {
        
        var logAction = { 'date' : new Date(), 'content' : string };
        
        this.logs.push(logAction);
        this.addToView(logAction);
    }
    
    this.addToView = function(logAction) {
        
        var h = logAction.date.getHours();
        var m = logAction.date.getMinutes();
        var s = logAction.date.getSeconds();
        
        var renderedContent = '[' + h + ':' + m + ':' + s + '] ' + logAction.content;
        this.view.html('<li>' + renderedContent + '</li>' + this.view.html());
    }    
}