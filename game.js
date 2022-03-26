// utility function
// we need do some  array shuffle, let add it to the Array obj
Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

// ##################################
// ###  Card class and functions  ###
// ##################################
// constructor
// @param type: is the type of the card - used to match cards
// @param id: unique id of the card
function Card(type, id){
    this.type = type;
    this.id = "c"+id;
    this.matched = false;
}

// getter and setters
Card.prototype.getId = function(){
    return this.id;
}
Card.prototype.getHtml = function(){
	return "<li id='"+this.id+"'></li>";
}
Card.animatePlace = function(id){
    $("#"+id).addClass("default");
}
Card.prototype.click = function(){
    $("#"+this.id).removeClass("default").addClass(this.type);
}
Card.prototype.getType = function(){
    return this.type;
}
Card.prototype.setMatched = function(bool){
    //this.matched = bool;
    if(bool){
        $("#"+this.id).addClass("matched");
    }else{
        this.flip();
    }
}
Card.prototype.isMatched = function(){
    return $("#"+this.id).hasClass("matched");
}
Card.prototype.flip = function(){
    // todo: animate ....
    var id = this.id;
    var DELAY = 1000;
    var DURATION = 300;
    setTimeout(function(){
        $("#"+id).removeAttr("class", DURATION).addClass("default", DURATION);
    }, DELAY);
}
Card.prototype.peek = function(){
    var PEEK_DELAY = 150;
    var DURATION = 300;
    
    var rand = Math.random(10) * 1000;
    var id = this.id;
    var type= this.type;
    var that = this;
    var delay = PEEK_DELAY + rand;
    
    setTimeout(function(){
        that.click();
        that.flip();
    }, delay);
}
// check if cards match
// if so, mark cards matched
// otherwise, flip cards back
Card.gotMatch = function(a, b){
    // match! mark the cards matched
    var match = a.getType() === b.getType();
    a.setMatched(match);
    b.setMatched(match);

    return match;
}
// card css, generate css class names, and add to array
Card.TYPE = (function(){
    var MAX = 62;
    var types = [];
    for(var i =0; i < MAX; i++){
        types.push("t"+i);
    }
    return types;
}());
Card.WIDTH = 100;


// ##################################
// ###  Game class and functions  ###
// ##################################
// constructor
// @param config : grid size
function Game(config){
    this.config = config;
    this.prevCard = null;
    this.moves = 0;
    
    $("#count").html(this.moves);

	// shufle card types
	var types = Card.TYPE.shuffle();

	var cards = [];	
	var html = "";
    var total = config.x * config.y;
    var id = 0;
	// create 2 cards at a time to make sure all cards can be paired
	for(var i = 0; i < total/2; i++){
		var type = types[i];
		cards.push(new Card(type, id++));
		//console.log("cards="+cards.length);
		
		cards.push(new Card(type, id++));
		//console.log("cards="+cards.length);
	}
    
    // shuffle all cards
    this.cards = cards.shuffle();

    this.grid = genCardGrid(this);

    // generate 2 dimentional array as card grid
    function genCardGrid(that){
        var grid = [];
        var row = [];
        for(var i =0; i < that.cards.length; i++){
            row.push(that.cards[i].getId());
            if(row.length == that.config.x){
                grid.push(row);
                row = [];    
            }
        }
        return grid;
    }

}
Game.prototype.getCard = function(id){
    for(var i =0; i < this.cards.length; i++){
        if(this.cards[i].getId() == id) return this.cards[i];
    }
    console.log("Error: Card not found:"+id);
}
// we place all cards in page, but hidden initially,
// otherwise i need to use table, or position them absolutely,
// neither approach is idea
Game.prototype.placeCards = function(){
	var html = "";
	for(var i = 0; i < this.cards.length; i++){
		html += this.cards[i].getHtml();
	}
	$("ul.game").append(html);
}
// just show the cards one by one to fake the placing sequence,
// a procedural function now, but can be easily made into a recursive function,
// instead of messing with array element index in a 1 dimensional array(walk the elements in a spiral pattern),
// we will just turn it into a 2 dimentional array, mush easied to work with.
// the idea is to reduce the array size as we do the spiral: 
// top: left to right: remove top row(first element in top level arrayxe)  - by remove each element from the front of array
// right: top to bottom: remove last elemnt in each array
// bottom: right to left: remove last row(last element in top level array) - by remove last element in each array
// left: bottom to top: remove first element in each array
Game.prototype.animateSpiral = function(spiral){
    var sequence = [];

    while(this.grid.length > 0){
        // top: left to right
        var row = this.grid.shift();
        while(row.length > 0){
            sequence.push(row.shift());
        }
        
        // right: top to bottom
        for(var i =0; i < this.grid.length; i++){
            sequence.push(this.grid[i].pop());
        }
        
        // bottom: right to left
        row = this.grid.pop();
        while(row && row.length > 0){
            sequence.push(row.pop());
        }
        
        // left: bottom to top
        for(var i = this.grid.length -1; this.grid.length > 0 && i >= 0; i--){
            sequence.push(this.grid[i].shift());
        }
    }
    
    // check which spiral sequence
    if(spiral == "out"){
        sequence.reverse();
    }

    var SPEED = 50;
    var SEQ = setInterval(function(){
        var id = sequence.shift();
        //console.log("###sequence:"+id);
        Card.animatePlace(id);
        if(sequence.length == 0){
            //console.log("@@end of sequence");
            clearInterval(SEQ);
        }
    }, SPEED);
}
// check if cards are macthed
Game.prototype.checkMatch = function(aCard){
    this.moves += 1;
    $("#count").html(this.moves);
    if(this.prevCard != null){
        // check if card match
        if(Card.gotMatch(this.prevCard, aCard)){
            this.matched(this.prevCard);    
            this.matched(aCard);    
        }
        // clear the cards from prevCard var
        this.prevCard = null;
    }else{
        this.prevCard = aCard;
    }
}
// remove a matched card from cards array
Game.prototype.matched = function(card){
    for(var i = 0; i < this.cards.length; i++){
        if(this.cards[i].getId() == card.getId()){
            this.cards.splice(i, 1);
            return;
        }
    }
}

