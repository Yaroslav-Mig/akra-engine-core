

/// <reference path="IExplorerFunc.ts" />
/// <reference path="IReferenceCounter.ts" />

module akra {
	export enum EEntityTypes {
		UNKNOWN,
		NODE,

		JOINT,

		SCENE_NODE,

		CAMERA,
		SHADOW_CASTER,

		MODEL_ENTRY,

		LIGHT = 37,

		SCENE_OBJECT = 64,

		MODEL,

		TERRAIN,
		TERRAIN_ROAM,
		TERRAIN_SECTION,
		TERRAIN_SECTION_ROAM,

		TEXT3D,
		SPRITE,
		EMITTER,

		UI_NODE = 100,
		// UI_HTMLNODE,
		// UI_DNDNODE,

		// UI_COMPONENT,
		// UI_BUTTON,
		// UI_LABEL,
		// UI_TREE,

		OBJECTS_LIMIT = 128
	}

	export interface IEntity extends IEventProvider, IReferenceCounter {
		getName(): string;
		setName(sName: string): void;

		getParent(): IEntity;
		setParent(pParent: IEntity): void;

		getSibling(): IEntity;
		setSibling(pSibling: IEntity): void;

		getChild(): IEntity;
		setChild(pChild: IEntity): void;

		getRightSibling(): IEntity;
		getType(): EEntityTypes;
		getDepth(): int;
		getRoot(): IEntity;

		//create(): boolean;//moved to INode
		destroy(bRecursive?: boolean, bPromoteChildren?: boolean): void;

		findEntity(sName: string): IEntity;
		explore(fn: IExplorerFunc, bWithSiblings?: boolean): void;
		childOf(pParent: IEntity): boolean;
		siblingCount(): uint;
		childCount(): uint;
		children(): IEntity[];
		childAt(i: int): IEntity;
		descCount(): uint;

		update(): boolean;
		recursiveUpdate(): boolean;
		recursivePreUpdate(): void;
		prepareForUpdate(): void;

		hasParent(): boolean;
		hasChild(): boolean;
		hasSibling(): boolean;

		isASibling(pSibling: IEntity): boolean;
		isAChild(pChild: IEntity): boolean;
		isInFamily(pEntity: IEntity, bSearchEntireTree?: boolean): boolean;

		//обновлен ли сам узел
		isUpdated(): boolean;
		//есть ли обновления среди потомков?
		hasUpdatedSubNodes(): boolean;


		addSibling(pSibling: IEntity): IEntity;
		addChild(pChild: IEntity): IEntity;
		removeChild(pChild: IEntity): IEntity;
		removeAllChildren(): void;

		attachToParent(pParent: IEntity): boolean;
		detachFromParent(): boolean;

		promoteChildren(): void;
		relocateChildren(pParent: IEntity): void;

		toString(isRecursive?: boolean, iDepth?: int): string;

		attached: ISignal<{ (pEntity: IEntity): void; }>;
		detached: ISignal<{ (pEntity: IEntity): void; }>;
		childAdded: ISignal<{ (pEntity: IEntity, pChild: IEntity): void; }>;
		childRemoved: ISignal<{ (pEntity: IEntity, pChild: IEntity): void; }>;
	}


}
