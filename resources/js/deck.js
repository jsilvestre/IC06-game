function Deck() {

    this.cards = [];
    this.originalCards = [];
    
    
    // this does not actually copy the cards themselves but allow us to keep a record of the card object
    this.initializeOriginalCards = function() {
        for(var i = 0; i < this.cards.length; i++) {
            this.originalCards.push(this.cards[i]);
        }
    }
    
    this.addCard = function(card) {
        this.cards.push(card);
    }
    
    this.removeCard = function(card) {
        var tmp = [];
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i].id == cardId) {
                tmp = this.cards.slice(0, i);
                this.cards = this.cards.concat(tmp, this.cards.slice(i+1, this.cards.length));
                return;
            }
        }        
    }
    
    this.hasCard = function(card) {
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i].id == cardId) {
                return true;
            }
        }
        
        return false;        
    }
    
    this.getCard = function(cardId) {
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i].id == cardId) {
                return this.cards[i];
            }
        }
        
        return null;
    }
    
    this.shuffle = function() {
        
    }
}