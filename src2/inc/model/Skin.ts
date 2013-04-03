#ifndef SKIN_TS
#define SKEIN_TS

#include "ISkeleton.ts"
#include "INode.ts"
#include "IVertexData.ts"
#include "IRenderDataCollection.ts"
#include "IMesh.ts"
#include "IMat4.ts"
#include "ISceneNode.ts"

module akra.model {

	export class Skin implements ISkin {
		private _pMesh: IMesh;

		private _pSkeleton: ISkeleton = null;
		
		// name of bones/nodes
		private _pNodeNames: string[] = null;

		//bind matrix from collada
		private _m4fBindMatrix: IMat4 = new Mat4(1);

		//BONE_MATRIX = WORLD_MATRIX x OFFSET_MATRIX
		private _pBoneTransformMatrices: IMat4[]  = null;

		/**
		 * Common buffer for all transform matrices.
		 * _pBoneOffsetMatrixBuffer = [_pBoneTransformMatrices[0], ..., _pBoneTransformMatrices[N]]
		 */
		private _pBoneOffsetMatrixBuffer: Float32Array = null;

		// bone offset matrices from collada
		private _pBoneOffsetMatrices: IMat4[] = null;
		
		/**
		 * Pointers to nodes, that affect to this skin.
		 */
		private _pAffectingNodes: ISceneNode[] = null;

		/**
		 * Format:
		 * BONE_INF_COUNT - number of bones, that influence to the vertex.
		 * BONE_INF_LOC - address of influence, pointer to InfData structire list.
		 * ..., [BONE_INF_COUNT: float, BONE_INF_LOC: float], ...
		 * 
		 */
		private _pInfMetaData: IVertexData = null;

		/**
		 * Format:
		 * BONE_INF_DATA - bone matrix address, pointer to BONE_MATRIX list
		 * BONE_WEIGHT_IND - bone weight address, pointer to BONE_WEIGHT list
		 * ..., [BONE_INF_DATA: float, BONE_WEIGHT_IND: float], ...
		 */
		private _pInfData: IVertexData = null;

		/**
		 * Format:
		 * ..., [BONE_MATRIX: matrix4], ...
		 */
		private _pBoneTransformMatrixData: IVertexData = null;
		
		/**
		 * Format:
		 * ..., [BONE_WEIGHT: float], ...
		 */
		private _pWeightData: IVertexData = null;

		/**
		 * Links to VertexData, that contain meta from this skin.
		 */
		private _pTiedData: IVertexData[] = [];



		inline get data(): IRenderDataCollection {
			return this._pMesh.data;
		}

		inline get skeleton(): ISkeleton{
			return this._pSkeleton;
		}

		inline set skeleton(pSkeleton: ISkeleton) {
			if (isNull(pSkeleton) || pSkeleton.totalBones < this.totalBones) {
				WARNING("cannnot set skeletonm because skeleton has to little bones");
		        return;
		    }

		    for (var i: int = 0, nMatrices: uint = this.totalBones; i < nMatrices; i++) {
		        this._pAffectingNodes[i] = pSkeleton.findJoint(this._pNodeNames[i]);
		        debug_assert(isDefAndNotNull(this._pAffectingNodes[i]), "joint<" + this._pNodeNames[i] + "> must exists...");
		    }
		    

		    this._pSkeleton = pSkeleton;
		}

		inline get totalBones(): uint {
			return this._pNodeNames.length;
		}

		constructor(pMesh: IMesh) {
		    debug_assert(isDefAndNotNull(pMesh), "you must specify mesh for skin");

		    this._pMesh = pMesh;
		}

		setBindMatrix(m4fMatrix: IMat4): void {
			this._m4fBindMatrix.set(m4fMatrix);
		}

		getBindMatrix(): IMat4 {
			return this._m4fBindMatrix;
		}

		getBoneOffsetMatrices(): IMat4[] {
			return this._pBoneOffsetMatrices;
		}

		getBoneOffsetMatrix(sBoneName: string): IMat4 {
			var pBoneNames: string[] = this._pNodeNames;

			for (var i = 0; i < pBoneNames.length; i++) {
			    if (pBoneNames[i] === sBoneName) {
			        return this._pBoneOffsetMatrices[i];
			    }
			};

			return null;
		}

