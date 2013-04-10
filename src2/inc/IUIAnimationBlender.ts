#ifndef IUIANIMATIONBLENDER_TS
#define IUIANIMATIONBLENDER_TS

#include "IUIAnimationNode.ts"

module akra {
	export interface IUIAnimationBlender extends IUIAnimationNode {
		getMaskNode(iAnim: int): IUIAnimationMask;
		setMaskNode(iAnim: int, pNode: IUIAnimationMask): void;

		setup(): void;
	}
}

#endif