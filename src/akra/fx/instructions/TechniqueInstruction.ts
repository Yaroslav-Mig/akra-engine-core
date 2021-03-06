/// <reference path="../../idl/IMap.ts" />
/// <reference path="../../idl/ERenderStates.ts" />
/// <reference path="../../idl/ERenderStateValues.ts" />

/// <reference path="../../render/render.ts" />

/// <reference path="DeclInstruction.ts" />
/// <reference path="PassInstruction.ts" />

module akra.fx.instructions {
	export class TechniqueInstruction extends DeclInstruction implements IAFXTechniqueInstruction {
		private _sName: string = "";
		private _bHasComplexName: boolean = false;
		private _pParseNode: parser.IParseNode = null;
		private _pSharedVariableListV: IAFXVariableDeclInstruction[] = null;
		private _pSharedVariableListP: IAFXVariableDeclInstruction[] = null;
		private _pPassList: IAFXPassInstruction[] = null;

		private _bHasImportedTechniqueFromSameEffect: boolean = false;
		private _pImportedTechniqueList: IAFXImportedTechniqueInfo[] = null;

		private _pFullComponentList: IAFXComponent[] = null;
		private _pFullComponentShiftList: int[] = null;

		private _nTotalPasses: uint = 0;
		private _bIsPostEffect: boolean = false;
		private _bIsFinalize: boolean = false;

		constructor() {
			super();
			this._pInstructionList = null;
			this._eInstructionType = EAFXInstructionTypes.k_TechniqueInstruction;
		}

		_setName(sName: string, isComplexName: boolean): void {
			this._sName = sName;
			this._bHasComplexName = isComplexName;
		}

		_getName(): string {
			return this._sName;
		}

		_setSemantic(sSemantic: string): void {
			super._setSemantic(sSemantic);

			if (sSemantic === PassInstruction.POST_EFFECT_SEMANTIC) {
				this._bIsPostEffect = true;
			}
			else {
				this._bIsPostEffect = false;
			}
		}

		_hasComplexName(): boolean {
			return this._bHasComplexName;
		}

		_isPostEffect(): boolean {
			return this._bIsPostEffect;
		}

		_getSharedVariablesForVertex(): IAFXVariableDeclInstruction[] {
			return this._pSharedVariableListV;
		}

		_getSharedVariablesForPixel(): IAFXVariableDeclInstruction[] {
			return this._pSharedVariableListP;
		}

		_addPass(pPass: IAFXPassInstruction): void {
			if (isNull(this._pPassList)) {
				this._pPassList = [];
			}

			this._pPassList.push(pPass);
		}

		_getPassList(): IAFXPassInstruction[] {
			return this._pPassList;
		}

		_getPass(iPass: uint): IAFXPassInstruction {
			return iPass < this._pPassList.length ? this._pPassList[iPass] : null;
		}

		_totalOwnPasses(): uint {
			return this._pPassList.length;
		}

		_totalPasses(): uint {
			return this._nTotalPasses;
		}

		_addTechniqueFromSameEffect(pTechnique: IAFXTechniqueInstruction, iShift: uint): void {
			if (isNull(this._pImportedTechniqueList)) {
				this._pImportedTechniqueList = [];
			}

			this._pImportedTechniqueList.push({
				technique: pTechnique,
				component: null,
				shift: iShift
			});

			this._bHasImportedTechniqueFromSameEffect = true;
		}

		_addComponent(pComponent: IAFXComponent, iShift: int): void {
			if (isNull(this._pImportedTechniqueList)) {
				this._pImportedTechniqueList = [];
			}

			this._pImportedTechniqueList.push({
				technique: pComponent.getTechnique(),
				component: pComponent,
				shift: iShift
			});
		}

		_getFullComponentList(): IAFXComponent[] {
			return this._pFullComponentList;
		}

		_getFullComponentShiftList(): int[] {
			return this._pFullComponentShiftList;
		}

