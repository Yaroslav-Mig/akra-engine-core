#ifndef FILE_TS
#define FILE_TS

#define CAN_CREATE(MODE) TEST_BIT(MODE, 1)
#define CAN_READ(MODE) TEST_BIT(MODE, 0)
#define CAN_WRITE(MODE) TEST_BIT(MODE, 1)

#define IS_BINARY(MODE) TEST_BIT(MODE, 5)
#define IS_APPEND(MODE) TEST_BIT(MODE, 3)
#define IS_TRUNC(MODE) TEST_BIT(MODE, 4)

#include "util/util.ts"
#include "info/info.ts"
#include "TFile.ts" 		/*local and remote via thread*/
#include "LocalFile.ts" 	/*local file via local files system(async)*/
#include "StorageFile.ts" 	/*local file via local files system(async)*/


module akra.io {

	export enum EIO {
		IN = 0x01,
		OUT = 0x02,
		ATE = 0x04,
		APP = 0x08,
		TRUNC = 0x10,
		BINARY = 0x20,
		BIN = 0x20,
		TEXT = 0x40
	};

	export function filemode(sMode: string): int {
		switch (sMode.toLowerCase()) {
	        case "a+t":
	            return EIO.IN | EIO.OUT | EIO.APP | EIO.TEXT;
	        case "w+t":
	            return EIO.IN | EIO.OUT | EIO.TRUNC | EIO.TEXT;
	        case "r+t":
	            return EIO.IN | EIO.OUT | EIO.TEXT;

	        case "at":
	            return EIO.APP | EIO.TEXT;
	        case "wt":
	            return EIO.OUT | EIO.TEXT;
	        case "rt":
	            return EIO.IN | EIO.TEXT;

	        case "a+b":
	            return EIO.IN | EIO.OUT | EIO.APP | EIO.BIN;
	        case "w+b":
	            return EIO.IN | EIO.OUT | EIO.TRUNC | EIO.BIN;
	        case "r+b":
	            return EIO.IN | EIO.OUT | EIO.BIN;

	        case "ab":
	            return EIO.APP | EIO.BIN;
	        case "wb":
	            return EIO.OUT | EIO.BIN;
	        case "rb":
	            return EIO.IN | EIO.BIN;

	        case "a+":
	            return EIO.IN | EIO.OUT | EIO.APP;
	        case "w+":
	            return EIO.IN | EIO.OUT | EIO.TRUNC;
	        case "r+":
	            return EIO.IN | EIO.OUT;

	        case "a":
	            return EIO.APP | EIO.OUT;
	        case "w":
	            return <number>EIO.OUT;
	        case "r":
	        default:
	            return <number>EIO.IN;
	    }
	}

	// function _fopen (sUri: string, iMode?: int): IFile;
	// function _fopen (sUri: string, sMode?: int): IFile;
	// function _fopen (pUri: IURI, iMode: int): IFile;
	// function _fopen (pUri: IURI, sMode: string): IFile;

	function _fopen(sUri: any, pMode: any = EIO.IN): IFile {
		if (info.api.webWorker) {
			return new TFile(<string>sUri, pMode);
		}
		else if (info.api.fileSystem) {
			return new LocalFile(<string>sUri, pMode);
		}
		else {
			return new StorageFile(<string>sUri, pMode);
		}
	}

	export var fopen = _fopen;
}

#endif