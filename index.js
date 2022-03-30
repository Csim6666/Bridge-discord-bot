const Discord = require("discord.js");

const bot = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

const token= "your discord bot token";



const prefix="^";


//beginning
var mode = 'default';
var playerCount = 0;
let players = new Array();
var cards = new Array(4);
var poker = initPoker(cards);
var kingList = ['NK','S','H','D','C','SMALL'];
const order = initPoker(cards);


//start playing
var pokerHands = new Array();
var currentTurnPlayer = '';

//calling king
var kingCount = 1;
var king= '';
var kingHolder='';
var passCount = 0;

//bridgePlaying
var duang = new Array(0,0,0,0);
var turn=0;
var currentSuit='';
var winCondition= new Array(2);
var currentTurnCards = new Array();


bot.on("ready", () => {
  console.log("bot is working");
});


//handle message
bot.on("message", async (msg) => {
  if (!msg.content.startsWith(prefix)) {
    return;
  }
  const command = getCommand(msg)

  switch(mode){

    case 'poker':
    
    if(command == 's' || command == 'shuffle'){
      msg.channel.send('shuffling . . .')
      shuffle(poker);
    }
    if(command == 'player'){
      playerCount++;
      players.push(getUserId(msg));
      
      mentionPlayer(msg,getUserId(msg),(' you are now player '+playerCount))
      msg.channel.send('current players : '+players.length);
      // printCards(players)

    }
    if(command == 'deal'){
      
      msg.channel.send('dealing cards for '+players.length+' players ...' )
      pokerHands = deal(players , pokerHands , poker) 
      console.log(players.length+ ' , '+pokerHands.length)
      sortAllHands(pokerHands)
      showHands(players , pokerHands)
      

    }
    if(command == 'bridge'){
      if(players.length != 4){
        msg.channel.send('need 4 player to play bridge')
      }else{
        msg.channel.send('starting bridge')
        msg.channel.send('dealing cards for '+players.length+' players ...' )
        pokerHands = deal(players , pokerHands , poker) 
        console.log(players.length+ ' , '+pokerHands.length)
        sortAllHands(pokerHands)
        showHands(players , pokerHands)
        duang = new Array(0,0,0,0)
        currentTurnPlayer=randomPlayer(players);
        mentionPlayer(msg,currentTurnPlayer, (" It's your turn to call a king"))
        mode = 'callingKing'
      }
      
    }


    if(command == 'clear'){
      msg.channel.send('clearing player hands ...')
      pokerHands = new Array();
      kingCount = 1;
      king= '';
      shuffle(poker)
    }

    break;

    case 'callingKing':
      if(getUserId(msg) == currentTurnPlayer){
        if(command == 'nk' || command == 's' || command == 'h' || command == 'd' || command == 'c' || command == 'small'){
          var call = command.toUpperCase()
          if(call == king){
            msg.channel.send(king+ " is already the current king")
          }else{
            if(compareKing(king,call)){
              kingCount++;
            }
            if(kingCount > 4){
              msg.channel.send("sorry , currently 4 is the limit")
              kingCount--;
            }else{

              king = call;
              kingHolder=currentTurnPlayer;
              currentTurnPlayer=callingKingNextPlayer(players,currentTurnPlayer)
              msg.channel.send("the current king is "+kingCount+" "+king)
              passCount=0;
              mentionPlayer(msg,currentTurnPlayer, (" It's your turn to call a king"))
            }               

          }
          

        }else if(command == 'pass'){
          if(passCount <players.length-1){
            if(passCount ==players.length-2 && king != ''){
              //start game
              msg.channel.send("game start")
              mentionPlayer(msg,kingHolder, (" got the king"))
              msg.channel.send('King is '+kingCount + ' '+king)
              
              winCondition = setWinDuang(kingCount)
              mentionPlayer(msg,kingHolder,'and <@'+getBridgeMate(players,kingHolder)+'> have to get '+winCondition[0]+ ' duangs to win')
              mentionPlayer(msg,currentTurnPlayer,'and <@'+getBridgeMate(players,currentTurnPlayer)+'> have to get '+winCondition[1]+ ' duangs to win')
              mentionPlayer(msg,currentTurnPlayer,"please play a card")
              mode='bridgePlaying'

            }else{
              passCount++;
              currentTurnPlayer=callingKingNextPlayer(players,currentTurnPlayer)
              mentionPlayer(msg,currentTurnPlayer, (" It's your turn to call a king"))
            }
            
          }else if(passCount ==players.length-1 && king ==''){
            msg.channel.send("you can't pass")

          }


        }
        
      }
     


    break;

    case 'bridgePlaying':
      var card=command.toUpperCase()
      console.log(card)
      if(getUserId(msg) == currentTurnPlayer && checkContain(poker,card)){
        if(playerHasCard(card,getUserId(msg))){
          switch (turn){
            case 0:              
              currentSuit=getSuit(card);
              playCard(card,currentTurnPlayer)
              if((pokerHands[players.indexOf(currentTurnPlayer)]).length>0){
               dm(currentTurnPlayer,arrayToString(pokerHands[players.indexOf(currentTurnPlayer)]))
              }
              currentTurnCards.push(new Array(currentTurnPlayer,card))
              currentTurnPlayer=NextPlayer(players,currentTurnPlayer)
              
              msg.channel.send('current turn : ')
              msg.channel.send(getTableCards(currentTurnCards))
              mentionPlayer(msg,currentTurnPlayer,"please play a card")
              
              turn++;

              break;

            case 1:

              if(getSuit(card) != currentSuit && haveCurrentSuit(currentTurnPlayer,currentSuit)){
                msg.channel.send("you have the current suit "+currentSuit+" in your hands")
              }else{
                playCard(card,currentTurnPlayer)
                if((pokerHands[players.indexOf(currentTurnPlayer)]).length>0){
                  dm(currentTurnPlayer,arrayToString(pokerHands[players.indexOf(currentTurnPlayer)]))
                 }
                currentTurnCards.push(new Array(currentTurnPlayer,card))
                currentTurnPlayer=NextPlayer(players,currentTurnPlayer)
                
                msg.channel.send('current turn : ')
                msg.channel.send(getTableCards(currentTurnCards))
                mentionPlayer(msg,currentTurnPlayer,"please play a card")
                turn++;
              }
              break;

            case 2:

              if(getSuit(card) != currentSuit && haveCurrentSuit(currentTurnPlayer,currentSuit)){
                msg.channel.send("you have the current suit in your hands")
              }else{
                playCard(card,currentTurnPlayer)
                if((pokerHands[players.indexOf(currentTurnPlayer)]).length>0){
                  dm(currentTurnPlayer,arrayToString(pokerHands[players.indexOf(currentTurnPlayer)]))
                 }
                currentTurnCards.push(new Array(currentTurnPlayer,card))
                currentTurnPlayer=NextPlayer(players,currentTurnPlayer)
                
                msg.channel.send('current turn : ')
                msg.channel.send(getTableCards(currentTurnCards))
                mentionPlayer(msg,currentTurnPlayer,"please play a card")
                turn++;
              }
              break;

            case 3:

              if(getSuit(card) != currentSuit && haveCurrentSuit(currentTurnPlayer,currentSuit)){
                msg.channel.send("you have the current suit in your hands")
              }else{
                playCard(card,currentTurnPlayer)
                if((pokerHands[players.indexOf(currentTurnPlayer)]).length>0){
                  dm(currentTurnPlayer,arrayToString(pokerHands[players.indexOf(currentTurnPlayer)]))
                 }
                currentTurnCards.push(new Array(currentTurnPlayer,card))
                currentTurnPlayer=NextPlayer(players,currentTurnPlayer)
                msg.channel.send('current turn : ')
                msg.channel.send(getTableCards(currentTurnCards))
                var winner = getTurnWinner(currentTurnCards,currentSuit)
                mentionPlayer(msg,winner,"you have win this duang")
                duang[players.indexOf(winner)]++;
                msg.channel.send(duangToString(duang));

                if (checkGameOver(players,kingHolder,duang,winCondition) != ''){//either side reach win condition ==>game over
                  if(checkGameOver(players,kingHolder,duang,winCondition) == 'kingPairWin'){
                    mentionPlayer(msg,kingHolder,'and <@'+getBridgeMate(players,kingHolder)+'> win !!!')
                    
                    msg.channel.send(":tada:"+' '+":tada:");
                  }else{

                    mentionPlayer(msg,NextPlayer(players,kingHolder),'and <@'+getBridgeMate(players,NextPlayer(players,kingHolder))+'> win !!!')
                    
                    msg.channel.send(":tada:"+' '+":tada:");
                  }
                  mode = 'gameOver'
                }else{
                  currentTurnPlayer = winner;
                  mentionPlayer(msg,currentTurnPlayer," since you won the last turn, please play a card")
                  currentTurnCards=new Array()
                  clearTurnCards()
                  turn=0;
                }
                
                
                
              }

              break;      
          }

        }else{
          msg.channel.send('you do not have this card')
        }

      }else if(!checkContain(poker,card)){
        msg.channel.send("error")
        console.log(card)
      }

    break;

    case 'gameOver' :
      if(command== 'clear'){
        clear()
        msg.channel.send('clearing ...')
        mode ='poker'
      }

    break;

    default :
    if(command == 'p'){
      msg.channel.send('poker starting')
      msg.channel.send('type "^player"  to join')
      msg.channel.send('current players : '+players.length);
      mode ='poker'
      
      
    
    }
    break;
  }

  if(command == 'exit' || command == 'reset' ){
    msg.channel.send('resetting ...')
    reset()
  }
  
  if(command == 'mode'){
    msg.channel.send(mode)
    
  }


  
  


})


