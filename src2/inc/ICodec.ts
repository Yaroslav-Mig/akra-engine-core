#ifndef ICODEC_TS
#define ICODEC_TS

#include "common.ts"

module akra {

	export interface ICodec{

		getType():string;
		getDataType():string;
		magicNumberMatch(pMagicNumber: Uint8Array):bool;
		magicNumberToFileExt(pMagicNumber: Uint8Array):string;

		code(pInput:Uint8Array,pData:ICodecData):Uint8Array;
		decode(pData:Uint8Array,pCodecData:ICodecData):Uint8Array;


	}
	

	export interface ICodecData{
		dataType: string;
	}

}

#endif 