Game.prototype.peekaboo  = function(){
    for(var i = 0; !this.stopPlay && i < this.cards.length; i++){
        if(!this.cards[i].isMatched()){
            //console.log("###peak:"+this.cards[i].id);
            this.cards[i].peek();
        }
    }
}
Game.prototype.autoPlay  = function(){
    var pick = pickCard(this.cards.length);
    this.cards[pick[0]].click();
    this.cards[pick[1]].click();
    this.checkMatch(this.cards[pick[0]]);
    this.checkMatch(this.cards[pick[1]]);

    function pickCard(len){
        var i = Math.floor(Math.random() * len);
        var j = Math.floor(Math.random() * len);
        while(j == i){
            j = Math.floor(Math.random() * len);
        }
        return [i, j] 
    }
}
// a few game difficulty levels
// it's just the game grid config
Game.LEVEL = {};
Game.LEVEL.EASY = {x:4,y:2};
Game.LEVEL.MED = {x:5,y:4};
Game.LEVEL.HARD = {x:6, y:5};
// this is only limited by the number of css class we have,
// code has no restriction of size of grid
Game.LEVEL.XHARD = {x:12, y:12};

Game.reset = function(lvl, spiral){
	// create a new game
	var aGame = new Game(lvl);
	if(!$("ul.game").length){
		$(document.body).append("<ul class='game'></ul>");
	}else{
		$("ul.game").empty();
	}
	$("ul.game").css("width", lvl.x * Card.WIDTH);

	aGame.placeCards();
    aGame.animateSpiral(spiral);

    $("ul.game li").on("click", function(evt){
        var c = evt.target.id;
        var card = aGame.getCard(c);
        // is the card one of the remaining unmatched cards?
        if(!card){
            return;
        }   
        /*if(card.isMatched()){
            return;
        }*/
        card.click();
        aGame.checkMatch(card);
    });
    return aGame;
}
Game.auto = function(game){
    if(game.cards.length == 0) return;
    
    var handle = setInterval(function(){
        if(game.cards.length == 0 || game.stopPlay ){
            clearInterval(handle);
            return;    
        }
        game.autoPlay();
    }, 1800);
}
Game.prototype.stop = function(){
    this.stopPlay = true;
}
