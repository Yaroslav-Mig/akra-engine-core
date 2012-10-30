///<reference path="akra.ts" />

module akra {
	export interface IRenderState {
		mesh: { isSkinning: bool; };
		
		lights: {
			omni: int;
			project: int;
			omniShadows: int;
			projectShadows: int;
		};

		isAdvancedIndex: bool;
	}
}