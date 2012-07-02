/**
 * @author sss
 */

var lexer = {
    BAD_TOKEN_ERROR : 11,
    UNKNOWN_TOKEN   : 12
};
lexer.errorMessages = {
    11 : "Bad token! Information:"
};

var TokenType = {
    NUMERIC_LITERAL    : 1,
    COMMENT_LITERAL    : 2,
    STRING_LITERAL     : 3,
    PUNCTUATOR_LITERAL : 4,
    WHITESPACE_LITERAL : 5,
    IDENTIFIER_LITERAL : 6,
    KEYWORD_LITERAL    : 7,
    UNKNOWN            : 8,
    END                : 9
};

var LEXER_RULES = "--LEXER--";
var T_EMPTY = "EMPTY";

var TERMINAL = 231;
var NO_TERMINAL = 230;
var EMPTY = 232;

var START_SYMBOL = "S";
var END_SYMBOL = "$";
var END_POSITION = "END";
var UNUSED_SYMBOl = "##";
var ERROR_OPERATION = 100;
var SHIFT_OPERATION = 101;
var REDUCE_OPERATION = 102;
var SUCCESS_OPERATION = 103;

var FLAG_RULE_CREATE_NODE = "--AN";
var FLAG_RULE_NOT_CREATE_NODE = "--NN"
var FLAG_RULE_FUNCTION = "--F";
var NODE_CREATE_NECESSARY = 9;
var NODE_CREATE = 10;
var NODE_NOT_CREATE = 11;
var LALR_PARSER = 10;
var LR_PARSER = 11;

function Item(pRule, iPos, pExpected) {
    this.pRule = pRule;
    this.iPos = iPos;
    this.pExpected = {};
    this.iIndex = 0;
    this.isNewExpected = true;
    this.pState = null;
    this.iLength = 0;
    if (pExpected) {
        for (var i in pExpected) {
            this.addExpected(i);
        }
    }
}
;
Item.prototype.isEqual_LR0 = function (pItem) {
    return (this.pRule === pItem.pRule && this.iPos === pItem.iPos);
};
Item.prototype.isEqual_LR = function (pItem) {
    if (!(this.pRule === pItem.pRule && this.iPos === pItem.iPos && this.iLength === pItem.iLength)) {
        return false;
    }
    for (var i in this.pExpected) {
        if (!pItem.isExpected(i)) {
            return false;
        }
    }
    return true;
};
Item.prototype.isParentItem = function (pItem) {
    return (this.pRule === pItem.pRule && this.iPos === pItem.iPos + 1);
};
Item.prototype.isChildItem = function (pItem) {
    return (this.pRule === pItem.pRule && this.iPos === pItem.iPos - 1);
};
Item.prototype.toString = function () {
    var sMsg = this.pRule.sLeft + " -> ";
    var sExpected = "";
    var pRight = this.pRule.pRight;
    for (var k = 0; k < pRight.length; k++) {
        if (k === this.iPos) {
            sMsg += ". ";
        }
        sMsg += pRight[k] + " ";
    }
    if (this.iPos === pRight.length) {
        sMsg += ". ";
    }
    if (this.pExpected) {
        sExpected = ", ";
        for (var l in this.pExpected) {
            sExpected += l + "/";
        }
        if (sExpected !== ", ") {
            sMsg += sExpected;
        }
    }
    sMsg = sMsg.slice(0, sMsg.length - 1);
    return sMsg;
};
Item.prototype.isExpected = function (sSymbol) {
    return !!(this.pExpected[sSymbol]);
};
Item.prototype.addExpected = function (sSymbol) {
    if (this.pExpected[sSymbol]) {
        return false;
    }
    this.pExpected[sSymbol] = 1;
    this.isNewExpected = true;
    this.iLength++;
    return true;
};
Item.prototype.mark = function () {
    if (this.iPos === this.pRule.pRight.length) {
        return END_POSITION;
    }
    return this.pRule.pRight[this.iPos];
};
Item.prototype.end = function () {
    return this.pRule.pRight[this.pRule.pRight.length - 1] || T_EMPTY;
};
Item.prototype.nextMarked = function () {
    return this.pRule.pRight[this.iPos + 1] || END_POSITION;
};

function State() {
    this.pItems = [];
    this.pNextStates = {};
    this.iIndex = 0;
    this.nBaseItems = 0;
}
;
State.prototype.push = function (pItem) {
    if (this.pItems.length === 0 || pItem.iPos > 0) {
        this.nBaseItems += 1;
    }
    pItem.pState = this;
    this.pItems.push(pItem);
};
State.prototype.hasItem = function (pItem) {
    var i;
    for (i = 0; i < this.pItems.length; i++) {
        if (this.pItems[i].isEqual_LR0(pItem)) {
            return this.pItems[i];
        }
    }
    return false;
};
State.prototype.toString = function (isBase) {
    var len;
    var sMsg;
    sMsg = "State " + this.iIndex + ":\n";
    var pItems = this.pItems;
    len = isBase ? this.nBaseItems : pItems.length;
    for (var j = 0; j < len; j++) {
        sMsg += "\t\t";
        sMsg += pItems[j].toString();
        sMsg += "\n";
    }
    return sMsg;
};
State.prototype.hasParentItem = function (pItem) {
    var i;
    for (i = 0; i < this.pItems.length; i++) {
        if (this.pItems[i].isParentItem(pItem)) {
            return this.pItems[i];
        }
    }
    return false;
};
State.prototype.hasChildItem = function (pItem) {
    var i;
    for (i = 0; i < this.pItems.length; i++) {
        if (this.pItems[i].isChildItem(pItem)) {
            return this.pItems[i];
        }
    }
    return false;
};
State.prototype.tryPush_LR0 = function (pRule, iPos) {
    var i;
    var pItems = this.pItems;
    for (i = 0; i < pItems.length; i++) {
        if (pItems[i].pRule === pRule && pItems[i].iPos === iPos) {
            return false;
        }
    }
    var pItem = new Item(pRule, iPos);
    this.push(pItem);
    return true;
};
State.prototype.tryPush = function (pRule, iPos, pExpectedSymbol) {
    var i;
    var pItems = this.pItems;
    for (i = 0; i < pItems.length; i++) {
        if (pItems[i].pRule === pRule && pItems[i].iPos === iPos) {
            return pItems[i].addExpected(pExpectedSymbol);
        }
    }
    var pExpected = {};
    pExpected[pExpectedSymbol] = 1;
    var pItem = new Item(pRule, iPos, pExpected, 1);
    this.push(pItem);
    return true;
};
State.prototype.deleteNotBase = function () {
    this.pItems.length = this.nBaseItems;
};
State.prototype.isEqual_LR0 = function (pState) {
    var pItemsA = this.pItems;
    var pItemsB = pState.pItems;
    if (this.nBaseItems !== pState.nBaseItems) {
        return false;
    }
    var nItems = this.nBaseItems;
    var i, j;
    var isEqual;
    for (i = 0; i < nItems; i++) {
        isEqual = false;
        for (j = 0; j < nItems; j++) {
            if (pItemsA[i].isEqual_LR0(pItemsB[j])) {
                isEqual = true;
                break;
            }
        }
        if (!isEqual) {
            return false;
        }
    }
    return true;
};
State.prototype.isEqual_LR = function (pState) {
    var pItemsA = this.pItems;
    var pItemsB = pState.pItems;
    if (this.nBaseItems !== pState.nBaseItems) {
        return false;
    }
    var nItems = this.nBaseItems;
    var i, j;
    var isEqual;
    for (i = 0; i < nItems; i++) {
        isEqual = false;
        for (j = 0; j < nItems; j++) {
            if (pItemsA[i].isEqual_LR(pItemsB[j])) {
                isEqual = true;
                break;
            }
        }
        if (!isEqual) {
            return false;
        }
    }
    return true;
};
State.prototype.isEmpty = function () {
    return !(this.pItems.length);
};