bot.login(token);



//function down here

function reset(){
  mode = 'default'
  playerCount =0;
  players = new Array();
  pokerHands = new Array();
  poker = initPoker(cards);
  kingCount = 1;
  king= '';
  kingHolder='';
  currentTurnPlayer = '';
  currentTurnCards= new Array()
  passCount = 0;
  duang = new Array();
  winCondition= new Array(2);
  currentSuit='';
  turn=0;
  clearTurnCards()
}

function clear(){//reset table and card but players remain
  kingCount = 1;
  king= '';
  kingHolder='';
  currentTurnPlayer = '';
  currentTurnCards= new Array()
  passCount = 0;
  duang = new Array();
  winCondition= new Array(2);
  currentSuit='';
  turn = 0;
  clearTurnCards()
}

function clearTurnCards(){
  currentTurnCards = new Array();
}

function getCommand(msg){
  const args= msg.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const command = args.shift().toLowerCase()
  return command;
}

function getUserId(msg){
  return msg.author.id;
}

function getUsername(msg){
  return msg.author.username;
}

function dm(userId , msg){
  bot.users.cache.get(userId).send(msg);
}

function mentionPlayer(msg , userId ,text ){
  msg.channel.send('<@'+userId+'> '+text)
}

function randomPlayer(players){
  var i = Math.floor(Math.random() * players.length)
  console.log(i)
  console.log(players[i])
  return players[i]
}

