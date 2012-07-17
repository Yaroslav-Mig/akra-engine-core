/**
 * @file
 * @brief реализация поддержки двумерных скриптов в трехмерном пространстве
 * @author Igor Karateev
 * @email iakarateev@gmail.com
 */

/**
 * @ctor
 */
function Text3D(pEngine,pFont){
	'use strict';
	A_CLASS;
	this._pFont = pFont;
	this._v4fBackgroundColor = Vec4.create(0.,0.,0.,0.);

	this._nLineQuantity = 0;
	this._nLineLength = 0;
	
	STATIC(pTextProg,a.loadProgram(pEngine,'../effects/text3D.glsl'));

	this.setProgram(Text3D.pTextProg);
	this.setGeometry(1,1);

	this.drawRoutine = function(){
		'use strict';

		var pProgram = Text3D.pTextProg;
		var pCamera = this._pEngine._pDefaultCamera;

		pProgram.applyMatrix4('model_mat', this.worldMatrix());
		pProgram.applyMatrix4('proj_mat', pCamera.projectionMatrix());
		pProgram.applyMatrix4('view_mat', pCamera.viewMatrix());

		//text unifoms
		trace(this._nLineLength,this._nLineQuantity);
		pProgram.applyFloat('nLineLength',this._nLineLength);
		pProgram.applyFloat('nLineQuantity',this._nLineQuantity);
		pProgram.applyFloat('startIndex',this._pRenderData.getDataLocation('STRING_DATA')/4.);

		pProgram.applyVector2('textTextureSteps',1./this._pFont._iLettersX,1./this._pFont._iLettersY);

		this._pFont.activate(1);
		pProgram.applyInt('textTexture',1);

		///////////////////////////////////////////
	}
};

EXTENDS(Text3D,a.Sprite);

/**
 * @param sString строка с текстом
 */
Text3D.prototype.setText = function(sString){
	'use strict';
	var pFont = this._pFont;
	var pLetterMap = pFont.letterMap;

	var nLineQuantity = 1;
	for(var i=0;i<sString.length;i++){
		if(sString[i] == '\n'){
			nLineQuantity++;
		}
	};

	//веделяем память под все данные,
	//т.е указатели на строки и на данные в строках,
	//которая чудесным образом совпадает с длинной строки + 1 (+1 так как в начальной строке нет \n)
	
	var pStringData = new Float32Array(4*(sString.length + 1));
	var nOffset = nLineQuantity*4;
	var nLineLength = 0;
	var nMaxLineLength = 0;
	var nLine = 0;//номер линии (отсчет с нуля)
	var nStartDataOffset = nLineQuantity;//номер откуда начинаются данные текущей линии

	var sChar;
	//когда i=sString.length заведомо попадаем в if как и нужно
	for(var i=0;i<=sString.length;i++){
		sChar = sString[i];
		trace(sChar,nLineLength);
		if(sChar == '\n' || i == sString.length){

			pStringData[4*nLine    ] = nLineLength;
			pStringData[4*nLine + 1] = nStartDataOffset;

			nStartDataOffset += nLineLength;

			if(nLineLength > nMaxLineLength){
				nMaxLineLength = nLineLength;
			}
			nLineLength = 0;
			nLine++;
		}
		else{
			var pTextureData = pLetterMap[sChar];
			pStringData[nOffset + 4*(i-nLine)    ] = pTextureData.X;//[0]
			pStringData[nOffset + 4*(i-nLine) + 1] = pTextureData.Y;//[1]
			nLineLength++;
		}
	}
	trace(pStringData);
	this._nLineQuantity = nLineQuantity;
	this._nLineLength = nMaxLineLength;

	var pIndex = new Float32Array(4);
	for(var i=0;i<4;i++){
		pIndex[i] = i;
	}

	this._pRenderData.allocateData(VE_VEC4('STRING_DATA'),pStringData);
	this._pRenderData.allocateIndex(VE_FLOAT('INDEX1'),pIndex);
	this._pRenderData.index(this._pRenderData.getDataLocation('STRING_DATA'),'INDEX1');
	// trace(nLineQuantity);
	// trace(pStringData);
};

Text3D.prototype.setBackgroundColor = function(v4fColor) {
	'use strict';
	Vec4.set(v4fColor,this._v4fBackgroundColor);
};

A_NAMESPACE(Text3D);