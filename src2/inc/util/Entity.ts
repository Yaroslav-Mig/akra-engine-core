#ifndef ENTITY_TS
#define ENTITY_TS

#include "IEntity.ts"
#include "IExplorerFunc.ts"

module akra.util {
	export class Entity extends ReferenceCounter implements IEntity {
		protected _sName: string = null;
		protected _pParent: IEntity = null;
		protected _pSibling: IEntity = null;
		protected _pChild: IEntity = null;

		inline get name(): string { return this._sName; }
		inline set name(sName: string) { this._sName = sName; }

		inline get parent(): IEntity { return this._pParent; }
		inline set parent(pParent: IEntity) { this.attachToParent(pParent); }

		inline get sibling(): IEntity { return this._pSibling; }
		inline set sibling(pSibling: IEntity) { this._pSibling = pSibling; }

		inline get child(): IEntity { return this._pChild; }
		inline set child(pChild: IEntity) { this._pChild = pChild; }

		get depth(): int {
			var iDepth: int = -1;
	        for (var pEntity: IEntity = this; pEntity; pEntity = pEntity.parent, ++ iDepth){};
	        return iDepth;
		}

		get root(): IEntity {
	        for (var pEntity: IEntity = this, iDepth: int = -1; pEntity.parent; pEntity = pEntity.parent, ++ iDepth){};
	        return pEntity;
		}


		create(): bool {
			return true;
		}

		destroy(): void {
			// destroy anything attached to this node
		    //	destroySceneObject();
		    // promote any children up to our parent
		    this.promoteChildren();
		    // now remove ourselves from our parent
		    this.detachFromParent();
		    // we should now be removed from the tree, and have no dependants
		    debug_assert(this.referenceCount() == 0, "Attempting to delete a scene node which is still in use");
		    debug_assert(this._pSibling == null, "Failure Destroying Node");
		    debug_assert(this._pChild == null, "Failure Destroying Node");
		}

		findEntity(sName: string): IEntity {
			 var pEntity: IEntity = null;

		    if (this._sName === sName) {
		        return this;
		    }

		    if (this._pSibling) {
		        pEntity = this._pSibling.findEntity(sName);
		    }

		    if (pEntity == null && this._pChild) {
		        pEntity = this._pChild.findEntity(sName);
		    }

		    return pEntity;
		}

		explore(fn: IExplorerFunc): void {
			if (fn(this) === false) {
		        return;
		    }

		    if (this._pSibling) {
		        this._pSibling.explore(fn);
		    }

		    if (this._pChild) {
		        this._pChild.explore(fn);
		    }
		}


		childOf(pParent: IEntity): bool {
			for (var pEntity: IEntity = this; pEntity; pEntity = pEntity.parent) {
		        if (pEntity.parent === pParent) {
		            return true;
		        }
		    }

		    return false;
		}


		/**
		 * Returns the current number of siblings of this object.
		 */
		siblingCount(): uint {
			var iCount: uint = 0;

		    if (this._pParent) {
		        var pNextSibling = this._pParent.child;
		        if (pNextSibling) {
		            while (pNextSibling) {
		                pNextSibling = pNextSibling.sibling;
		                ++ iCount;
		            }
		        }
		    }

		    return iCount;
		}


		/**
		 * Returns the current number of children of this object
		 */
		childCount(): uint {
			var iCount: uint = 0;

		    var pNextChild: IEntity = this.child;

		    if (pNextChild) {
		        ++ iCount;
		        while (pNextChild) {
		            pNextChild = pNextChild.sibling;
		            ++ iCount;
		        }
		    }
		    return iCount;
		}


		update(): void {}


		recursiveUpdate(): void {
			// update myself
		    this.update();
		    // update my sibling
		    if (this._pSibling) {
		        this._pSibling.recursiveUpdate();
		    }
		    // update my child
		    if (this._pChild) {
		        this._pChild.recursiveUpdate();
		    }
		}

		recursivePreUpdate(): void {
			// clear the flags from the previous update
		    this.prepareForUpdate();

		    // update my sibling
		    if (this._pSibling) {
		        this._pSibling.recursivePreUpdate();
		    }
		    // update my child
		    if (this._pChild) {
		        this._pChild.recursivePreUpdate();
		    }
		}


		prepareForUpdate(): void {};

		/** Parent is not undef */
		inline hasParent(): bool {
		    return isDefAndNotNull(this._pParent);
		}

		/** Child is not undef*/
		inline hasChild(): bool {
		    return isDefAndNotNull(this._pChild);
		}

		/** Sibling is not undef */
		inline hasSibling(): bool {
			return isDefAndNotNull(this._pSibling);
		}

		/**
		 * Checks to see if the provided item is a sibling of this object
		 */
		isASibling(pSibling: IEntity): bool {
			if (!pSibling) {
		        return false;
		    }
		    // if the sibling we are looking for is me, or my FirstSibling, return true
		    if (this == pSibling || this._pSibling == pSibling) {
		        return true;
		    }
		    // if we have a sibling, continue searching
		    if (this._pSibling) {
		        return this._pSibling.isASibling(pSibling);
		    }
		    // it's not us, and we have no sibling to check. This is not a sibling of ours.
		    return false;
		}

		/** Checks to see if the provided item is a child of this object. (one branch depth only) */
		isAChild(pChild: IEntity): bool {
			if (!pChild) {
		        return (false);
		    }
		    // if the sibling we are looking for is my FirstChild return true
		    if (this._pChild == pChild) {
		        return (true);
		    }
		    // if we have a child, continue searching
		    if (this._pChild) {
		        return (this._pChild.isASibling(pChild));
		    }
		    // it's not us, and we have no child to check. This is not a sibling of ours.
		    return (false);
		}