function Rule() {
    this.sLeft = "";
    this.pRight = [];
    this.iIndex = 0;
}
;

function Operation(eType, pParam) {
    this.eType = eType || ERROR_OPERATION;
    this.iIndex = (eType === SHIFT_OPERATION) ? pParam : -1;
    this.pRule = (eType === REDUCE_OPERATION) ? pParam : null;
}
;

//Parser
//function Node(pValue, eType) {
//    this.eType = eType;
//    if (typeof(pValue) === "string") {
//        this.sName = pValue;
//    }
//    else {
//        this.sName = pValue.sName;
//        this.pValue = pValue;
//    }
//    this.pChildren = null;
//    this.pParent = null;
//}
//;

function Tree() {
    this.pRoot = null;
    this._pNodes = [];
    this._pNodesCountStack = [];
}
;
Tree.prototype._addLink = function (pParent, pNode) {
    if (!pParent.pChildren) {
        pParent.pChildren = [];
    }
    pParent.pChildren.push(pNode);
    pNode.pParent = pParent;
};
Tree.prototype.setRoot = function () {
    this.pRoot = this._pNodes.pop();
};
Tree.prototype.addNode = function (pNode) {
    this._pNodes.push(pNode);
    this._pNodesCountStack.push(1);
};
Tree.prototype.reduceByRule = function (pRule, isCreate, isOptimize) {
    isCreate = isCreate || NODE_CREATE;

    var iReduceCount = 0;
    var pNodesCountStack = this._pNodesCountStack;
    var pNode;
    var iRuleLength = pRule.pRight.length;
    var pNodes = this._pNodes;
    var nOptimize = isOptimize ? 1 : 0;

    while (iRuleLength) {
        iReduceCount += pNodesCountStack.pop();
        iRuleLength--;
    }
    if ((isCreate === NODE_CREATE && iReduceCount > nOptimize) || (isCreate === NODE_CREATE_NECESSARY)) {
        pNode = { sName : pRule.sLeft };
        while (iReduceCount) {
            this._addLink(pNode, pNodes.pop());
            iReduceCount -= 1;
        }
        pNodes.push(pNode);
        pNodesCountStack.push(1);
    }
    else {
        pNodesCountStack.push(iReduceCount);
    }
};
Tree.prototype.toString = function (pNode, sPadding) {
    sPadding = sPadding || "";
    var sRes = sPadding + "{\n";
    var sOldPadding = sPadding;
    var sDefaultPadding = "  ";
    sPadding += sDefaultPadding;
    if (pNode.sValue) {
        sRes += sPadding + "name : \"" + pNode.sName + "\"" + ",\n";
        sRes += sPadding + "value : \"" + pNode.sValue + "\"" + "\n";
    }
    else {
        var i;
        sRes += sPadding + "name : \"" + pNode.sName + "\"" + "\n";
        sRes += sPadding + "children : [";
        if (pNode.pChildren) {
            sRes += "\n";
            sPadding += sDefaultPadding;
            for (i = pNode.pChildren.length - 1; i >= 0; i--) {
                sRes += this.toString(pNode.pChildren[i], sPadding);
                sRes += ",\n";
            }
            sRes = sRes.slice(0, sRes.length - 2);
            sRes += "\n";
            sRes += sOldPadding + sDefaultPadding + "]\n";
        }
        else {
            sRes += " ]\n";
        }
    }
    sRes += sOldPadding + "}";
    return sRes;
};
Tree.prototype.toHTMLString = function (pNode, sPadding) {
    sPadding = sPadding || "";
    var sRes = sPadding + "{\n";
    var sOldPadding = sPadding;
    var sDefaultPadding = "  ";
    sPadding += sDefaultPadding;
    if (pNode.sValue) {
        sRes += sPadding + "<b style=\"color: #458383;\">name</b>: \"" + pNode.sName + "\"" + ",\n";
        sRes += sPadding + "<b style=\"color: #458383;\">value</b>: \"" + pNode.sValue + "\"" + ",\n";
        sRes += sPadding + "<b style=\"color: #458383;\">line</b>: \"" + pNode.iLine + "\"" + ",\n";
        sRes += sPadding + "<b style=\"color: #458383;\">column</b>: \"" + pNode.iStart + "\"" + "\n";
    }
    else {
        var i;
        sRes += sPadding + "<i style=\"color: #8A2BE2;\">name</i>: \"" + pNode.sName + "\"" + "\n";
        sRes += sPadding + "<i style=\"color: #8A2BE2;\">children</i>: [";
        if (pNode.pChildren) {
            sRes += "\n";
            sPadding += sDefaultPadding;
            for (i = pNode.pChildren.length - 1; i >= 0; i--) {
                sRes += this.toHTMLString(pNode.pChildren[i], sPadding);
                sRes += ",\n";
            }
            sRes = sRes.slice(0, sRes.length - 2);
            sRes += "\n";
            sRes += sOldPadding + sDefaultPadding + "]\n";
        }
        else {
            sRes += " ]\n";
        }
    }
    sRes += sOldPadding + "}";
    return sRes;
};
Tree.prototype.toTreeView = function (pNode) {
    var pRes = {};
    if (pNode.sValue) {
        pRes.label = pNode.sName + ": " + pNode.sValue;
    }
    else {
        pRes.label = pNode.sName;
        if (pNode.pChildren) {
            pRes.children = [];
            pRes.expanded = true;
            for (var i = pNode.pChildren.length - 1; i >= 0; i--) {
                pRes.children.push(this.toTreeView(pNode.pChildren[i]));
            }
        }
    }
    return pRes;
};
function Parser() {
    //Input
    this.sSource = "";
    this.iIndex = 0;

    //Process params
    this._pLex = null;
    this._pStack = null;

    //Grammar Info
    this._pSymbols = {
        '$' : 1
    };
    this._ppSynatxTable = null;
    this._ppReduceOperations = null;
    this._pSuccessOperation = null;
    this._ppShiftOperations = null;
    this._ppFirstTerminal = null;
    this._ppFollowTerminal = null;
    this._ppRules = null;
    this._pStates = null;
    this._nRules = 0;
    this._pRuleFunction = null;
    this._pAdditionalFunctions = {
        addType : this.addType
    };
    //
    this.eType = 0;
    //Temp
    this._pStatesTemp = null;
    this._pBaseItemsIndex = null;
    this._pExpectedExtensionTable = null;

    //Output parse info
    this.pSyntaxTree = null;
    this.pSymbolTable = null;

    //Additional info
    this._pSymbolsWithNodes = null;
    this._isAllNodeMode = false;
    this._isNegateMode = true;
    this._isAddMode = true;
    this._isOptimizeMode = true;
}
;
Parser.prototype._error = function () {
    var pErr = new Error();
    pErr.arguments = arguments;
    throw pErr;
};
Parser.prototype._clearMem = function () {
    delete this._ppFirstTerminal;
    delete this._ppFollowTerminal;
    delete this._ppRules;
    delete this._pStates;
    delete this._ppReduceOperations;
    delete this._ppShiftOperations;
    delete this._pSuccessOperation;
    delete this._pStatesTemp;
    delete this._pBaseItemsIndex;
    delete this._pExpectedExtensionTable;
};
Parser.prototype._hasState_LR0 = function (pState) {
    var pStates = this._pStates;
    var i;
    for (i = 0; i < pStates.length; i++) {
        if (pStates[i].isEqual_LR0(pState)) {
            return pStates[i];
        }
    }
    return false;
};
Parser.prototype._hasState_LR = function (pState) {
    var pStates = this._pStates;
    var i;
    for (i = 0; i < pStates.length; i++) {
        if (pStates[i].isEqual_LR(pState)) {
            return pStates[i];
        }
    }
    return false;
};
Parser.prototype._isTerminal = function (sSymbol) {
    return !(this._ppRules[sSymbol]);
};
Parser.prototype._pushState = function (pState) {
    pState.iIndex = this._pStates.length;
    this._pStates.push(pState);
};
Parser.prototype._pushBaseItem = function (pItem) {
    pItem.iIndex = this._pBaseItemsIndex.length;
    this._pBaseItemsIndex.push(pItem);
};
Parser.prototype._tryAddState_LR = function (pState) {
    var pRes = this._hasState_LR(pState);
    if (!pRes) {
        this._pushState(pState);
        this._closure(pState);
        return pState;
    }
    return pRes;
};
Parser.prototype._tryAddState_LR0 = function (pState) {
    var pRes = this._hasState_LR0(pState);
    if (!pRes) {
        var i;
        for (i = 0; i < pState.pItems.length; i++) {
            this._pushBaseItem(pState.pItems[i]);
        }
        this._pushState(pState);
        this._closure_LR0(pState);
        return pState;
    }
    return pRes;
};
Parser.prototype._hasEmptyRule = function (sSymbol) {
    if (this._isTerminal(sSymbol)) {
        return false;
    }
    var i;
    for (i in this._ppRules[sSymbol]) {
        if (this._ppRules[sSymbol][i].pRight.length === 0) {
            return true;
        }
    }
    return false;
};
Parser.prototype._pushInSyntaxTable = function (iIndex, sSymbol, pOperation) {
    if (!this._ppSynatxTable[iIndex]) {
        this._ppSynatxTable[iIndex] = {};
    }
    if (this._ppSynatxTable[iIndex][sSymbol]) {
        this._error("Grammar is not LALR(1)!", "State:", this._pStates[iIndex], "Symbol:", sSymbol, ":",
                    "Old value:", this._ppSynatxTable[iIndex][sSymbol], "New Value: ", pOperation);
    }
    this._ppSynatxTable[iIndex][sSymbol] = pOperation;
};
Parser.prototype._addStateLink = function (pState, pNextState, sSymbol) {
    if (pState.pNextStates[sSymbol]) {
        this._error("AddlinkState: Grammar is not LALR(1)! Rewrite link!", "State", pState, "Link to", pNextState,
                    "Symbol", sSymbol);
    }
    pState.pNextStates[sSymbol] = pNextState;
};
Parser.prototype._firstTerminal = function (sSymbol) {
    if (this._isTerminal(sSymbol)) {
        return sSymbol;
    }
    if (this._ppFirstTerminal[sSymbol]) {
        return this._ppFirstTerminal[sSymbol];
    }
    var i, j, k;
    var pRules = this._ppRules[sSymbol];
    var pTempRes = {};
    var pRight;
    var pRes;
    var isFinish;
    pRes = this._ppFirstTerminal[sSymbol] = {};
    if (this._hasEmptyRule(sSymbol)) {
        pRes[T_EMPTY] = 1;
    }
    for (i in pRules) {
        isFinish = false;
        pRight = pRules[i].pRight;
        for (j = 0; j < pRight.length; j++) {
            if (pRight[j] === sSymbol) {
                if (pRes[T_EMPTY]) {
                    continue;
                }
                isFinish = true;
                break;
            }
            pTempRes = this._firstTerminal(pRight[j]);
            if (typeof(pTempRes) === "string") {
                pRes[pTempRes] = 1;
            }
            else {
                for (k in pTempRes) {
                    pRes[k] = 1;
                }
            }
            if (!this._hasEmptyRule(pRight[j])) {
                isFinish = true;
                break;
            }
        }
        if (!isFinish) {
            pRes[T_EMPTY] = 1;
        }
    }
    return pRes;
};
Parser.prototype._followTerminal = function (sSymbol) {
    if (this._ppFollowTerminal[sSymbol]) {
        return this._ppFollowTerminal[sSymbol];
    }
    var pRes;
    var pTempRes;
    var pRules = this._ppRules;
    var i, j, k, l, m;
    var pRight;
    var isFinish;
    pRes = this._ppFollowTerminal[sSymbol] = {};
    for (i in pRules) {
        for (j in pRules[i]) {
            pRight = pRules[i][j].pRight;
            for (k = 0; k < pRight.length; k++) {
                if (pRight[k] === sSymbol) {
                    if (k === pRight.length - 1) {
                        pTempRes = this._followTerminal(pRules[i][j].sLeft);
                        for (m in pTempRes) {
                            pRes[m] = 1;
                        }
                    }
                    else {
                        isFinish = false;
                        for (l = k + 1; l < pRight.length; l++) {
                            pTempRes = this._firstTerminal(pRight[l]);
                            if (typeof(pTempRes) === "string") {
                                pRes[pTempRes] = 1;
                                isFinish = true;
                                break;
                            }
                            else {
                                for (m in pTempRes) {
                                    pRes[m] = 1;
                                }
                            }
                            if (!pTempRes[T_EMPTY]) {
                                isFinish = true;
                                break;
                            }
                        }
                        if (!isFinish) {
                            pTempRes = this._followTerminal(pRules[i][j].sLeft);
                            for (m in pTempRes) {
                                pRes[m] = 1;
                            }
                        }
                    }
                }
            }
        }
    }
    return pRes;
};
Parser.prototype._firstTerminalForSet = function (pSet, pExpected) {
    var pRes = {};
    var pTempRes;
    var i, j;
    var isEmpty;
    for (i in pSet) {
        pTempRes = this._firstTerminal(pSet[i]);
        if (typeof(pTempRes) === "string") {
            pRes[pTempRes] = 1;
            return pRes;
        }
        isEmpty = false;
        for (j in pTempRes) {
            if (j === T_EMPTY) {
                isEmpty = true;
                continue;
            }
            pRes[j] = 1;
        }
        if (!isEmpty) {
            return pRes;
        }
    }
    for (i in pExpected) {
        pRes[i] = 1;
    }
    return pRes;
};
Parser.prototype._generateRules = function (sSource) {
    var pRuleArray = sSource.split(/\r?\n/);
    var pTempArr;
    var pRule;
    var isLexer = false;
    this._ppRules = {};
    this._pPunctuators = {};
    this._pKeywords = {};
    this._pRuleFunction = {};
    this._pSymbolsWithNodes = {};
    var i, j, k;
    for (i = 0; i < pRuleArray.length; i++) {
        if (pRuleArray[i] === "" || pRuleArray[i] === "\r") {
            continue;
        }
        pTempArr = pRuleArray[i].split(/\s* \s*/);
        if (isLexer) {
            if ((pTempArr.length === 3 || (pTempArr.length === 4 && pTempArr[3] === "")) &&
                ((pTempArr[2][0] === "\"" || pTempArr[2][0] === "'") && pTempArr[2].length > 3)) {
                //TERMINALS
                if (pTempArr[2][0] !== pTempArr[2][pTempArr[2].length - 1]) {
                    this._error("Can`t generate rules from grammar! Unexpected symbol! Must be")
                }
                pTempArr[2] = pTempArr[2].slice(1, pTempArr[2].length - 1);
                var ch = pTempArr[2][0];
                if ((ch === '_') || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
                    this._pLex.addKeyword(pTempArr[2], pTempArr[0]);
                }
                else {
                    this._pLex.addPunctuator(pTempArr[2], pTempArr[0]);
                }
            }
            continue;
        }
        if (pTempArr[0] === LEXER_RULES) {
            isLexer = true;
            continue;
        }
        else {
            //NON TERMINALS RULES
            if (!this._ppRules[pTempArr[0]]) {
                this._ppRules[pTempArr[0]] = {};
            }
            pRule = new Rule();
            pRule.sLeft = pTempArr[0];
            this._pSymbols[pTempArr[0]] = 1;
            if (this._isAllNodeMode) {
                console.log(111);
                this._pSymbolsWithNodes[pTempArr[0]] = NODE_CREATE;
            }
            else {
                if (this._isNegateMode) {
                    if (this._pSymbolsWithNodes[pTempArr[0]] === undefined) {
                        this._pSymbolsWithNodes[pTempArr[0]] = NODE_CREATE;
                    }
                }
                else if (this._isAddMode) {
                    if (this._pSymbolsWithNodes[pTempArr[0]] === undefined) {
                        this._pSymbolsWithNodes[pTempArr[0]] = NODE_NOT_CREATE;
                    }
                }
            }
            for (var j = 2; j < pTempArr.length; j++) {
                if (pTempArr[j] === "") {
                    continue;
                }
                if (pTempArr[j] === FLAG_RULE_CREATE_NODE) {
                    if (this._isAddMode) {
                        this._pSymbolsWithNodes[pTempArr[0]] = NODE_CREATE_NECESSARY;
                    }
                    continue;
                }
                if (pTempArr[j] === FLAG_RULE_NOT_CREATE_NODE) {
                    if (this._isNegateMode && !this._isAllNodeMode) {
                        this._pSymbolsWithNodes[pTempArr[0]] = NODE_NOT_CREATE;
                    }
                    continue;
                }
                if (pTempArr[j] === FLAG_RULE_FUNCTION) {
                    if ((!pTempArr[j + 1] || pTempArr[j + 1].length === 0)) {
                        this._error("Can`t generate rule for grammar! Addititional functionhas has bad name");
                    }
                    this._pRuleFunction[this._nRules] = pTempArr[j + 1];
                    j++;
                    continue;
                }
                if (pTempArr[j][0] === "'" || pTempArr[j][0] === "\"") {
                    if (pTempArr[j].length !== 3) {
                        this._error("Can`t generate rules from grammar! Keywords must be rules");
                    }
                    if (pTempArr[j][0] !== pTempArr[j][2]) {
                        this._error("Can`t generate rules from grammar! Unexpected symbol! Must be");
                    }
                    var sName = this._pLex.addPunctuator(pTempArr[j][1]);
                    pRule.pRight.push(sName);
                    this._pSymbols[sName] = 1;
                }
                else {
                    pRule.pRight.push(pTempArr[j]);
                    this._pSymbols[pTempArr[j]] = 1;
                }
            }
            pRule.iIndex = this._nRules;
            this._ppRules[pTempArr[0]][pRule.iIndex] = pRule;
            this._nRules += 1;
        }
    }
};