		setSkeleton(pSkeleton: ISkeleton): bool {
			if (!pSkeleton || pSkeleton.totalBones < this.totalBones) {
				debug_warning("number of bones in skeleton (" + pSkeleton.totalBones + 
					") less then number of bones in skin (" + this.totalBones + ").");
			    return false;
			}

			for (var i: int = 0, nMatrices = this.totalBones; i < nMatrices; i++) {
			    this._pAffectingNodes[i] = pSkeleton.findJoint(this._pNodeNames[i]);
			    debug_assert(!isNull(this._pAffectingNodes[i]), "joint<" + this._pNodeNames[i] + "> must exists...");
			}

			this._pSkeleton = pSkeleton;

			return true;
		}

		attachToScene(pRootNode: ISceneNode): bool {
			for (var i: int = 0, nMatrices: uint = this.totalBones; i < nMatrices; i++) {
			    this._pAffectingNodes[i] = <ISceneNode>pRootNode.findEntity(this._pNodeNames[i]);
			    debug_assert(isDefAndNotNull(this._pAffectingNodes[i]), "node<" + this._pNodeNames[i] + "> must exists...");
			}
			
			return true;
		}

		setBoneNames(pNames: string[]): bool {
			if (isNull(pNames)) {
				return false;
			}

			this._pNodeNames = pNames;
			this._pAffectingNodes = new Array(pNames.length);

			return true;
		}

		setBoneOffsetMatrices(pMatrices: IMat4[]): void {
			var pMatrixNames: string[] = this._pNodeNames;

			debug_assert(isDefAndNotNull(pMatrices) && isDefAndNotNull(pMatrixNames) && 
						pMatrixNames.length === pMatrices.length,
			            "number of matrix names must equal matrices data length:\n" + pMatrixNames.length + " / " +
			            pMatrices.length);

			var nMatrices: uint = pMatrixNames.length;
			var pData: IRenderDataCollection = this.data;
			var pMatrixData: Float32Array = new Float32Array(nMatrices * 16);

			//FIXME: правильно положить матрицы...
			this._pBoneOffsetMatrices = pMatrices;
			this._pBoneTransformMatrixData = pData._allocateData([VE_MAT4("BONE_MATRIX")], pMatrixData);
			this._pBoneTransformMatrices = new Array(nMatrices);

			for (var i: int = 0; i < nMatrices; i++) {
			    this._pBoneTransformMatrices[i] = new Mat4(pMatrixData.subarray(i * 16, (i + 1) * 16), true);
			}
			

			this._pBoneOffsetMatrixBuffer = pMatrixData;
		}

		setWeights(pWeights: Float32Array): bool {
			// var pData: Float32Array = new Float32Array(4*pWeights.length);

			// for(var i=0; i < pWeights.length; i++){
			// 	pData[4*i] = pWeights[i];
			// }

			// this._pWeightData = this.data._allocateData([VE_FLOAT("BONE_WEIGHT"), VE_END(16)], pData);
			// 
			this._pWeightData = this.data._allocateData([VE_FLOAT("BONE_WEIGHT")], pWeights); 

			return this._pWeightData !== null;
		}

		getWeights(): IVertexData {
			return this._pWeightData;
		}

		getInfluenceMetaData(): IVertexData {
			return this._pInfMetaData;
		}

		getInfluences(): IVertexData {
			return this._pInfData;
		}

		setInfluences(pInfluencesCount: uint[], pInfluences: Float32Array): bool {
			debug_assert(this._pInfMetaData == null && this._pInfData == null, "vertex weights already setuped.");
			debug_assert(!isNull(this.getWeights()), "you must set weight data before setup influences");

			var pData: IRenderDataCollection = this.data;
			var pInfluencesMeta: Float32Array = new Float32Array(pInfluencesCount.length * 2);

			var iInfLoc: int = 0;
			var iTransformLoc: int = 0;
			var iWeightsLoc: int = 0;

			//получаем копию массива влияний
			pInfluences = new Float32Array(pInfluences);

			//вычисляем адресса матриц транфсормации и весов
			iTransformLoc = this._pBoneTransformMatrixData.byteOffset / EDataTypeSizes.BYTES_PER_FLOAT;
			iWeightsLoc = this._pWeightData.byteOffset / EDataTypeSizes.BYTES_PER_FLOAT;


			for (var i: int = 0, n: int = pInfluences.length; i < n; i += 2) {
			    pInfluences[i] = pInfluences[i] * 16 + iTransformLoc;
			    pInfluences[i + 1] += iWeightsLoc;
			}

			//запоминаем модифицированную информацию о влияниях
			this._pInfData = pData._allocateData([
			                                         VE_FLOAT('BONE_INF_DATA'), /*адрес матрицы кости*/
			                                         VE_FLOAT('BONE_WEIGHT_IND')/*адрес весового коэффициента*/
			                                     ],
			                                     pInfluences);

			iInfLoc = this._pInfData.byteOffset / EDataTypeSizes.BYTES_PER_FLOAT;

			//подсчет мета данных, которые укажут, где взять влияния на кость..
			for (var i: int = 0, j: int = 0, n: int = iInfLoc; i < pInfluencesMeta.length; i += 2) {
			    var iCount: int = pInfluencesCount[j++];
			    pInfluencesMeta[i] = iCount;        /*число влияний на вершину*/
			    pInfluencesMeta[i + 1] = n;         /*адрес начала информации о влияниях */
			    //(пары индекс коэф. веса и индекс матрицы)
			    n += 2 * iCount;
			}

			//influences meta: разметка влияний
			this._pInfMetaData = pData._allocateData([
			                                             VE_FLOAT('BONE_INF_COUNT'), /*число костей и весов, влияющих на вершину*/
			                                             VE_FLOAT('BONE_INF_LOC'), /*адресс начала влияний на вершину*/
			                                         ], pInfluencesMeta);

			return this._pInfMetaData !== null &&
			       this._pInfData !== null;
		}

