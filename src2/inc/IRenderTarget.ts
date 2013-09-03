#ifndef IRENDERTARGET_TS
#define IRENDERTARGET_TS

#include "IDepthBuffer.ts"
#include "IFrameStats.ts"
#include "ICamera.ts"
#include "IPixelBuffer.ts"

module akra {
	IFACE(ITexture);
	IFACE(IPixelBox);

	export enum EFramebuffer {
		FRONT, 	
		BACK, 	
		AUTO 	
	};

	export enum EStatFlags {
		NONE           = 0,
        FPS            = 1,
        AVG_FPS        = 2,
        BEST_FPS       = 4,
        WORST_FPS      = 8,
        TRIANGLE_COUNT = 16,
        ALL            = 0xFFFF
	};

	export enum E3DEventTypes {
        CLICK = 0x01,
        MOUSEMOVE = 0x02,
        MOUSEDOWN = 0x04,
        MOUSEUP = 0x08,
        MOUSEOVER = 0x10,
        MOUSEOUT = 0x20,
        DRAGSTART = 0x40,
        DRAGSTOP = 0x80,
        DRAGGING = 0x100,
        MOUSEWHEEL = 0x200
    }

	export interface IRenderTarget extends IEventProvider {
		name: string;
		width: uint;
		height: uint;
		

		colorDepth: uint;

		totalViewports: uint;

		priority: int;

		getRenderer(): IRenderer;

		getDepthBuffer(): IDepthBuffer;

		attachDepthBuffer(pBuffer: IDepthBuffer): bool;
		attachDepthPixelBuffer(pBuffer: IPixelBuffer): bool;
		attachDepthTexture(pTexture: ITexture): bool;

		detachDepthBuffer(): void;
		detachDepthTexture(): void;
		detachDepthPixelBuffer(): void; 

		enableSupportFor3DEvent(iType: int): int;
        is3DEventSupported(eType: E3DEventTypes): bool;    

		destroy(): void;

		update(): void;
		updateStats(): void;

		getCustomAttribute(sName: string): any;

		addViewport(pViewport: IViewport): IViewport;

		getViewport(iIndex: int): IViewport;
		getViewportByZIndex(iZIndex: int): IViewport;
		hasViewportByZIndex(iZIndex: int): bool;
		removeViewport(iZIndex: int): bool;
		removeAllViewports(): uint;

		getPolygonCount(): uint;

		getStatistics(): IFrameStats;
		getLastFPS(): float;
		getAverageFPS(): float;
		getBestFPS(): float;
		getWorstFPS(): float;

		getBestFrameTime(): float;
		getWorstFrameTime(): float;
		resetStatistics(): void;

		isActive(): bool;
		setActive(isActive?: bool): void;
		setAutoUpdated(isAutoUpdate?: bool): void;
		isAutoUpdated(): bool;
		isPrimary(): bool;

		readPixels(ppDest?: IPixelBox, eFramebuffer?: EFramebuffer): IPixelBox;

		_beginUpdate(): void;
		_updateViewport(iZIndex: int, bUpdateStatistics?: bool): void;
		_updateViewport(pViewport: IViewport, bUpdateStatistics?: bool): void;
		_updateAutoUpdatedViewports(bUpdateStatistics?: bool): void;
		_endUpdate(): void;

		signal preUpdate(): void;
		signal postUpdate(): void;

		signal viewportPreUpdate(pViewport: IViewport): void;
		signal viewportPostUpdate(pViewport: IViewport): void;
		signal viewportAdded(pViewport: IViewport): void;
		signal viewportRemoved(pViewport: IViewport): void;

		signal resized(width: uint, height: uint): void;

		signal cameraRemoved(pCamera: ICamera): void;
	}
}

#endif