Parser.prototype._generateFirstState_LR0 = function () {
    var pState = new State();
    var pItem = new Item(this._ppRules[START_SYMBOL][0], 0);
    this._pushBaseItem(pItem);
    pState.push(pItem);
    this._closure_LR0(pState);
    this._pushState(pState);
};
Parser.prototype._generateFirstState_LR = function () {
    var pState = new State();
    var pExpected = {};
    pExpected[END_SYMBOL] = 1;
    pState.push(new Item(this._ppRules[START_SYMBOL][0], 0, pExpected));
    this._closure(pState);
    this._pushState(pState);
};

Parser.prototype._closure_LR0 = function (pState) {
    var pItems = pState.pItems;
    var i, j;
    var sSymbol;
    for (i = 0; i < pItems.length; i++) {
        sSymbol = pItems[i].mark();
        if (sSymbol !== END_POSITION && (!this._isTerminal(sSymbol))) {
            for (j in this._ppRules[sSymbol]) {
                pState.tryPush_LR0(this._ppRules[sSymbol][j], 0);
            }
        }
    }
    return pState;
};
Parser.prototype._closure = function (pState) {
    var pItems = pState.pItems;
    var i = 0, j, k;
    var sSymbol;
    var pSymbols;
    var pTempSet;
    var isNewExpected = false;
    while (1) {
        if (i === pItems.length) {
            if (!isNewExpected) {
                break;
            }
            i = 0;
            isNewExpected = false;
        }
        sSymbol = pItems[i].mark();
        if (sSymbol !== END_POSITION && (!this._isTerminal(sSymbol))) {
            pTempSet = pItems[i].pRule.pRight.slice(pItems[i].iPos + 1);
            pSymbols = this._firstTerminalForSet(pTempSet, pItems[i].pExpected);
            for (j in this._ppRules[sSymbol]) {
                for (k in pSymbols) {
                    if (pState.tryPush(this._ppRules[sSymbol][j], 0, k)) {
                        isNewExpected = true;
                    }
                }
            }
        }
        i++;
    }
    return pState;
};

