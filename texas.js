var _ = require('underscore')

/**
 * analyzeIntCardsInfo group by color and num
 */
function analyzeIntCardsInfo(cards){
	if (!cards || cards.length < 5){
		return null
	}

	// sort
	var sortedCards = _.sortBy(cards, function (a) { return 54-a%13;})

	// color
	var colorTable = {}
	var numTable = {}
	for (var i = 0; i < sortedCards.length; ++i){
		var card = sortedCards[i]
		var color = Math.floor(card / 13)
		var num = card % 13

		var tbl = colorTable[color] || []
		colorTable[color] = tbl
		tbl.push(card)

		var tbl = numTable[num] || []
		numTable[num] = tbl
		tbl.push(card)
	}

	var colorArray = []
	for (var i = 0; i < 4; ++i){
		var tbl = colorTable[i]
		if (tbl){
			colorArray.push(tbl)
		}
	}
	colorArray.sort(function (a, b) {return a.length < b.length;})

	var numArray = []
	for (var num in numTable){
		var tbl = numTable[num]
		numArray.push(tbl)
	}
	numArray.sort(function (a, b) {
		if (a.length == b.length){
			return a[0]%13 < b[0]%13
		}
		return a.length < b.length;})

	return {sortedCards:sortedCards,
			colorTable:colorArray,
			numTable:numArray
		   }
}

/**
 * search straight cards from cards
 */
function searchStraightFromCards(cards){
	if (!cards || cards.length < 5) return null
	var collected = []
	var tempI = 0
	while (true){
		var curLength = collected.length
		if (curLength == 5) break
		if (curLength == 0){
			collected.push(cards[tempI])
		}
		else {
			var lastNum = collected[curLength-1]%13
			var curCard = cards[tempI]
			if ((lastNum-curCard%13) == 1){
				collected.push(curCard)
			}else if (lastNum > curCard%13){
				collected.splice(0)
				collected.push(curCard)
			}
		}
		tempI++
		if (tempI >= cards.length) break
	}

	if (collected.length == 4 && collected[3]%13 == 0 && cards[0]%13 == 12)
		collected.push(cards[0])
	return collected.length == 5 ? collected : null
}

/**
 * compress cards typecontent to  compare int value
 */
function cardsTypeCmpValueFrom(cmpType, content){
	if (cmpType < 1 || cmpType > 10) return -1
	var cmpValue = cmpType << 20
	
	for (var i = 0; i < 5; i++){
		var card = content[i]
		if (!card) break
		var num = card%13
		cmpValue |= (num << (4*(4-i)))
	}
	return cmpValue
}

/**
 * calc cards type
 */
function calcIntCardsTypeInfo(cards){
	if (!cards || cards.length < 5){
		return {type:"null", inputCards:cards, typeContent:[]}
	}

	var cardsInfo = analyzeIntCardsInfo(cards)
	var type = 'null'
	var cmpType = -1
	var typeContentCards = null

	// straight flush
	for (var i = 0; i < cardsInfo.colorTable.length; ++i){
		if (cardsInfo.colorTable[0].length < 5) break
		var straightCards = searchStraightFromCards(cardsInfo.colorTable[0])
		if (straightCards){
			if (12 == straightCards[0]%13){
				type='royal'
				cmpType = 10
			}else{
				type='straight-flush'
				cmpType = 9
			}
			typeContentCards = straightCards
			break
		}
	}

	if ('straight-flush' == type){}
	// four
	else if (cardsInfo.numTable[0].length == 4){
		type='four'
		cmpType = 8
		typeContentCards = cardsInfo.numTable[0].slice(0, 5)
		var num = typeContentCards[0] % 13
		typeContentCards.push(_.find(cardsInfo.sortedCards, function (card){ return card%13 != num;}))
	}
	// full
	else if (cardsInfo.numTable[0].length == 3 && cardsInfo.numTable[1].length >= 2){
		type='full'
		cmpType = 7
		typeContentCards = cardsInfo.numTable[0].concat(cardsInfo.numTable[1])
		if (typeContentCards.length > 5)
			typeContentCards.pop()
	}
	// flush
	else if (cardsInfo.colorTable[0].length >= 5){
		type='flush'
		cmpType = 6
		typeContentCards = cardsInfo.colorTable[0].slice(0,5)
	}
	// straight
	else if (straightCards = searchStraightFromCards(cardsInfo.sortedCards)){
		type='straight'
		cmpType = 5
		typeContentCards = straightCards
	}	
	// three
	else if (cardsInfo.numTable[0].length == 3){
		type='three'
		cmpType = 4
		typeContentCards = cardsInfo.numTable[0].slice(0,3)
		typeContentCards.push(cardsInfo.numTable[1][0])
		typeContentCards.push(cardsInfo.numTable[2][0])
	}
	// two pairs
	else if (cardsInfo.numTable[0].length == 2 && cardsInfo.numTable[1].length == 2){
		type='two-pair'
		cmpType = 3
		typeContentCards = cardsInfo.numTable[0].concat(cardsInfo.numTable[1])
		typeContentCards.push(cardsInfo.numTable[2][0])
	}
	// one pairs
	else if (cardsInfo.numTable[0].length == 2){
		type='one-pair'
		cmpType = 2
		typeContentCards = cardsInfo.numTable[0].slice(0,2)
		for (var i = 0; i < 3; ++i)
			typeContentCards.push(cardsInfo.numTable[i+1][0])
	}
	// high card
	else{
		type='high'
		cmpType = 1
		typeContentCards = cardsInfo.sortedCards.slice(0, 5)
	}
	

	return {type:type, inputCards:cards, typeContentCards:typeContentCards,
			cmpType:cmpType, 
			// easy use cmpValue to compare two cards
			cmpValue:cardsTypeCmpValueFrom(cmpType, typeContentCards),
		   }
}

module.exports = {
	calcIntCardsTypeInfo:calcIntCardsTypeInfo,
	analyzeIntCardsInfo:analyzeIntCardsInfo
}
