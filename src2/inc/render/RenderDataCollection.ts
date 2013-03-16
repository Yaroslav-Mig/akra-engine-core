#ifndef RENDERDATACOLLECTION_TS
#define RENDERDATACOLLECTION_TS

#include "IRenderDataCollection.ts"
#include "IHardwareBuffer.ts"
#include "RenderData.ts"
#include "data/VertexDeclaration.ts"

module akra.render {

	export class RenderDataCollection extends util.ReferenceCounter implements IRenderDataCollection {
		private _pDataBuffer: IVertexBuffer = null;
		private _pEngine: IEngine = null;
		private _eDataOptions: ERenderDataBufferOptions = 0;
		private _pDataArray: IRenderData[] = [];

		inline get buffer(): IVertexBuffer {
			return this._pDataBuffer;
		}

        inline get length(): int {
            return this._pDataArray.length;
        }

        inline get byteLength(): int {
            return this._pDataBuffer.byteLength;
        }


        constructor (pEngine: IEngine, eOptions: ERenderDataBufferOptions = 0) {
            super();
            this._pEngine = pEngine;
            this.setup(eOptions);
        }

        clone(pSrc: IRenderDataCollection): bool {
            CRITICAL("TODO: RenderDataCollection::clone();");

            return false;
        }

        getEngine(): IEngine {
        	return this._pEngine;
        }

        getOptions(): ERenderDataBufferOptions {
        	return this._eDataOptions;
        }

        /**
         * Find VertexData with given semantics/usage.
         */
        getData(sUsage: string): IVertexData;
        getData(iOffset: uint): IVertexData;
        getData(a?): IVertexData {
        	var pBuffer: IVertexBuffer = this._pDataBuffer;
            var pData: IVertexData;
            var n: uint;

        	if (!isNull(pBuffer)) {
        	    n = this._pDataBuffer.length;

        	    if (isString(arguments[0])) {
        	        for (var i: int = 0; i < n; i++) {
                        pData = pBuffer.getVertexData(i);
        	            if (pData.hasSemantics(<string>arguments[0])) {
        	                return pData;
        	            }
        	        };
        	    }
        	    else {
        	        for (var i: int = 0; i < n; i++) {
                        pData = pBuffer.getVertexData(i);
        	            if (pData.byteOffset === <uint>arguments[0]) {
        	                return pData;
        	            }
        	        };
        	    }
        	}

        	return null;
        }

        /**
         * Положить данные в буфер.
         */
        _allocateData(pVertexDecl: IVertexDeclaration, iSize: uint): IVertexData;
        _allocateData(pVertexDecl: IVertexDeclaration, pData: ArrayBufferView): IVertexData;
        _allocateData(pVertexDecl: IVertexDeclaration, pData: ArrayBuffer): IVertexData;
        _allocateData(pDeclData: IVertexElementInterface[], iSize: uint): IVertexData;
        _allocateData(pDeclData: IVertexElementInterface[], pData: ArrayBufferView): IVertexData;
        _allocateData(pDeclData: IVertexElementInterface[], pData: ArrayBuffer): IVertexData;
        _allocateData(pDecl, pData) {
        	if (!this._pDataBuffer) {
        	    this.createDataBuffer();
        	}

        	var pVertexDecl: data.VertexDeclaration = createVertexDeclaration(<IVertexElementInterface[]>pDecl);
        	var pVertexData: IVertexData;
        	
        	if ((arguments.length < 2) || isNumber(arguments[1]) || isNull(arguments[1])) {
        	    pVertexData = this._pDataBuffer.getEmptyVertexData(<uint>pData || 1, pVertexDecl);
        	}
        	else {
        	    pVertexData = this._pDataBuffer.allocateData(pVertexDecl, <ArrayBufferView>pData);    
        	}

        	debug_assert(pVertexData !== null, "cannot allocate data:\n" + pVertexDecl.toString());

        	return pVertexData;
        }

        allocateData(pDataDecl: IVertexDeclaration, pData: ArrayBufferView, isCommon: bool = true): int;
        allocateData(pDataDecl: IVertexDeclaration, pData: ArrayBuffer, isCommon: bool = true): int;
        allocateData(pDeclData: IVertexElementInterface[], pData: ArrayBufferView, isCommon: bool = true): int;
        allocateData(pDeclData: IVertexElementInterface[], pData: ArrayBuffer, isCommon: bool = true): int;