Parser.prototype._nextState_LR0 = function (pState, sSymbol) {
    var pItems = pState.pItems;
    var i;
    var pNewState = new State();
    for (i = 0; i < pItems.length; i++) {
        if (sSymbol === pItems[i].mark()) {
            pNewState.push(new Item(pItems[i].pRule, pItems[i].iPos + 1));
        }
    }
    return pNewState;
};
Parser.prototype._nextState_LR = function (pState, sSymbol) {
    var pItems = pState.pItems;
    var i, j;
    var pNewState = new State();
    for (i = 0; i < pItems.length; i++) {
        if (sSymbol === pItems[i].mark()) {
            pNewState.push(new Item(pItems[i].pRule, pItems[i].iPos + 1, pItems[i].pExpected));
        }
    }
    return pNewState;
};

Parser.prototype._deleteNotBaseItems = function () {
    var i;
    for (i in this._pStates) {
        this._pStates[i].deleteNotBase();
    }
};
Parser.prototype._closureForItem = function (pRule, iPos) {
    var sIndex = "";
    sIndex += pRule.iIndex + "_" + iPos;
    var pState = this._pStatesTemp[sIndex];
    if (pState) {
        return pState;
    }
    else {
        pState = new State();
        pState.push(new Item(pRule, iPos, {'##' : 1}));
        this._closure(pState);
        this._pStatesTemp[sIndex] = pState;
        return pState;
    }
};
Parser.prototype._addLinkExpected = function (pItem, pItemX) {
    var pTable = this._pExpectedExtensionTable;
    var iIndex = pItem.iIndex;
    if (!pTable[iIndex]) {
        pTable[iIndex] = {};
    }
    pTable[iIndex][pItemX.iIndex] = 1;
};
Parser.prototype._determineExpected = function (pTestState, sSymbol) {
    var pStateX = pTestState.pNextStates[sSymbol];
    if (pStateX) {
        var pItemsX = pStateX.pItems;
        var pState;
        var pItem;
        var i, j, k;
        var pItems = pTestState.pItems;
        for (i = 0; i < pTestState.nBaseItems; i++) {
            pState = this._closureForItem(pItems[i].pRule, pItems[i].iPos);
            for (j = 0; j < pStateX.nBaseItems; j++) {
                pItem = pState.hasChildItem(pItemsX[j]);
                if (pItem) {
                    for (k in pItem.pExpected) {
                        if (k === UNUSED_SYMBOl) {
                            this._addLinkExpected(pItems[i], pItemsX[j]);
                        }
                        else {
                            pItemsX[j].addExpected(k);
                        }
                    }
                }
            }
        }
    }
};
Parser.prototype._generateLinksExpected = function () {
    var i, j;
    var pStates = this._pStates;
    for (i = 0; i < pStates.length; i++) {
        for (j in this._pSymbols) {
            this._determineExpected(pStates[i], j);
        }
    }
};
Parser.prototype._expandExpected = function () {
    var pItems = this._pBaseItemsIndex;
    var pTable = this._pExpectedExtensionTable;
    var i = 0, j;
    var sSymbol;
    var isNewExpected = false;
    pItems[0].pExpected[END_SYMBOL] = 1;
    pItems[0].isNewExpected = true;
    while (1) {
        if (i === pItems.length) {
            if (!isNewExpected) {
                break;
            }
            isNewExpected = false;
            i = 0;
        }
        if (pItems[i].isNewExpected) {
            for (sSymbol in pItems[i].pExpected) {
                for (j in pTable[i]) {
                    if (pItems[j].addExpected(sSymbol)) {
                        isNewExpected = true;
                    }
                }
            }
        }
        pItems[i].isNewExpected = false;
        i++;
    }
};

