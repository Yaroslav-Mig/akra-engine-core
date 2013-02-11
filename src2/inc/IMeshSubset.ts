#ifndef IMESHSUBSET_TS
#define IMESHSUBSET_TS

#include "IEventProvider.ts"

module akra {
	
	IFACE (IRect3d);
	IFACE (IMesh);
	IFACE (ISkin);
	IFACE (IRenderData);

	export interface IMeshSubset extends IEventProvider, IRenderableObject {
		name: string;

		readonly mesh: IMesh;
		readonly skin: ISkin;
		readonly data: IRenderData;
		readonly boundingBox: IRect3d;
        readonly boundingSphere: ISphere;

		createBoundingBox(): bool;
		deleteBoundingBox(): bool;
		showBoundingBox(): bool;
		hideBoundingBox(): bool;

		createBoundingSphere(): bool;
		deleteBoundingSphere(): bool;
		showBoundingSphere(): bool;
		hideBoundingSphere(): bool;

		computeNormals(): void;
		computeTangents(): void;
		computeBinormals(): void;

		isSkinned(): bool;
		getSkin(): ISkin;
		setSkin(pSkin: ISkin): bool;

		/** @deprecated */
		applyFlexMaterial(csMaterial: string, pMaterial?: IMaterial): bool;
		/** @deprecated */
		getFlexMaterial(iMaterial: int): IMaterial;
		/** @deprecated */
		getFlexMaterial(csName: string): IMaterial;
		/** @deprecated */
		setFlexMaterial(iMaterial: int): bool;
		/** @deprecated */
		setFlexMaterial(csName: string): bool;

		show(): void;
		hide(): void;

		destroy(): void;
	}
}

#endif