function getBridgeMate(players, player){
  var i =players.indexOf(player)
  var j = (i+2)> players.length-1 ? i+2-players.length : i+2
  return players[j]
}

function NextPlayer(players , currentPlayer){
  var next = 0;
  for(var i =0;i<players.length;i++){
    if(players[i]==currentPlayer){
      if(i==players.length-1){
        next =0;
      }else{
        next =i+1;
      }
    break;
    }
  }
  return players[next];
}

function callingKingNextPlayer(players , currentPlayer){
  var next = 0;
  for(var i =0;i<players.length;i++){
    if(players[i]==currentPlayer){
      if(i==0){
        next =players.length-1;
      }else{
        next =i-1;
      }
    break;
    }
  }
  return players[next];
}

function compareKing(currentKing,newKing){
  if(currentKing ==''){
    return false;
  }
  else if(kingList.indexOf(newKing)>kingList.indexOf(currentKing)){
    return true;

  }else{
    return false;
  }

}

function checkContain(arr, str){
  let res = false;
    arr.forEach(e=>{
      if(str==e){
        res= true;
        
      }
    })
  return res;  
}

function playerHasCard(card,playerId){
  var i = players.indexOf(playerId)
  return checkContain(pokerHands[i],card)
}

function playCard(card,playerId){
  var i = players.indexOf(playerId)
  removeCard(i,card)

  
}

function removeCard(i, card){
  var cardindex = pokerHands[i].indexOf(card);
  
  pokerHands[i].splice(cardindex, 1);

}

function haveCurrentSuit(player, currentSuit){
  var res = false
  var i = players.indexOf(player)
  pokerHands[i].forEach(e=>{
    if(getSuit(e)==currentSuit){
      res=true
    }
  })
  return res;
}

function setWinDuang(kingCount){
  var winCondition = new Array((7+(kingCount-1)),(7-(kingCount-1)));
  
  return winCondition;
}