		setVertexWeights(pInfluencesCount: uint[], pInfluences: Float32Array, pWeights: Float32Array): bool {
			debug_assert(arguments.length > 1, 'you must specify all parameters');

			//загружаем веса 
			if (pWeights) {
			    this.setWeights(pWeights);
			}

			return this.setInfluences(pInfluencesCount, pInfluences);
		}

		applyBoneMatrices(bForce: bool = false): bool {
			var pData: Float32Array;
			var bResult: bool;
			var pNode: ISceneNode;
			var isUpdated: bool = false;

			for (var i: int = 0, nMatrices = this.totalBones; i < nMatrices; ++i) {
			    pNode = this._pAffectingNodes[i];

			    if (pNode.isWorldMatrixNew() || bForce) {
			        pNode.worldMatrix.multiply(this._pBoneOffsetMatrices[i], this._pBoneTransformMatrices[i]);
			        isUpdated = true;
			    }
			}

			if (isUpdated) {
			    pData = this._pBoneOffsetMatrixBuffer;
			    return this._pBoneTransformMatrixData.setData(pData, 0, pData.byteLength);
			}

			return false;
		}

		isReady(): bool {
			return !(isNull(this._pInfMetaData) || isNull(this._pInfData) || isNull(this._pWeightData) ||
			         isNull(this._pBoneOffsetMatrixBuffer) || isNull(this._pBoneOffsetMatrices) ||
			         isNull(this._pNodeNames) ||
			         isNull(this._m4fBindMatrix));
		}

		getBoneTransforms(): IVertexData {
			return this._pBoneTransformMatrixData;
		}

		isAffect(pData: IVertexData): bool {
			if (isDefAndNotNull(pData)) {
			    for (var i: int = 0; i < this._pTiedData.length; i++) {
			        if (this._pTiedData[i] === pData) {
			            return true;
			        }
			    }
			}

			return false;
		}

		attach(pData: IVertexData): void {
			debug_assert(pData.stride === 16, "you cannot add skin to mesh with POSITION: {x, y, z}" +
			                                  "\nyou need POSITION: {x, y, z, w}");

			pData.getVertexDeclaration().append(VE_FLOAT(DeclUsages.BLENDMETA, 12));

			this._pTiedData.push(pData);
		}

#ifdef DEBUG