Parser.prototype._generateStates_LR0 = function () {
    this._generateFirstState_LR0();
    var i;
    var pStates = this._pStates;
    var sSymbol;
    var pState;
    for (i = 0; i < pStates.length; i++) {
        for (sSymbol in this._pSymbols) {
            pState = this._nextState_LR0(pStates[i], sSymbol);
            if (!pState.isEmpty()) {
                pState = this._tryAddState_LR0(pState);
                this._addStateLink(pStates[i], pState, sSymbol);
            }
        }
    }
};
Parser.prototype._generateStates_LR = function () {
    this._ppFirstTerminal = {};

    this._generateFirstState_LR();
    var i;
    var pStates = this._pStates;
    var sSymbol;
    var pState;
    for (i = 0; i < pStates.length; i++) {
        for (sSymbol in this._pSymbols) {
            pState = this._nextState_LR(pStates[i], sSymbol);
            if (!pState.isEmpty()) {
                pState = this._tryAddState_LR(pState);
                this._addStateLink(pStates[i], pState, sSymbol);
            }
        }
    }
};
Parser.prototype._generateStates_LALR = function () {
    this._pStatesTemp = {};
    this._pBaseItemsIndex = [];
    this._pExpectedExtensionTable = {};
    this._ppFirstTerminal = {};

    this._generateStates_LR0();
    this._deleteNotBaseItems();
    this._generateLinksExpected();
    this._expandExpected();

    var i;
    var pStates = this._pStates;
    for (i = 0; i < pStates.length; i++) {
        this._closure(pStates[i]);
    }
};

