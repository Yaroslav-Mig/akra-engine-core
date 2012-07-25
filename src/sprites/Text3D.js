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

	STATIC(pTextProg,a.loadProgram(pEngine,'../effects/text3D.glsl'));
	STATIC(pDrawRoutine,DrawRoutineText3D);

	this._pFont = pFont;
	this._v4fBackgroundColor = Vec4.create(0.,0.,0.,0.);
	this._v4fFontColor = Vec4.create(0.,0.,0.,0.);

	this._fDistanceMultiplier = 1.;

	this._nLineQuantity = 0;
	this._nLineLength = 0;
	this._nPixelLineLingth = 0;

	this.setGeometry(2,2);
	this.setProgram(statics.pTextProg);
	this.drawRoutine = statics.pDrawRoutine;
};

EXTENDS(Text3D,a.Sprite);

PROPERTY(Text3D,'backgroundColor',
	function(){
		'use strict';
		return this._v4fBackgroundColor;
	},
	function(v4fBackgroundColor){
		'use strict';
		Vec4.set(v4fBackgroundColor,this._v4fBackgroundColor)
	}
);

PROPERTY(Text3D,'fontColor',
	function(){
		'use strict';
		return this._v4fFontColor;
	},
	function(v4fFontColor){
		'use strict';
		Vec4.set(v4fFontColor,this._v4fFontColor);
	}
);

PROPERTY(Text3D,'fixedSize',
	function(){
		'use strict';
		if(this._fDistanceMultiplier == 0.){
			return true;
		}
		else{
			return false;
		}
	},
	function(isFixed){
		'use strict';
		if(isFixed){
			this._fDistanceMultiplier = 0.;
		}
		else{
			this._fDistanceMultiplier = 1.;	
		}
	}
);

/**
 * @param sString строка с текстом
 */
