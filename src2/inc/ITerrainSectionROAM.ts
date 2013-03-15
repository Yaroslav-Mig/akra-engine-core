#ifndef ITERRAINSECTIONROAM_TS
#define ITERRAINSECTIONROAM_TS

module akra {
	IFACE(ISceneObject);
	IFACE(ITriTreeNode);
	IFACE(IRect3d);
	IFACE(ITerrainSection);
	export interface ITerrainSectionROAM extends ITerrainSection{
		readonly triangleA: ITriTreeNode;
		readonly triangleB: ITriTreeNode;
		readonly queueSortValue: float;
		readonly terrainSystem: ITerrainROAM;
		create(pRootNode?: ISceneObject, pParentSystem?: ITerrainROAM, iSectorX?: uint, iSectorY?: uint, iHeightMapX?: uint, iHeightMapY?: uint, iXVerts?: uint, iYVerts?: uint, pWorldRect?: IRect2d, iStartIndex?: uint): bool;
		prepareForRender(): void;
		reset(): void;
		tessellate(fScale: float, fLimit: float): void;
		/**
		 * Создаем terrain
		 * @param pTri вершина дерева треугольников.
		 * @param {float} fDistA растояниe до углов треугольников - центр.
		 * @param {float} fDistB растояниe до углов треугольников - лево.
		 * @param {float} fDistC растояниe до углов треугольников - право.
		 * @param pVTree массив погрешности по высоте
		 * @param iIndex 
		 * @param {float} fScale
		 * @param {float} fLimit
		 */
		recursiveTessellate(pTri: ITriTreeNode, fDistA: float, fDistB: float, fDistC: float, pVTree: float[], iIndex: uint, fScale: float, fLimit: float): void;
		split(pTri: ITriTreeNode): void;
		buildTriangleList(): void;
		render(): bool;
		recursiveBuildTriangleList(pTri: ITriTreeNode, iPointBase: uint, iPointLeft: uint, iPointRight: uint): void;
		computeVariance(): void;
		recursiveComputeVariance(iCornerA: uint, iCornerB: uint, iCornerC: uint, fHeightA: float, fHeightB: float, fHeightC: float, pVTree: float[], iIndex: uint): float;
		drawVariance(iIndex: uint, iCornerA: uint, iCornerB: uint, iCornerC: uint, pVTree: float[]): void;
	}
}

#endif