Parser.prototype._calcBaseItem = function () {
    var num = 0;
    for (var i in this._pStates) {
        num += this._pStates[i].nBaseItems
    }
    console.log("Num of base items : ", num);
    return num;
};
Parser.prototype._printStates = function (isBase) {
    var sMsg = "";
    var i;
    for (i = 0; i < this._pStates.length; i++) {
        sMsg += this._printState(this._pStates[i], isBase) + " ";
    }
};
Parser.prototype._printState = function (pState, isBase) {
    var sMsg = pState.toString(isBase);
    console.log(sMsg);
    return sMsg;
};
Parser.prototype._printExpectedTable = function () {
    var i, j;
    var sMsg = "";
    for (i in this._pExpectedExtensionTable) {
        sMsg += "State " + this._pBaseItemsIndex[i].pState.iIndex + ":   ";
        sMsg += this._pBaseItemsIndex[i].toString() + "  |----->\n";
        for (j in this._pExpectedExtensionTable[i]) {
            sMsg += "\t\t\t\t\t" + "State " + this._pBaseItemsIndex[j].pState.iIndex + ":   ";
            sMsg += this._pBaseItemsIndex[j].toString() + "\n";
        }
        sMsg += "\n";
    }
    console.log(sMsg);
};

Parser.prototype._addReducing = function (pState) {
    var i, j;
    var pItems = pState.pItems;
    for (i = 0; i < pItems.length; i++) {
        if (pItems[i].mark() === END_POSITION) {
            if (pItems[i].pRule.sLeft === START_SYMBOL) {
                this._pushInSyntaxTable(pState.iIndex, END_SYMBOL, this._pSuccessOperation);
            }
            else {
                for (j in pItems[i].pExpected) {
                    this._pushInSyntaxTable(pState.iIndex, j, this._ppReduceOperations[pItems[i].pRule.iIndex]);
                }
            }
        }
    }
};
Parser.prototype._addShift = function (pState) {
    var i;
    var pStates = pState.pNextStates;
    for (i in pStates) {
        this._pushInSyntaxTable(pState.iIndex, i, this._ppShiftOperations[pStates[i].iIndex]);
    }
};
Parser.prototype._buildSyntaxTable = function () {
    var i, j;
    this._pStates = [];
    var pStates = this._pStates;
    var pState;
    //Generate states
    if (this.eType === LALR_PARSER) {
        this._generateStates_LALR();
    }
    else if (this.eType === LR_PARSER) {
        this._generateStates_LR();
    }
    //Init necessary properties
    this._ppSynatxTable = {};
    this._ppReduceOperations = {};
    this._pSuccessOperation = new Operation(SUCCESS_OPERATION);
    this._ppShiftOperations = {};
    for (i = 0; i < pStates.length; i++) {
        this._ppShiftOperations[pStates[i].iIndex] = new Operation(SHIFT_OPERATION, pStates[i].iIndex);
    }
    for (i in this._ppRules) {
        for (j in this._ppRules[i]) {
            this._ppReduceOperations[j] = new Operation(REDUCE_OPERATION, this._ppRules[i][j]);
        }
    }
    //Build syntax table
    for (i = 0; i < pStates.length; i++) {
        pState = pStates[i];
        this._addReducing(pState);
        this._addShift(pState);
    }
};

Parser.prototype._readToken = function () {
    return this._pLex.getNextToken();
};
Parser.prototype._ruleAction = function (pRule) {
    this.pSyntaxTree.reduceByRule(pRule, this._pSymbolsWithNodes[pRule.sLeft], this._isOptimizeMode);
    var pActionName = this._pRuleFunction[pRule.iIndex];
    if (pActionName) {
        (this._pAdditionalFunctions[pActionName]).call(this, pRule);
    }
};
Parser.prototype.addType = function (pRule) {
    var pTree = this.pSyntaxTree;
    var pNode = pTree._pNodes[pTree._pNodes.length - 1];
    pNode = pNode.pChildren[pNode.pChildren.length - 1];
//    console.log(pNode)
    var sName = pNode.pChildren[pNode.pChildren.length - 2].sValue;
    this.pSymbolTable[sName] = {isType : 1};
//    var pTree = this.pSyntaxTree;
//    var pNode = pTree._pNodes[pTree._pNodes.length - 1];
//    pNode = pNode.pChildren[pNode.pChildren.length - 1];
//    pNode = pNode.pChildren[pNode.pChildren.length - 2];
//    pNode = pNode.pChildren[pNode.pChildren.length - 1];
//    pNode = pNode.pChildren[pNode.pChildren.length - 1];
//    console.log(pNode)
//    var sName = pNode.sValue;
//    this.pSymbolTable[sName] = {isType : 1};
};
Parser.prototype.isTypeId = function (sValue) {
    return !!(this.pSymbolTable[sValue] && this.pSymbolTable[sValue].isType);
};

Parser.prototype.returnCode = function (pNode) {
    if (pNode) {
        if (pNode.sValue) {
            return pNode.sValue + " ";
        }
        else if (pNode.pChildren) {
            var sCode = "";
            var i;
            for (i = pNode.pChildren.length - 1; i >= 0; i--) {
                sCode += this.returnCode(pNode.pChildren[i]);
            }
            return sCode;
        }
    }
    return "";
};
Parser.prototype.init = function (sGrammar, eType, pFlags) {
    try {
        this.eType = eType || LALR_PARSER;
        this._pLex = new Lexer(this);
        if (pFlags) {
            this._isAddMode = pFlags.addMode || false;
            this._isNegateMode = pFlags.negateMode || false;
            this._isAllNodeMode = pFlags.allMode || false;
            this._isOptimizeMode = pFlags.optimizeMode || false;
            console.log(pFlags, this);
        }
        this._generateRules(sGrammar);
        this._buildSyntaxTable();
        this._clearMem();
        return true;
    }
    catch (e) {
        console.error(e.stack, e.arguments);
        return false;
    }
};
Parser.prototype.parse = function (sSource) {
    try {
        this.sSource = sSource;
        this.iIndex = 0;
        this._pLex.init(sSource);
        this._pStack = [0];
        this.pSyntaxTree = new Tree();
        this.pSymbolTable = {
            float2   : {isType : 1},
            float3   : {isType : 1},
            float4   : {isType : 1},
            float2x2 : {isType : 1},
            float3x3 : {isType : 1},
            float4x4 : {isType : 1}
        };

        var pTree = this.pSyntaxTree;
        var pStack = this._pStack;
        var ppSyntaxTable = this._ppSynatxTable;

        var isStop = false;
        var isError = false;
        var pToken = this._readToken();

        var pOperation;
        var iRuleLength;

        while (!isStop) {
            pOperation = ppSyntaxTable[pStack[pStack.length - 1]][pToken.sName];
            if (pOperation) {
                switch (pOperation.eType) {
                    case SUCCESS_OPERATION:
                        isStop = true;
                        break;
                    case SHIFT_OPERATION:
                        pStack.push(pOperation.iIndex);
                        pTree.addNode(pToken);
                        pToken = this._readToken();
                        break;
                    case REDUCE_OPERATION:
                        iRuleLength = pOperation.pRule.pRight.length;
                        pStack.length -= iRuleLength;
                        pStack.push(ppSyntaxTable[pStack[pStack.length - 1]][pOperation.pRule.sLeft].iIndex);
                        this._ruleAction(pOperation.pRule);
                        break;
                }
            }
            else {
                isError = true;
                isStop = true;
            }
        }
        if (!isError) {
            pTree.setRoot();
            console.log("All good!!!!");
            console.log("Syntax Tree", pTree);
            return true;
        }
        else {
            console.log("Error!!!", pToken);
            return pToken;
        }
    }
    catch (e) {
        console.error(e.stack);
    }
}
;

