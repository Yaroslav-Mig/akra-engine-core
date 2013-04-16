#ifndef ITERRAINROAM_TS
#define ITERRAINROAM_TS

module akra {
	IFACE(ITerrain);
	IFACE(ITerrainSectionROAM);
	IFACE(IRect3d);
	IFACE(ISceneNode);
	IFACE(ITriTreeNode);
	
	export interface ITerrainROAM extends ITerrain {
		readonly verts: float[];
		readonly index: Float32Array;
		readonly maxTriTreeNodes: uint;
		readonly vertexId: uint;

		totalIndex: uint;

		requestTriNode(): ITriTreeNode;

		addToTessellationQueue(pSection: ITerrainSectionROAM): bool;
		processTessellationQueue(): void;
	}
}

#endif