		/**
		 * Checks to see if the provided item is a child or sibling of this object. If SearchEntireTree
		 * is TRUE, the check is done recursivly through all siblings and children. SearchEntireTree
		 * is FALSE by default.
		 */
		isInFamily(pEntity: IEntity, bSearchEntireTree?: bool): bool {
			if (!pEntity) {
		        return (false);
		    }
		    // if the model we are looking for is me or my immediate family, return true
		    if (this == pEntity || this._pChild == pEntity || this._pSibling == pEntity) {
		        return (true);
		    }
		    // if not set to seach entire tree, just check my siblings and kids
		    if (!bSearchEntireTree) {
		        if (this.isASibling(pEntity)) {
		            return (true);
		        }
		        if (this._pChild && this._pChild.isASibling(pEntity)) {
		            return (true);
		        }
		    }
		    // seach entire Tree!!!
		    else {
		        if (this._pSibling && this._pSibling.isInFamily(pEntity, bSearchEntireTree)) {
		            return (true);
		        }

		        if (this._pChild && this._pChild.isInFamily(pEntity, bSearchEntireTree)) {
		            return (true);
		        }
		    }

		    return (false);
		}

		/**
		 * Adds the provided ModelSpace object to the descendant list of this object. The provided
		 * ModelSpace object is removed from any parent it may already belong to.
		 */
		addSibling(pSibling: IEntity): IEntity {
			if (pSibling) {
		        // replace objects current sibling pointer with this new one
		        pSibling.sibling = this._pSibling;
		        this.sibling = pSibling;
		    }

		    return pSibling;
		}

		/**
		 * Adds the provided ModelSpace object to the descendant list of this object. The provided
		 * ModelSpace object is removed from any parent it may already belong to.
		 */
		addChild(pChild: IEntity): IEntity {
			if (pChild) {
		        // Replace the new child's sibling pointer with our old first child.
		        pChild.sibling = this._pChild;
		        // the new child becomes our first child pointer.
		        this._pChild = pChild;
    		}

    		return pChild; 
		}

		/**
		 * Removes a specified child object from this parent object. If the child is not the
		 * FirstChild of this object, all of the Children are searched to find the object to remove.
		 */
		removeChild(pChild: IEntity): IEntity {
			if (this._pChild && pChild) {
		        if (this._pChild == pChild) {
		            this._pChild = pChild.sibling;
		            pChild.sibling  = null;
		        }
		        else {
		            var pTempNode: IEntity = this._pChild;
		            // keep searching until we find the node who's sibling is our target
		            // or we reach the end of the sibling chain
		            while (pTempNode && (pTempNode.sibling != pChild)) {
		                pTempNode = pTempNode.sibling;
		            }
		            // if we found the proper item, set it's FirstSibling to be the FirstSibling of the child
		            // we are removing
		            if (pTempNode) {
		                pTempNode.sibling = pChild.sibling;
		                pChild.sibling = null;
		            }
		        }
	    	}

	    	return pChild;
		}

		/** Removes all Children from this parent object */
		removeAllChildren(): void {
			// keep removing children until end of chain is reached
		    while (!isNull(this._pChild)) {
		        var pNextSibling = this._pChild.sibling;
		        this._pChild.detachFromParent();
		        this._pChild = pNextSibling;
		    }
		}

		/** Attaches this object ot a new parent. Same as calling the parent's addChild() routine. */
		attachToParent(pParent: IEntity): bool {
			if (pParent != this._pParent) {
	        
		        this.detachFromParent();
		       
		        if (pParent) {
		            this._pParent = pParent;
		            this._pParent.addChild(this);
		            this._pParent.addRef();
		            return true;
		        }
	    	}

	    	return false;
		}

		detachFromParent(): bool {
			// tell our current parent to release us
		    if (this._pParent) {
		        this._pParent.removeChild(this);
		        //TODO: разобраться что за херня!!!!
		        if (this._pParent) {
		            this._pParent.release();
		        }

		        this._pParent = null;
		        // my world matrix is now my local matrix
		        
		        return true;
		    }

		    return false;
		}
		
		/**
		 * Attaches this object's children to it's parent, promoting them up the tree
		 */
		promoteChildren(): void {
			// Do I have any children to promote?
		    while (!isNull(this._pChild)) {
		        var pNextSibling: IEntity = this._pChild.sibling;
		        this._pChild.attachToParent(this._pParent);
		        this._pChild = pNextSibling;
		    }
		}

		relocateChildren(pParent: IEntity): void {
			if (pParent != this) {
		        // Do I have any children to relocate?
		        while (!isNull(this._pChild)) {
		            var pNextSibling: IEntity = this._pChild.sibling;
		            this._pChild.attachToParent(pParent);
		            this._pChild = pNextSibling;
		        }
		    }
		}

		toString(isRecursive: bool = false, iDepth: int = 0): string {
#ifdef DEBUG
		    if (!isRecursive) {
		        return '<entity' + (this._sName? ' ' + this._sName: "") + '>';
		    }

		    var pSibling: IEntity = this.sibling;
		    var pChild: IEntity = this.child;
		    var s: string = "";

		    for (var i = 0; i < iDepth; ++ i) {
		        s += ':  ';
		    }

		    s += '+----[depth: ' + this.depth + ']' + this.toString() + '\n';

		    if (pChild) {
		        s += pChild.toString(true, iDepth + 1);
		    }

		    if (pSibling) {
		        s += pSibling.toString(true, iDepth);
		    }

		    return s;

#else
		    return null;
#endif
		}

	}
}


#endif