function Lexer(pParser) {
    this.iLineNumber = 0;
    this.iColumnNumber = 0;
    this.sSource = "";
    this.iIndex = 0;
    this.pParser = pParser || null;
    this._pPunctuators = {};
    this._pKeywords = {};
    this._pPunctuatorsFirstSymbols = {};
}
;
Lexer.prototype.addPunctuator = function (sValue, sName) {
    if (!sName && sValue.length === 1) {
        sName = "T_PUNCTUATOR_" + sValue.charCodeAt(0);

    }
    this._pPunctuators[sValue] = sName;
    this._pPunctuatorsFirstSymbols[sValue[0]] = 1;
    return sName;
};
Lexer.prototype.addKeyword = function (sValue, sName) {
    this._pKeywords[sValue] = sName;
};
Lexer.prototype.init = function (sSource) {
    this.sSource = sSource;
    this.iLineNumber = 0;
    this.iColumnNumber = 0;
    this.iIndex = 0;
};
Lexer.prototype.getNextToken = function () {
    var ch = this._currentChar();
    if (!ch) {
        return {
            sName  : END_SYMBOL,
            sValue : END_SYMBOL,
            iStart : this.iColumnNumber,
            iEnd   : this.iColumnNumber,
            iLine  : this.iLineNumber
        };
    }
    var eType = this._identifyTokenType(ch);
    var pToken;
    switch (eType) {
        case TokenType.NUMERIC_LITERAL:
            pToken = this._scanNumber();
            break;
        case TokenType.COMMENT_LITERAL:
            this._scanComment();
            pToken = this.getNextToken();
            break;
        case TokenType.STRING_LITERAL:
            pToken = this._scanString();
            break;
        case TokenType.PUNCTUATOR_LITERAL:
            pToken = this._scanPunctuator();
            break;
        case TokenType.KEYWORD_LITERAL:
            pToken = this._scanKeyWord();
            break;
        case TokenType.IDENTIFIER_LITERAL:
            pToken = this._scanIdentifier();
            break;
        case TokenType.WHITESPACE_LITERAL:
            this._scanWhiteSpace();
            pToken = this.getNextToken();
            break;
        default:
            this._error(lexer.UNKNOWN_TOKEN,
                        {
                            sValue : ch + this.sSource[this.iIndex + 1],
                            iStart : this.iColumnNumber,
                            iLine  : this.iLineNumber
                        });
    }
    return pToken;
};

Lexer.prototype._error = function (sMsg, pInfo) {
    if (sMsg === lexer.BAD_TOKEN_ERROR) {
        console.error(lexer.errorMessages[sMsg], pInfo);
    }

};
Lexer.prototype._identifyTokenType = function () {
    if (this._isIdentifierStart()) {
        return TokenType.IDENTIFIER_LITERAL;
    }
    if (this._isWhiteSpaceStart()) {
        return TokenType.WHITESPACE_LITERAL;
    }
    if (this._isStringStart()) {
        return TokenType.STRING_LITERAL;
    }
    if (this._isCommentStart()) {
        return TokenType.COMMENT_LITERAL;
    }
    if (this._isNumberStart()) {
        return TokenType.NUMERIC_LITERAL;
    }
    if (this._isPunctuatorStart()) {
        return TokenType.PUNCTUATOR_LITERAL;
    }
    return TokenType.UNKNOWN;
};

Lexer.prototype._isNumberStart = function () {
    var ch = this._currentChar();
    if ((ch >= '0') && (ch <= '9')) {
        return true;
    }
    var ch1 = this.sSource[this.iIndex + 1];
    if (ch === "." && (ch1 >= '0') && (ch1 <= '9')) {
        return true;
    }
    return false;
};
Lexer.prototype._isCommentStart = function () {
    var ch = this._currentChar();
    var ch1 = this.sSource[this.iIndex + 1];
    if (ch === "/" && (ch1 === "/" || ch1 === "*")) {
        return true;
    }
    return false;
};
Lexer.prototype._isStringStart = function () {
    var ch = this._currentChar();
    if (ch === "\"" || ch === "'") {
        return true;
    }
    return false;
};
Lexer.prototype._isPunctuatorStart = function () {
    var ch = this._currentChar();
    if (this._pPunctuatorsFirstSymbols[ch]) {
        return true;
    }
    return false;
};
Lexer.prototype._isIdentifierStart = function () {
    var ch = this._currentChar();
    if ((ch === '_') || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
        return true;
    }
    return false;
};
Lexer.prototype._isWhiteSpaceStart = function () {
    var ch = this._currentChar();
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
        return true;
    }
    return false;
};

Lexer.prototype._isLineTerminator = function (ch) {
    return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
};
Lexer.prototype._isWhiteSpace = function (ch) {
    return (ch === ' ') || (ch === '\t');
}
Lexer.prototype._isKeyword = function (sValue) {
    return !!(this._pKeywords[sValue]);
};
Lexer.prototype._isPunctuator = function (sValue) {
    return !!(this._pPunctuators[sValue]);
};
Lexer.prototype._nextChar = function () {
    this.iIndex++;
    this.iColumnNumber++;
    return this.sSource[this.iIndex];
};
Lexer.prototype._currentChar = function () {
    return this.sSource[this.iIndex];
};