		_checkForCorrectImports(): boolean {
			return true;
		}

		_setGlobalParams(sProvideNameSpace: string,
			pGlobalImportList: IAFXImportedTechniqueInfo[]): void {
			this.generateListOfSharedVariables();

			if (!this._hasComplexName() && sProvideNameSpace !== "") {
				this._sName = sProvideNameSpace + "." + this._sName;
			}

			if (!isNull(pGlobalImportList)) {
				if (!isNull(this._pImportedTechniqueList)) {
					this._pImportedTechniqueList = pGlobalImportList.concat(this._pImportedTechniqueList);
				}
				else {
					this._pImportedTechniqueList = pGlobalImportList.concat();
				}
			}

			if (!this._bHasImportedTechniqueFromSameEffect) {
				this.generateFullListOfComponent();
				this._bIsFinalize = true;
			}
		}

		_finalize(pComposer: IAFXComposer): void {
			if (this._bIsFinalize) {
				return;
			}

			for (var i: uint = 0; i < this._pImportedTechniqueList.length; i++) {
				var pInfo: IAFXImportedTechniqueInfo = this._pImportedTechniqueList[i];

				if (isNull(pInfo.component)) {
					pInfo.component = pComposer.getComponentByName(pInfo.technique._getName());
				}
			}

			this.generateFullListOfComponent();
			this._bIsFinalize = true;
		}

		private generateListOfSharedVariables(): void {
			this._pSharedVariableListV = [];
			this._pSharedVariableListP = [];

			for (var i: uint = 0; i < this._pPassList.length; i++) {
				var pSharedV: IAFXVariableDeclMap = this._pPassList[i]._getSharedVariableMapV();
				var pSharedP: IAFXVariableDeclMap = this._pPassList[i]._getSharedVariableMapP();

				for (var j in pSharedV) {
					this.addSharedVariable(pSharedV[j], EFunctionType.k_Vertex);
				}

				for (var j in pSharedP) {
					this.addSharedVariable(pSharedP[j], EFunctionType.k_Pixel);
				}
			}
		}

		private addSharedVariable(pVar: IAFXVariableDeclInstruction, eType: EFunctionType): void {
			var pAddTo: IAFXVariableDeclInstruction[] = null;

			if (eType === EFunctionType.k_Vertex) {
				pAddTo = this._pSharedVariableListV;
			}
			else {
				pAddTo = this._pSharedVariableListP;
			}

			for (var i: uint = 0; i < pAddTo.length; i++) {
				if (pAddTo[i] === pVar) {
					return;
				}
			}

			pAddTo.push(pVar);
		}

		private generateFullListOfComponent(): void {
			this._nTotalPasses = this._totalOwnPasses();

			if (isNull(this._pImportedTechniqueList)) {
				return;
			}

			this._pFullComponentList = [];
			this._pFullComponentShiftList = [];

			for (var i: uint = 0; i < this._pImportedTechniqueList.length; i++) {
				var pInfo: IAFXImportedTechniqueInfo = this._pImportedTechniqueList[i];

				var pTechnique: IAFXTechniqueInstruction = pInfo.technique;
				var iMainShift: int = pInfo.shift;
				var pAddComponentList: IAFXComponent[] = pTechnique._getFullComponentList();
				var pAddComponentShiftList: int[] = pTechnique._getFullComponentShiftList();

				if (!isNull(pAddComponentList)) {
					for (var j: uint = 0; j < pAddComponentList.length; i++) {
						this._pFullComponentList.push(pAddComponentList[j]);
						this._pFullComponentShiftList.push(pAddComponentShiftList[j] + iMainShift);
					}
				}

				this._pFullComponentList.push(pInfo.component);
				this._pFullComponentShiftList.push(iMainShift);

				if (this._nTotalPasses < iMainShift + pTechnique._totalPasses()) {
					this._nTotalPasses = iMainShift + pTechnique._totalPasses();
				}
			}
		}


	}
}

