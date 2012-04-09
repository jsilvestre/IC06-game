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
    
    this.removeCard = function(cardId) {
        var tmp = [], tmpNew = [];
        var cardToReturn;
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i].id == cardId || (i == 0 && cardId == "first")) {
                cardToReturn = this.cards[i];
                tmp = this.cards.slice(0, i);
                this.cards = tmp.concat(this.cards.slice(i+1, this.cards.length - i + 1));
                return cardToReturn;
            }
        }
        
        return false;
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
    
    this.getCardByValue = function(value) {
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i].value == value) {
                return this.cards[i];
            }
        }
        
        return null;
    }    
    
    this.shuffle = function(nbShuffle) {
        for(var i = 0; i < nbShuffle; i++) {
            this.internalShuffle();
        }
    }
    
    this.internalShuffle = function() {
        
        var valArr = [],
            k = '',
            i = 0,
            strictForIn = true,
            populateArr = [];

        for (k in this.cards) { // Get key and value arrays
            if (this.cards.hasOwnProperty(k)) {
                valArr.push(this.cards[k]);
                if (strictForIn) {
                    delete this.cards[k];
                }
            }
        }
        
        valArr.sort(function () {
            return 0.5 - Math.random();
        });

        populateArr = strictForIn ? this.cards : populateArr; 
        for (i = 0; i < valArr.length; i++) { // Repopulate the old array
            populateArr[i] = valArr[i];
        }
         
        this.cards = populateArr;
    }
}