Lexer.prototype._scanString = function () {
    var chFirst = this._currentChar();
    var sValue = chFirst;
    var ch;
    var chPrevious = chFirst;
    var isGoodFinish = false;
    var iStart = this.iColumnNumber;
    while (1) {
        ch = this._nextChar();
        if (!ch) {
            break;
        }
        sValue += ch;
        if (ch === chFirst && chPrevious !== '\\') {
            isGoodFinish = true;
            this._nextChar();
            break;
        }
        chPrevious = ch;
    }
    if (isGoodFinish) {
        return {
            sName  : "T_STRING",
            sValue : sValue,
            iStart : iStart,
            iEnd   : this.iColumnNumber - 1,
            iLine  : this.iLineNumber
        };
    }
    else {
        if (!ch) {
            ch = "EOF";
        }
        sValue += ch;
        this._error(lexer.BAD_TOKEN_ERROR,
                    {
                        eType  : TokenType.STRING_LITERAL,
                        sValue : sValue,
                        iStart : iStart,
                        iEnd   : this.iColumnNumber,
                        iLine  : this.iLineNumber
                    });
    }
};
Lexer.prototype._scanPunctuator = function () {
    var sValue = this._currentChar();
    var ch;
    var iStart = this.iColumnNumber;
    while (1) {
        ch = this._nextChar();
        if (ch) {
            sValue += ch;
            this.iColumnNumber++;
            if (!this._isPunctuator(sValue)) {
                sValue = sValue.slice(0, sValue.length - 1);
                break;
            }
        }
        else {
            break;
        }
    }
    return {
        sName  : this._pPunctuators[sValue],
        sValue : sValue,
        iStart : iStart,
        iEnd   : this.iColumnNumber - 1,
        iLine  : this.iLineNumber
    };
};
Lexer.prototype._scanWhiteSpace = function () {
    var ch = this._currentChar();
    while (1) {
        if (!ch) {
            break;
        }
        if (this._isLineTerminator(ch)) {
            this.iLineNumber++;
            ch = this._nextChar();
            this.iColumnNumber = 0;
            continue;
        }
        else if (ch === '\t') {
            this.iColumnNumber += 3;
        }
        else if (ch !== ' ') {
            break;
        }
        ch = this._nextChar();
    }
    return true;
};
Lexer.prototype._scanComment = function () {
    var sValue = this._currentChar();
    var ch = this._nextChar();
    sValue += ch;
    if (ch === '/') {
        //Line Comment
        while (1) {
            ch = this._nextChar();
            if (!ch) {
                break;
            }
            if (this._isLineTerminator(ch)) {
                this.iLineNumber++;
                this._nextChar();
                this.iColumnNumber = 0;
                break;
            }
            sValue += ch;
        }
        return true;
    }
    else {
        //Multiline Comment
        var chPrevious = ch;
        var isGoodFinish = false;
        var iStart = this.iColumnNumber;
        while (1) {
            ch = this._nextChar();
            if (!ch) {
                break;
            }
            sValue += ch;
            if (ch === '/' && chPrevious === '*') {
                isGoodFinish = true;
                this._nextChar();
                break;
            }
            if (this._isLineTerminator(ch)) {
                this.iLineNumber++;
                this.iColumnNumber = -1;
            }
            chPrevious = ch;
        }
        if (isGoodFinish) {
            return true;
        }
        else {
            if (!ch) {
                ch = "EOF";
            }
            sValue += ch;
            this._error(lexer.BAD_TOKEN_ERROR,
                        {
                            eType  : TokenType.COMMENT_LITERAL,
                            sValue : sValue,
                            iStart : iStart,
                            iEnd   : this.iColumnNumber,
                            iLine  : this.iLineNumber
                        });
        }
    }
};
Lexer.prototype._scanNumber = function () {
    var ch = this._currentChar();
    var sValue = "";
    var isFloat = false;
    var chPrevious = ch;
    var isGoodFinish = false;
    var iStart = this.iColumnNumber;
    var isE = false;
    if (ch === '.') {
        sValue += 0;
        isFloat = true;
    }
    sValue += ch;
    while (1) {
        ch = this._nextChar();
        if (ch === '.') {
            if (isFloat) {
                break;
            }
            else {
                isFloat = true;
            }
        }
        else if (ch === 'e') {
            if (isE) {
                break;
            }
            else {
                isE = true;
            }
        }
        else if (((ch === '+' || ch === '-') && chPrevious === 'e')) {
            sValue += ch;
            chPrevious = ch;
            continue;
        }
        else if (ch === 'f' && isFloat) {
            ch = this._nextChar();
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
                break;
            }
            isGoodFinish = true;
            break;
        }
        else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
            break;
        }
        else if (!((ch >= '0') && (ch <= '9')) || !ch) {
            if ((isE && chPrevious !== '+' && chPrevious !== '-' && chPrevious !== 'e') || !isE) {
                isGoodFinish = true;
            }
            break;
        }
        sValue += ch;
        chPrevious = ch;
    }

    if (isGoodFinish) {
        var sName = isFloat ? "T_FLOAT" : "T_UINT";
        return {
            sName  : sName,
            sValue : sValue,
            iStart : iStart,
            iEnd   : this.iColumnNumber - 1,
            iLine  : this.iLineNumber
        };
    }
    else {
        if (!ch) {
            ch = "EOF";
        }
        sValue += ch;
        this._error(lexer.BAD_TOKEN_ERROR,
                    {
                        eType  : TokenType.NUMERIC_LITERAL,
                        sValue : sValue,
                        iStart : iStart,
                        iEnd   : this.iColumnNumber,
                        iLine  : this.iLineNumber
                    });
    }
};
Lexer.prototype._scanIdentifier = function () {
    var ch = this._currentChar();
    var sValue = ch;
    var iStart = this.iColumnNumber;
    var isGoodFinish = false;
    while (1) {
        ch = this._nextChar();
        if (!ch) {
            isGoodFinish = true;
            break;
        }
        if (!((ch === '_') || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9'))) {
            isGoodFinish = true;
            break;
        }
        sValue += ch;
    }
    if (isGoodFinish) {
        if (this._isKeyword(sValue)) {
            return {
                sName  : this._pKeywords[sValue],
                sValue : sValue,
                iStart : iStart,
                iEnd   : this.iColumnNumber - 1,
                iLine  : this.iLineNumber
            };
        }
        else {
            var sName = this.pParser.isTypeId(sValue) ? "T_TYPE_ID" : "T_NON_TYPE_ID";
            return {
                sName  : sName,
                sValue : sValue,
                iStart : iStart,
                iEnd   : this.iColumnNumber - 1,
                iLine  : this.iLineNumber
            };
        }
    }
    else {
        if (!ch) {
            ch = "EOF";
        }
        sValue += ch;
        this._error(lexer.BAD_TOKEN_ERROR,
                    {
                        eType  : TokenType.IDENTIFIER_LITERAL,
                        sValue : sValue,
                        iStart : iStart,
                        iEnd   : this.iColumnNumber,
                        iLine  : this.iLineNumber
                    });
    }
};