function checkGameOver(players,kingHolder,duang,winCondition){
  var kingIndex  = players.indexOf(kingHolder)
  var kingMateIndex = players.indexOf(getBridgeMate(players,kingHolder))
  var normal = NextPlayer(players,kingHolder)
  var normalIndex= players.indexOf(normal)
  var normalMateIndex = players.indexOf(getBridgeMate(players,normal))
  if(duang[kingIndex]+duang[kingMateIndex] == winCondition[0]){
    return 'kingPairWin'
  }else if(duang[normalIndex]+duang[normalMateIndex] == winCondition[1]){
    return 'normalPairWin'
  }else{
    return ''
  }
} 

 function getTurnWinner(turnCards,currentSuit){
  var winner = turnCards[0][0]
  var winnerCard = turnCards[0][1]
  
  switch (king){
    case 'nk':
      for(let i =1; i<turnCards.length;i++){
        if(getSuit(turnCards[i][1])==currentSuit && getNumber(turnCards[i][1])>getNumber(winnerCard)){
          winner = turnCards[i][0];
          winnerCard = turnCards[i][1];
        }
      }

    break;
    
    case 'small':
      for(let i =1; i<turnCards.length;i++){
        if(getSuit(turnCards[i][1])==currentSuit && getNumber(turnCards[i][1])<getNumber(winnerCard)){
          winner = turnCards[i][0];
          winnerCard = turnCards[i][1];
        }
      }
    
    break;

    default:
      for(let i =1; i<turnCards.length;i++){
        if(getSuit(winnerCard) == king ){
          if(getSuit(turnCards[i][1])== king && getNumber(turnCards[i][1])>getNumber(winnerCard)){
            winner = turnCards[i][0];
            winnerCard = turnCards[i][1];
          }
        }else{
          if(getSuit(turnCards[i][1])==currentSuit && getNumber(turnCards[i][1])>getNumber(winnerCard)){
            winner = turnCards[i][0];
            winnerCard = turnCards[i][1];
          }else if(getSuit(turnCards[i][1])== king){
            winner = turnCards[i][0];
            winnerCard = turnCards[i][1];
          }
        }
        
      }
    break;

   }

   return winner;
    
 }



function initPoker(cards){

  let poker = new Array(52)
  let index=0; 

  for(var i= 0;i<4;i++){
    cards[i] = new Array(13)
    var suit = null;
    switch(i){

      case 0 :
        suit= 'S-';
        //spade
        break;
      case 1 :
        suit= 'H-';
        //heart
        break;
      case 2 :
        suit= 'D-';
        //diamond
        break;
      case 3 :
        suit= 'C-';
        //club
        break;
      default:
      break;      

    }
    
    for(var j=0;j<13;j++){
      
      switch(j){
        case 9 :
        poker[index]=suit+'J';
        index++;
        break;
        case 10 :
        poker[index]=suit+'Q';
        index++;
        break;
        case 11 :
        poker[index]=suit+'K';
        index++;
        break;
        case 12 :
        poker[index]=suit+'A';
        index++;
        break;
        default:
        poker[index]=suit+(j+2);
        index++;
        break;
      }

    }
  }
  return poker;
}


function printCards(cards){
  // let i =0;
  cards.forEach(e=>{
    console.log(e)
  })
}

function arrayToString(arr){
  let res='';
  arr.forEach(e=>{
    res=res+' '+e+ ' ,'
  })
  return res;
}

function getTableCards(turnCards){
  let res='';
  turnCards.forEach(e=>{
    res=res+' '+e[1]+ ' ,'
  })
  return res;
}

function duangToString(duang){
  let res = '';
  for(let i =0;i<duang.length;i++){
    res= res+ ' player '+(i+1)+' have '+duang[i]+ ' duangs , '
  }
  return res;
}



//poker related function

function shuffle(array) {
  console.log('poker shuffling')
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }  

  return array;
}


function deal(players , pokerHands , poker){
  shuffle(poker);
  pokerHands = new Array(players.length);
  for(var j =0;j<pokerHands.length;j++){
      pokerHands[j]=new Array()
    }
  var index = 0;
  for(var i=0;i<(poker.length/pokerHands.length);i++){
    for(var j =0;j<pokerHands.length;j++){
      pokerHands[j].push(poker[index]);
      index++;
    }
  }
  return pokerHands;
}

function showHands(players , pokerHands){
  for(var i = 0 ; i<players.length; i++){
    dm(players[i], arrayToString(pokerHands[i]))
  }
}

function sortCards(hands){

  for(var i =0 ; i<hands.length ; i++ ){
    for(var j= 1; j<hands.length-i ; j++){
      if(getCardIndex(hands[j])<getCardIndex(hands[j-1])){
        var temp = hands[j];
         hands[j]= hands[j-1];
          hands[j-1] = temp;
      }
    }  

  }


}

function sortAllHands(pokerHands){
  pokerHands.forEach(e =>{
    sortCards(e)
  })
  
}

function getCardIndex(card){
  var index = 0;
  for(var i = 0 ; i < order.length ; i++){
    if(card == order[i]){
      index = i;
      break;
    }
  }
  
  return index;
}


function getSuit(card){
  const res = card.split("-")
  const suit = res[0]
  return suit
}

function getNumber(card){
  const res = card.split("-")
  var result=0;
  var num = res[1]
  switch (num){
    case 'J':
      result = 11;
      break;
    case 'Q':
      result = 12;
      break;
    case 'K':
      result = 13;
      break;
    case 'A':
      result = 14;
      break;
    default :
      result = parseInt(num)        
      break;
  }
  
  
  return result
}