        allocateData(pDecl?, pData?, isCommon: bool = true): int {
        	    var pVertexData: IVertexData;
        	    var pDataDecl: data.VertexDeclaration = createVertexDeclaration(<IVertexElementInterface[]>pDecl);

#ifdef DEBUG
        	    
        	    for (var i: int = 0; i < pDataDecl.length; i++) {
        	        if (this.getData(pDataDecl.element(i).usage) !== null && pDataDecl.element(i).count !== 0) { 
        	            WARNING("data buffer already contains data with similar vertex decloration <" + 
        	                pDataDecl.element(i).usage + ">.");
        	        }
        	    };

#endif

        	    pVertexData = this._allocateData(pDataDecl, <ArrayBufferView>pData);

        	    if (isCommon) {
        	        for (var i: int = 0; i < this._pDataArray.length; ++ i) {
        	            this._pDataArray[i]._addData(pVertexData);
        	        }
        	    }

        	    return pVertexData.byteOffset;
        }

        getDataLocation(sSemantics: string): int {
        	if (this._pDataBuffer) {
        	    var pData: IVertexData;
        	    
        	    for (var i: int = 0, n: uint = this._pDataBuffer.length; i < n; i++) {
                    pData = this._pDataBuffer.getVertexData(i);
        	        if (pData.hasSemantics(sSemantics)) {
        	            return pData.byteOffset;
        	        }
        	    };
        	}

        	return -1;
        }

        private createDataBuffer() {
            //TODO: add support for eOptions
            var iVbOption: int = 0;
            var eOptions: ERenderDataBufferOptions = this._eDataOptions;

            if (eOptions & ERenderDataBufferOptions.VB_READABLE) {
                iVbOption = ERenderDataBufferOptions.VB_READABLE;
            }

            //trace('creating new video buffer for render data buffer ...');
            this._pDataBuffer = this._pEngine.getResourceManager().createVideoBuffer("render_data_buffer" + "_" + sid());
            this._pDataBuffer.create(0, iVbOption);
            this._pDataBuffer.addRef();
            return this._pDataBuffer !== null;
        };

        getRenderData(iSubset: uint): IRenderData {
        	return this._pDataArray[iSubset];
        }

        getEmptyRenderData(ePrimType: EPrimitiveTypes, eOptions: ERenderDataBufferOptions = 0): IRenderData {

        	var iSubsetId: int = this._pDataArray.length;
        	var pDataset: IRenderData = new RenderData(this);

        	eOptions |= this._eDataOptions;

        	if (!pDataset._setup(this, iSubsetId, ePrimType, eOptions)) {
        	    debug_error("cannot setup submesh...");
        	}
        	

        	this._pDataArray.push(pDataset);

        	return pDataset;
        }

        _draw(): void;
        _draw(iSubset?: uint): void {
        	if (arguments.length > 0) {
        	    this._pDataArray[iSubset]._draw();
        	}

        	for (var i: int = 0; i < this._pDataArray.length; i++) {
        	    this._pDataArray[i]._draw();
        	};
        }

        destroy(): void {
        	this._pDataArray = null
    
            if (this._pDataBuffer) {
                // this._pDataBuffer.release();
                this._pDataBuffer.destroy();
                this._pDataBuffer = null;
            }

            this._pEngine = null;
            this._eDataOptions = 0;
        }

        private setup(eOptions: ERenderDataBufferOptions = 0) {
            this._eDataOptions = eOptions;
        };

        // inline isValid(): bool { return true; }
        // inline isDynamic(): bool { return false; }
        // inline isStatic(): bool { return false; }
        // inline isStream(): bool { return false; }
        // inline isReadable(): bool { return true; }
        // inline isBackupPresent(): bool { return true; }

	}

    export function createRenderDataCollection(pEngine: IEngine, eOptions: ERenderDataBufferOptions = 0): IRenderDataCollection {
        return new RenderDataCollection(pEngine, eOptions);
    }
}

#endif