		static debugMeshSubset(pSubMesh: IMeshSubset) {
			var pMesh: IMesh = pSubMesh.mesh;
			var pSkin: ISkin = pSubMesh.skin;
			var pMatData: IVertexData = pSkin.getBoneTransforms();
			var pPosData: Float32Array;
			var pEngine: IEngine = pMesh.getEngine();

			pPosData = <Float32Array>(pSubMesh.data._getData("POSITION")).getTypedData(DeclUsages.BLENDMETA);

			var pVideoBuffer: IVertexBuffer = pSubMesh.mesh.data.buffer;
			var iFrom: int = 2618, iTo: int = 2619;
			var pWeights: Float32Array = <Float32Array>pSkin.getWeights().getTypedData('BONE_WEIGHT');
			
			LOG('===== debug vertices from ', iFrom, 'to', iTo, ' ======');
			LOG('transformation data location:', pMatData.byteOffset / 4.);
			LOG('155 weight: ', pSkin.getWeights().getTypedData('BONE_WEIGHT')[155]);
			LOG('vertices info ===================>');

			for (var i: int = iFrom; i < iTo; i++) {
			    LOG(pPosData[i], '<< inf meta location');

			    var pMetaData: Float32Array = new Float32Array(8);
			    if (!pVideoBuffer.readData(4 * pPosData[i], 8, pMetaData)) {
			    	ERROR("cannot read back meta data");
			    }

			    LOG(pMetaData[0], '<< count');
			    LOG(pMetaData[1], '<< inf. location');

			    for (var j: int = 0; j < pMetaData[0]; ++j) {
			        var pInfData = new Float32Array(8);
			        if (!pVideoBuffer.readData(4 * (pMetaData[1] + 2 * j), 8, pInfData)) {
			        	ERROR("cannot read influence data");
			        }

			        LOG(pInfData[0], '<< matrix location');
			        LOG(pInfData[1], '/', pInfData[1] - 30432, '<< weight location / index');

			        var pWeightData = new Float32Array(4);
			        
			        if (!pVideoBuffer.readData(4 * (pInfData[1]), 4, pWeightData)) {
			        	ERROR("cannot read weight data");
			        }

			        LOG(pWeightData[0], '<< weight');

			        var pMatrixData = new Float32Array(4 * 16);
			        if (!pVideoBuffer.readData(4 * (pInfData[0]), 4 * 16, pMatrixData)) {
			        	ERROR("cannot read matrix data");
			        }

			        LOG(pMatrixData.toString());
			    }
			}

			LOG('#############################################');

			for (var i: int = 0; i < pPosData.length; i++) {
			    var pMetaData: Float32Array = new Float32Array(8);
			    if(!pVideoBuffer.readData(4 * pPosData[i], 8, pMetaData)) {
			    	ERROR("cannot read meta data");
			    }

			    for (var j: int = 0; j < pMetaData[0]; ++j) {
			        var pInfData: Float32Array = new Float32Array(8);
			        
			        if (!pVideoBuffer.readData(4 * (pMetaData[1] + 2 * j), 8, pInfData)) {
			        	ERROR("cannot read influence data");
			        }

			        var iWeightsIndex: int = pInfData[1] - 30432;

			        var fWeightOrigin: float = pWeights[iWeightsIndex];
			        var pWeightData: float = new Float32Array(4);
			        if (!pVideoBuffer.readData(4 * (pInfData[1]), 4, pWeightData)) {
			        	ERROR("cannot read weight data");
			        }
			        var fWeight: float = pWeightData[0];

			        if (Math.abs(fWeight - fWeightOrigin) > 0.001) {
			            alert("1");
			            LOG("weight with index", iWeightsIndex, "has wrong weight", fWeightOrigin, "/", fWeightOrigin);
			        }

			        //var pWeightData: Float32Array = new Float32Array(pVideoBuffer.getData(4 * (pInfData[1]), 4));
			        //var pMatrixData: Float32Array = new Float32Array(pVideoBuffer.getData(4 * (pInfData[0]), 4 * 16));
			    }
			}

			LOG('##############################################');
			// var pBoneTransformMatrices = pSkin._pBoneTransformMatrixData;
			// var pBonetmData = pBoneTransformMatrices.getTypedData('BONE_MATRIX');

			// for (var i = 0; i < pBonetmData.length; i += 16) {
			//     LOG('bone transform matrix data >>> ');
			//     LOG(Mat4.str(pBonetmData.subarray(i, i + 16)));
			// };


			//for (var i = 0; i < pMesh.length; i++) {
			// var i = pMesh.length - 1;
			//     var pPosData = pMesh[i].data.getData('POSITION').getTypedData('POSITION');
			//     var pIndData = pMesh[i].data._pIndexData.getTypedData('INDEX0');

			//     var j = pIndData[pIndData.length - 1];
			//     var j0 = pMesh[i].data.getData('POSITION').byteOffset/4;

			//     j -= j0;
			//     j/=4;

			//     LOG('last index >> ', j);
			//     LOG('pos data size', pPosData.length);

			//     var pVertex = pPosData.subarray(j * 3, j * 3 + 3);

			//     LOG('last vertex in submesh >> ', pVertex[0], pVertex[1], pVertex[2]);

			//         var pSceneNode = pEngine.appendMesh(
			//             pEngine.pCubeMesh.clone(a.Mesh.GEOMETRY_ONLY|a.Mesh.SHARED_GEOMETRY),
			//             pEngine.getRootNode());

			//         pSceneNode.setPosition(pVertex);
			//         pSceneNode.setScale(0.1);
			//     var pMeta = pSkin.getInfluenceMetaData().getTypedData('BONE_INF_COUNT');
			//     LOG(pMeta[j], 'count << ');

			//};
		}
#endif
	}



	export function createSkin(pMesh: IMesh): ISkin {
		return new Skin(pMesh);
	}
}

#endif