Text3D.prototype.setText = function(sString){
	'use strict';
	var pFont = this._pFont;
	trace('is Monospace',pFont.isMonospace);
	var pLetterMap = pFont.letterMap;
	var pFontMetrics = pFont.fontMetrics;
	var pMeasureContext = pFont.context;
	var nLineLength = 0;
	var nMaxLineLength = 0;
	var nPixelLength = 0;
	var nMaxPixelLength = 0;

	var nLineQuantity = 1;

	var pLinesInfo = [];

	for(var i=0;i<sString.length;i++){
		var sChar = sString[i];
		if(sChar == '\n'){
			if(nLineLength > nMaxLineLength){
				nMaxLineLength = nLineLength;
			}
			if(nPixelLength > nMaxPixelLength){
				nMaxPixelLength = nPixelLength;
			}
			pLinesInfo.push({'nLetters' : nLineLength, 'nPixelLength' : nPixelLength});
			nLineLength = 0;
			nPixelLength = 0;
			nLineQuantity++;
		}
		else{
			nLineLength++;
			//длина в пикселях
			nPixelLength += pFontMetrics.lettersMetrics[sChar].typographicalWidth;
		}
	};
	pLinesInfo.push({'nLetters' : nLineLength, 'nPixelLength' : nPixelLength});
	trace(nMaxLineLength,nMaxPixelLength,pLinesInfo);
	this._nLineQuantity = nLineQuantity;
	this._nLineLength = nMaxLineLength;
	this._nPixelLineLingth = nMaxPixelLength;

	var fAveragePixelWidthPerLetter = nMaxPixelLength/nLineQuantity;


	//веделяем память под все данные,
	//т.е указатели на строки и на данные в строках,
	//которая чудесным образом совпадает с длинной строки + 1 (+1 так как в начальной строке нет \n)
	
	var nTotalRequiredData = (sString.length + 1)
			+ nLineQuantity*nMaxLineLength //хранится инфа, 
			+ (sString.length - nLineQuantity + 1);

	var pStringData = new Float32Array(4*nTotalRequiredData);

	// var nOffset = nLineQuantity*4;
	
	// var nLine = 0;//номер линии (отсчет с нуля)
	// var nStartDataOffset = nLineQuantity;//номер откуда начинаются данные первой линии

	// var sChar;
	
	var nStartIndex = 0;//указывает на 
	var nCurrentIndex = 0;//указывает на текущую букву
	var nStringDataOffset = nLineQuantity;
	var nLetterInfoOffset = 0;
	var nLetterGeometryOffset = 0;
	for(var i=0;i<pLinesInfo.length;i++){
		var pLine = pLinesInfo[i];
		var nCurrentPixelLength = 0;
		pStringData[4*i    ] = nStringDataOffset;
		pStringData[4*i + 1] = nLetterInfoOffset;
		pStringData[4*i + 2] = nLetterGeometryOffset;

		for(var j=0;j<nMaxLineLength;j++){
			if(j<pLine[i].nLetters){
				nCurrentIndex++;
				var sChar = sString[nCurrentIndex];	
				var pLetterMetrics = pFontMetrics.lettersMetrics[sChar];
				var nTypographicalWidth = pLetterMetrics.typographicalWidth;

				var nStartPosition = Math.floor(nCurrentPixelLength/fAveragePixelWidthPerLetter);
				var nEndPosition = Math.floor((nCurrentPixelLength 
											+ nTypographicalWidth - 1)/fAveragePixelWidthPerLetter);

				var fPixelStartPosition = nCurrentPixelLength%fAveragePixelWidthPerLetter;
				var fPixelEndtPosition = (nCurrentPixelLength + nTypographicalWidth - 1)
											%fAveragePixelWidthPerLetter;

				var nCurrentPosition = nStartPosition;

				do{
					var nCurrentDataPosition = nLineQuantity + i*nMaxPixelLength + nStartPosition;
					
					
						
					nCurrentPosition++;
				}while(nCurrentPosition != nEndPosition)

				

				if(nPixelStartPosition == 0){
					pStringData[4*nCurrentDataPosition    ] = j;
					pStringData[4*nCurrentDataPosition + 1] = nTypographicalWidth;
					pStringData[4*nCurrentDataPosition + 2] = fPixelStartPosition;
					pStringData[4*nCurrentDataPosition + 3] = fPixelEndtPosition;
				}

				nCurrentPixelLength += nTypographicalWidth;
			}
			
			
		}

		for(var j=0;j<pLine.letters;j++){
			 nCurrentIndex++; 
			 var sChar = sString[nCurrentIndex];
			 var pLetterMetrics = pFontMetrics.lettersMetrics[sChar].typographicalWidth;
		}
		 //пропускаем \n
	}

	//когда i=sString.length заведомо попадаем в if как и нужно
	for(var i=0;i<=sString.length;i++){
		sChar = sString[i];
		//trace(sChar,nLineLength);
		if(sChar == '\n' || i == sString.length){

			pStringData[4*nLine    ] = nLineLength;
			pStringData[4*nLine + 1] = nStartDataOffset;

			nStartDataOffset += nLineLength;

			nLine++;
		}
		else{
			var pTextureData = pLetterMap[sChar];
			pStringData[nOffset + 4*(i-nLine)    ] = pTextureData.X;//текстурные координаты начала буквы
			pStringData[nOffset + 4*(i-nLine) + 1] = pTextureData.Y;//
			pStringData[nOffset + 4*(i-nLine) + 2] = pTextureData.Z;//шаг по текстуре необходимый для того, чтобы 
			pStringData[nOffset + 4*(i-nLine) + 3] = pTextureData.W;//получить конец буквы
		}
	}
	trace('nMaxPixelLength',nMaxPixelLength);
	//trace(pStringData);

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

Text3D.prototype.setDistanceMultiplier = function(fMultiplier) {
	'use strict';
	if(fMultiplier < 0){
		err("значение множителя не может быть меньше нуля");
		return;
	}
	this._fDistanceMultiplier = fMultiplier;
};

A_NAMESPACE(Text3D);

function DrawRoutineText3D(pProgram){
	'use strict';
	var pCamera = this._pEngine._pDefaultCamera;

	pProgram.applyMatrix4('model_mat', this.worldMatrix());
	pProgram.applyMatrix4('proj_mat', pCamera.projectionMatrix());
	pProgram.applyMatrix4('view_mat', pCamera.viewMatrix());

	//text unifoms
	//trace(this._nLineLength,this._nLineQuantity);
	pProgram.applyFloat('nLineLength',this._nLineLength);
	pProgram.applyFloat('nLineQuantity',this._nLineQuantity);
	pProgram.applyFloat('startIndex',this._pRenderData.getDataLocation('STRING_DATA')/4.);

	pProgram.applyVector2('nPixelsSizes',this._nPixelLineLingth,
		this._pFont.fontMetrics.fontMetrics.height*this._nLineQuantity);

	//set screen parameters (ограничивают максимальный размер текста на экране размером шрифта)
	pProgram.applyVector2('v2fCanvasSizes',this._pEngine.pCanvas.width,this._pEngine.pCanvas.height);
	//pProgram.applyVector2('v2fTextSizes',);
	pProgram.applyFloat('nFontSize',this._pFont.totalFontSize);
	pProgram.applyFloat('fDistanceMultiplier',this._fDistanceMultiplier);

	//set font colors
	pProgram.applyVector4('v4fBackgroundColor',this._v4fBackgroundColor);
	pProgram.applyVector4('v4fFontColor',this._v4fFontColor);
	//

	this._pFont.activate(1);
	pProgram.applyInt('textTexture',1);

	// var pDevice = this._pEngine.pDevice;
	// pDevice.disable(pDevice.DEPTH_TEST);
 //    pDevice.enable(pDevice.BLEND);
 //    pDevice.blendFunc(pDevice.SRC_ALPHA, pDevice.ONE_MINUS_SRC_ALPHA);

	///////////////////////////////////////////
}