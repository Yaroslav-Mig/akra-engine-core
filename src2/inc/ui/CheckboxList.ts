#ifndef UICHECKBOXLIST_TS
#define UICHECKBOXLIST_TS

#include "IUICheckboxList.ts"
#include "Component.ts"

module akra.ui {
	export class CheckboxList extends Component implements IUICheckboxList {
		private _nSize: uint = 0;
		private _pItems: IUICheckbox[] = [];
		private _bMultiSelect: bool = false;
		private _bLikeRadio: bool = false;

		inline get length(): uint { return this._nSize; }
		inline get radio(): bool { return this._bLikeRadio; }
		inline set radio(b: bool) { this._bLikeRadio = b; }
		inline get items(): IUICheckbox[] { return this._pItems; }
		
		constructor (parent, options?, eType: EUIComponents = EUIComponents.CHECKBOX_LIST) {
			super(parent, options, eType);

			this.setLayout(EUILayouts.HORIZONTAL);
			this.connect(this.layout, SIGNAL(childAdded), SLOT(_childAdded), EEventTypes.UNICAST);
			this.connect(this.layout, SIGNAL(childRemoved), SLOT(_childRemoved), EEventTypes.UNICAST);\

			var pChild: IUINode = <IUINode>this.layout.child;

			while (!isNull(pChild)) {
				if (isCheckbox(pChild)) {
					this.addCheckbox(<IUICheckbox>pChild);
				}

				pChild = <IUINode>pChild.sibling;
			}
		}

		_createdFrom($comp: JQuery): void {
			super._createdFrom($comp);
			this.radio = isDef($comp.attr("radio")) && $comp.attr("radio").toLowerCase() !== "false";
		}

		rendered(): void {
			super.rendered();
			this.el.addClass("component-checkboxlist");
		}

		inline hasMultiSelect(): bool {
			return this._bMultiSelect;
		}

		//when checkbox added to childs
		update(): bool {
			var pItems: IUICheckbox[] = this._pItems;

			if (pItems.length == 0) {
				return;
			}

			pItems.first.$element.addClass("first");

			for (var i: int = 0; i < pItems.length - 1; ++ i) {
				pItems[i].$element.removeClass("last");
			};

			pItems.last.$element.addClass("last");

			return super.update();
		}

		protected addCheckbox(pCheckbox: IUICheckbox): void {
			this._pItems.push(pCheckbox);
			this.connect(pCheckbox, SIGNAL(changed), SLOT(_changed));
			this.update();
		}

		_childAdded(pLayout: IUILayout, pNode: IUINode): void {
			if (isCheckbox(pNode)) {
				this.addCheckbox(<IUICheckbox>pNode);
			}
		}

		_childRemoved(pLayout: IUILayout, pNode: IUINode): void {
			if (isCheckbox(pNode)) {
				var i = this._pItems.indexOf(<IUICheckbox>pNode);
				if (i != -1) {
					var pCheckbox: IUICheckbox = this._pItems[i];
					this.disconnect(pCheckbox, SIGNAL(changed), SLOT(_changed));
					
					this._pItems.splice(i, 1);
					this.update();
				}	
			}
		}

		_changed(pCheckbox: IUICheckbox, bCheked: bool): void {
			if (this.hasMultiSelect()) {
				return;
			}
			else {

				if (!bCheked && this.radio) {
					pCheckbox.checked = true;
					return;
				}

				var pItems: IUICheckbox[] = this._pItems;
				for (var i: int = 0; i < pItems.length; ++ i) {
					if (pItems[i] === pCheckbox) {
						continue;
					}

					pItems[i]._setValue(false);
				}

				this.changed(pCheckbox);
			}
		}

		BROADCAST(changed, CALL(pCheckbox));
	}

	register("CheckboxList", CheckboxList);
}

#endif

