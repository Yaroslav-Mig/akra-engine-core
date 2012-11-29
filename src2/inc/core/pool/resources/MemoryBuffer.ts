#ifndef MEMORYBUFFER_TS
#define MEMORYBUFFER_TS

#include "HardwareBuffer.ts"

module akra.core.pool.resources {
	export class MemoryBuffer extends HardwareBuffer {

		protected _pData: Uint8Array;

		inline get byteLength(): uint {
			return this._pData.byteLength;
		}

		create(iByteSize: uint, iFlags: int): bool {
			
			CLEAR_ANY(iFlags, 
				EHardwareBufferFlags.BACKUP_COPY | EHardwareBufferFlags.DISCARDABLE | 
				EHardwareBufferFlags.ALIGNMENT);

			super.create(iFlags | EHardwareBufferFlags.SOFTWARE);

			this._pData = new Uint8Array(iByteSize);
		}

		destroy(): void {
			super.destroy();
			this._pData = null;
		}

		lockImpl(iOffset: uint, iLength: uint, iLockFlags: int): Uint8Array {
			return this._pData.subarray(iOffset, iOffset + iLength);
		}

		readData(ppDest: ArrayBufferView): bool;
		readData(iOffset: uint, iSize?: uint, ppDest: ArrayBufferView): bool;
		readData(iOffset: any, iSize?: any, ppDest?: any): bool { 
			if (arguments.length < 3) {
				ppDest = arguments[0];
			}

			ASSERT((iOffset + iSize) <= this.byteLength);
			memcpy((<ArrayBufferView>ppDest).buffer, 0, this._pData.buffer, iOffset, iSize);

			return true;
		}

		writeData(pData: Uint8Array, iOffset?: uint, iSize?: uint): bool;
		writeData(pData: ArrayBufferView, iOffset?: uint, iSize?: uint): bool;
		writeData(pData: any, iOffset?: uint, iSize?: uint): bool { 
			ASSERT((iOffset + iSize) <= this.byteLength);

			if (arguments.length < 3) {
				iOffset = 0;
				iSize = pData.byteLength;
			}

			memcpy(this._pData.buffer, 0, (<ArrayBufferView>ppDest).buffer, iOffset, iSize);

			return true;
		}
	}
}

#endif
