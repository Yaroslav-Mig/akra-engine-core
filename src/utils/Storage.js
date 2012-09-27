function PopArray(nLength, iIncrement, eMode) {
    Enum([
             LOOP = 1,
             ADD = 2
         ], ARRAYWRITEMODE, a.SystemArray);

    this._pData = new Array(nLength || 100);
    this._nCount = 0;
    this._eMode = eMode || a.SystemArray.ADD;
    this._iIncrement = iIncrement || 10;
    this._pAllocator = null;
}
A_NAMESPACE(PopArray);

PROPERTY(PopArray, "length",
         function () {
             return this._nCount
         });

PopArray.prototype.release = function (isStrong) {
    this._nCount = 0;
    if (isStrong) {
        var pData = this._pData;
        var iLength = pData.length;
        for (var i = 0; i < iLength; i++) {
            pData[i] = null;
        }
    }
    if (this._pAllocator !== null) {
        this._pAllocator._releaseElement(this);
    }
};

PopArray.prototype._addElements = function () {
    this._pData.length += this._iIncrement;
};

PopArray.prototype.push = function (pObject) {
    if (this._pData.length === this._nCount) {
        if (this._eMode === a.SystemArray.ADD) {
            this._addElements();
        }
        else if (this._eMode === a.SystemArray.LOOP) {
            this._nCount = 0;
        }
    }
    this._pData[this._nCount++] = pObject;
};

PopArray.prototype.pop = function () {
    if (this._nCount === 0) {
        return null;
    }
    return this._pData[--this._nCount];
};

PopArray.prototype.setElement = function (index, pValue) {
    if (index >= this._nCount) {
        return false;
    }
    this._pData[index] = pValue;
};

PopArray.prototype.element = function (index) {
    if (index === undefined || index >= this._nCount) {
        return null;
    }
    return this._pData[index];
};


function Map() {
    this.pKeys = new a.PopArray();
    this.pValues = new a.PopArray();
    this._pMap = {};
    this._pAllocator = null;
}
A_NAMESPACE(Map);

Map.prototype.release = function (isStrong) {
    this.pKeys.release(isStrong);
    this.pValues.release(isStrong);
    if (this._pAllocator !== null) {
        this._pAllocator._releaseElement(this);
    }
};

Map.prototype.addElement = function (sKey, pValue) {
    var pKeys = this.pKeys;
    var pValues = this.pValues;
    var pMap = this._pMap;
    var index = pMap[sKey];
    var iSize = pKeys._nCount;
    var sOldKey;
    sOldKey = pKeys.element(index);
    if (!sOldKey || sOldKey !== sKey) {
        pKeys.push(sKey);
        pValues.push(pValue);
        pMap[sKey] = iSize;
    }
//    else if (sOldKey === sKey) {
    pValues.setElement(index, pValue);
//    }
};

Map.prototype.hasElement = function (sKey) {
    var index = this._pMap[sKey];
    return (index !== undefined && this.pKeys.element(index) === sKey);
};

Map.prototype.element = function (sKey) {
    var index = this._pMap[sKey];
    return (index !== undefined && this.pKeys.element(index) === sKey) ? this.pValues[index] : null;
};


function Allocator(fnConstructor, nCount, iIncrement) {
    if (!fnConstructor) {
        return false;
    }
    this._pElements = new Array(nCount || 100);
    this._nCount = 0;
    this._iIncrement = iIncrement || 10;
    this._fnConstructor = fnConstructor;

    for (var i = 0; i < this._pElements.length; i++) {
        this._pElements[i] = new this._fnConstructor();
        this._pElements[i]._pAllocator = this;
    }
}

Allocator.prototype.getElement = function () {
    var pElements = this._pElements;
    if (pElements.length === this._nCount) {
        this._addElements();
    }
    return pElements[this._nCount++];
};

Allocator.prototype._addElements = function () {
    var pElements = this._pElements;
    var pElement;
    for (var i = 0; i < this._iIncrement; i++) {
        pElement = new this._fnConstructor();
        pElements.push(pElement);
        pElement._pAllocator = this;
    }
};

Allocator.prototype._releaseElement = function (pElement) {
    this._pElements[--this._nCount] = pElement;
};

a._pMapAllocator = new Allocator(a.Map, 1000, 100);
a._pArrayAllocator = new Allocator(a.PopArray, 1000, 100);

function PopArrayStorage() {
    return a._pArrayAllocator.getElement();
}

function MapStorage() {
    return a._pMapAllocator.getElement();
}