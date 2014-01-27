/// <reference path="../idl/ITexture.ts" />
/// <reference path="../idl/IResourcePool.ts" />
/// <reference path="../idl/IRenderTexture.ts" />

/// <reference path="../pixelUtil/PixelBox.ts" />

/// <reference path="WebGLPixelBuffer.ts" />
/// <reference path="WebGLRenderer.ts" />

module akra.webgl {
	var SQUARE_VERTICES: Float32Array = new Float32Array([ -1.0, -1.0,
															1.0, -1.0,
														   -1.0,  1.0,
															1.0,  1.0 ]);
	var TEXCOORDS: Float32Array = new Float32Array(12);

	export function computeLog(iValue: int): int {
		var i: int = 0;
		/* Error! */
		if (iValue === 0) return -1;

		for (;;) {
			if (iValue & 1) {
				/* Error! */
				if (iValue !== 1) return -1;
					return i;
			}
			iValue = iValue >> 1;
			i++;
		}
	}

	export class WebGLTextureBuffer extends WebGLPixelBuffer implements IPixelBuffer {
		protected _eTarget: int = null;
		protected _eFaceTarget: int = null; 
		protected _pWebGLTexture: WebGLTexture = null;
		protected _iFace: uint = 0;
		protected _iLevel: int = 0;
		protected _bSoftwareMipmap: boolean = false;
		protected _pRTTList: IRenderTexture[] = null;

		constructor () {
			super();
		}

		_clearRTT(iZOffset: uint): void {
			this._pRTTList[iZOffset] = null;
		}

		reset(): void;
		reset(iSize: uint): void;
		reset(iWidth: uint, iHeight: uint): void;
		reset(iWidth: uint = this._iWidth, iHeight: uint = iWidth): void {
			//TODO: check format
			iWidth = math.ceilingPowerOfTwo(iWidth);
			iHeight = math.ceilingPowerOfTwo(iHeight);

			this._iWidth = this._iLevel === 0 ? iWidth : iWidth / Math.pow(2.0, this._iLevel);
			this._iHeight = this._iLevel === 0 ? iHeight : iHeight / Math.pow(2.0, this._iLevel);

			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			

			//pWebGLRenderer.debug(true, true);

			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

			pWebGLRenderer.bindWebGLTexture(this._eTarget, this._pWebGLTexture);

			pWebGLContext.texImage2D(this._eFaceTarget,
									 this._iLevel,
									 getClosestWebGLInternalFormat(getSupportedAlternative(this._eFormat)),	                            			
									 this._iWidth, this._iHeight, 0,
									 getWebGLFormat(this._eFormat), getWebGLDataType(this._eFormat),
									 null);	

			this._iByteSize = pixelUtil.getMemorySize(this._iWidth, this._iHeight, this._iDepth, this._eFormat);
			this._pBuffer.setPosition(0, 0, this._iWidth, this._iHeight, 0, this._iDepth);

			pWebGLRenderer.bindWebGLTexture(this._eTarget, null);

			this.notifyResized();

			//pWebGLRenderer.debug(false, false);
		}

		private notifyResized(): void {
			if (!isNull(this._pRTTList)) {
				for (var i: int = 0; i < this._pRTTList.length; ++ i) {
					var pRTT: IRenderTexture = this._pRTTList[i];
					pRTT.resized.emit(pRTT.getWidth(), pRTT.getHeight());
				}
			}
		}

		create(iFlags: int): boolean;
		create(iWidth: int, iHeight: int, iDepth: int, eFormat: EPixelFormats, iFlags: int): boolean;
		create(eTarget: int, pTexture: WebGLTexture, iWidth: uint, iHeight: uint, iInternalFormat: int, iFormat: int, 
			   iFace: uint, iLevel: int, iFlags: int, bSoftwareMipmap: boolean): boolean;
		create(): boolean {
			if(arguments.length < 6) {
				logger.critical("Invalid number of params. For WebGLTextureBuffer");
			}

			var eTarget: int = arguments[0];
			var pTexture: WebGLTexture = arguments[1];
			var iWidth: uint = arguments[2];
			var iHeight: uint = arguments[3];
			var iInternalFormat: int = arguments[4];
			var iFormat: int = arguments[5];
			var iFace: uint = arguments[6];
			var iLevel: int = arguments[7];
			var iFlags: int = arguments[8];
			var bSoftwareMipmap: boolean = arguments[9];

			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();

			pWebGLRenderer.bindWebGLTexture(eTarget, pTexture);

			this._eTarget = eTarget;
			this._pWebGLTexture = pTexture;
			this._iFace = iFace;
			this._iLevel = iLevel;
			this._iFlags = iFlags;
			this._bSoftwareMipmap = bSoftwareMipmap;

			this._eFaceTarget = eTarget;

			if(eTarget === gl.TEXTURE_CUBE_MAP){
				this._eFaceTarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + iFace;
			}
			
			this._iWidth = iLevel === 0 ? iWidth : iWidth / Math.pow(2.0, iLevel);
			this._iHeight = iLevel === 0 ? iHeight : iHeight / Math.pow(2.0, iLevel);
			this._iDepth = 1;

			this._iWebGLInternalFormat = iInternalFormat;
			this._eFormat = getClosestAkraFormat(iInternalFormat, iFormat);

			this._iRowPitch = this._iWidth;
			this._iSlicePitch = this._iHeight * this._iWidth;
			this._iByteSize = pixelUtil.getMemorySize(this._iWidth, this._iHeight, this._iDepth, this._eFormat);

			this._pBuffer = new pixelUtil.PixelBox(this._iWidth, this._iHeight, this._iDepth, this._eFormat);
			
			if(this._iWidth === 0 || this._iHeight === 0 || this._iDepth === 0){
				// We are invalid, do not allocate a buffer
				return false;
			}

			// Is this a render target?
			if (bf.testAny(this._iFlags, ETextureFlags.RENDERTARGET)) {
				// Create render target for each slice
				this._pRTTList = new Array<WebGLRenderTexture>();
				for(var iZOffset: uint = 0; iZOffset < this._iDepth; ++iZOffset) {
					var pRenderTexture: WebGLRenderTexture = new WebGLRenderTexture(pWebGLRenderer, this);
					this._pRTTList.push(pRenderTexture);
					pWebGLRenderer.attachRenderTarget(pRenderTexture);
				}
			}
			
			var pProgram: IShaderProgram = <IShaderProgram>this.getManager().getShaderProgramPool().findResource("WEBgl.blit_texture_buffer"); 
			var sFloatToVec4Func: string = "\
				vec4 floatToVec4(float value){						\n\
					float data = value;								\n\
					vec4 result = vec4(0.);							\n\
																	\n\
					if(data == 0.){									\n\
						float signedZeroTest = 1./value;			\n\
						if(signedZeroTest < 0.){					\n\
							result.x = 128.;						\n\
						}											\n\
						return result/255.;							\n\
					}												\n\
																	\n\
					if(data < 0.){									\n\
						result.x=128.;								\n\
						data = -data;								\n\
					}												\n\
																	\n\
					float power = 0.;								\n\
					bool isFinish = false;							\n\
					for(int i=0;i<128;i++){							\n\
						if(isFinish){								\n\
							break;									\n\
						}											\n\
																	\n\
						if(data >= 2.) {							\n\
							if(!isFinish){							\n\
								data = data * 0.5;					\n\
								power += 1.;						\n\
								if (power == 127.) {				\n\
									isFinish = true;				\n\
								}									\n\
							}										\n\
						}											\n\
						else if(data < 1.) {						\n\
							if(!isFinish){							\n\
								data = data * 2.;					\n\
								power -= 1.;						\n\
								if (power == -126.) {				\n\
									isFinish = true;				\n\
								}									\n\
							}										\n\
						}											\n\
						else {										\n\
							isFinish = true;						\n\
						}											\n\
					}												\n\
																	\n\
					if(power == -126. && data < 1.){				\n\
						power = 0.;									\n\
					}												\n\
					else{											\n\
						power = power+127.;							\n\
						data = data - 1.;							\n\
					}												\n\
																	\n\
					result.x+=floor(power/2.);						\n\
					result.y = mod(power,2.)*128.;					\n\
																	\n\
					data *= 128.;									\n\
																	\n\
					result.y += floor(data);						\n\
																	\n\
					data -= floor(data);							\n\
					data *= 256.;									\n\
																	\n\
					result.z = floor(data);							\n\
																	\n\
					data -= floor(data);							\n\
					data *= 256.;									\n\
																	\n\
					result.w = floor(data);							\n\
																	\n\
					return result/255.;								\n\
				}													\n";

			if(isNull(pProgram)){
				pProgram = <IShaderProgram>this.getManager().getShaderProgramPool().createResource("WEBgl.blit_texture_buffer");
				pProgram.create(
				"																									\n\
				attribute vec2 POSITION;																			\n\
				attribute vec3 TEXCOORD;																			\n\
																													\n\
				varying vec3 texcoord;																				\n\
																													\n\
				void main(void){																					\n\
					texcoord = TEXCOORD;																			\n\
					gl_Position = vec4(POSITION, 0., 1.);															\n\
				}																									\n\
				",
				"													\n\
				#ifdef GL_ES                        				\n\
					precision highp float;          				\n\
				#endif												\n\
				varying vec3 texcoord;              				\n\
				uniform sampler2D uSampler;        					\n\
																	\n\
				void main(void) {  									\n\
					vec4 color;										\n\
					color = texture2D(uSampler, texcoord.xy);      	\n\
					gl_FragColor = color;           				\n\
				}                                   				\n\
				");
			}

			pProgram = <IShaderProgram>this.getManager().getShaderProgramPool().findResource("WEBgl.decode_depth32_texture");

			if (isNull(pProgram)) {
				pProgram = <IShaderProgram>this.getManager().getShaderProgramPool().createResource("WEBgl.decode_depth32_texture");
				pProgram.create("																									\n\
				attribute vec2 POSITION;																			\n\
				attribute vec3 TEXCOORD;																			\n\
																													\n\
				varying vec3 texcoord;																				\n\
																													\n\
				void main(void){																					\n\
					texcoord = TEXCOORD;																			\n\
					gl_Position = vec4(POSITION, 0., 1.);															\n\
				}																									\n\
				",
				"													\n\
				#ifdef GL_ES                        				\n\
					precision highp float;          				\n\
				#endif												\n\
				varying vec3 texcoord;              				\n\
				uniform sampler2D uSampler;        					\n\
																	\n\
				" + sFloatToVec4Func + "\
																	\n\
				void main(void) {  									\n\
					vec4 color;										\n\
					color = texture2D(uSampler, vec2(texcoord.x, 1. - texcoord.y));      	\n\
					vec4 t = floatToVec4(color.r);					\n\
					gl_FragColor = vec4(t.a, t.b, t.g, t.r);		\n\
				}                                   				\n\
				");
			}

			pProgram = <IShaderProgram>this.getManager().getShaderProgramPool().findResource("WEBgl.decode_float32_texture");

			if (isNull(pProgram)) {
				pProgram = <IShaderProgram>this.getManager().getShaderProgramPool().createResource("WEBgl.decode_float32_texture");
				pProgram.create("																									\n\
				attribute vec2 POSITION;																			\n\
				attribute vec3 TEXCOORD;																			\n\
																													\n\
				varying vec3 texcoord;																				\n\
				varying vec2 dest_texcoord;																			\n\
																													\n\
				void main(void){																					\n\
					texcoord = TEXCOORD;																			\n\
					gl_Position = vec4(POSITION, 0., 1.);															\n\
					dest_texcoord.xy = (POSITION.xy + 1.  ) /2.;													\n\
				}																									\n\
				",
				"													\n\
				#ifdef GL_ES                        				\n\
					precision highp float;          				\n\
				#endif												\n\
																	\n\
				varying vec3 texcoord;              				\n\
				uniform sampler2D uSampler;							\n\
				uniform int dst_width;        						\n\
				uniform int dst_height;        						\n\
				uniform int src_components_num;						\n\
				varying vec2 dest_texcoord;							\n\
				" + sFloatToVec4Func + "\
																	\n\
				void main(void) {  									\n\
																	\n\
					float pixel = dest_texcoord.x * float(dst_width);	\n\
					float value;									\n\
					int comp = int(mod(pixel, float(src_components_num)));	\n\
					vec4 color = texture2D(uSampler, vec2(texcoord.x, 1. - texcoord.y));\n\
																	\n\
					if (comp == 0)									\n\
						value = color.r;							\n\
					if (comp == 1)									\n\
						value = color.g;							\n\
					if (comp == 2)									\n\
						value = color.b;							\n\
					if (comp == 3)									\n\
						value = color.a;	 						\n\
																	\n\
					vec4 t = floatToVec4(value);					\n\
																	\n\
					gl_FragColor = vec4(t.a, t.b, t.g, t.r);		\n\
				}\
				");
			}

			pWebGLRenderer.bindWebGLTexture(eTarget, null);

			return true;
		}

		// destroyResource(): boolean {
		// 	super.destroyResource();
		// 	this._pWebGLTexture = null;
		// 	this.destroy();
		// 	return true;
		// }

		destroy(): void {  
			if (bf.testAny(this._iFlags, ETextureFlags.RENDERTARGET)) {
				// Delete all render targets that are not yet deleted via _clearSliceRTT because the rendertarget
				// was deleted by the user.
				var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
				for (var i: uint = 0; i < this._pRTTList.length; i++) {
					pWebGLRenderer.destroyRenderTarget(this._pRTTList[i]);
				}
			}
		}

		//upload(download) data to(from) videocard.
		protected upload(pData: IPixelBox, pDestBox: IBox): void {
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

			pWebGLRenderer.bindWebGLTexture(this._eTarget, this._pWebGLTexture);
			
			var pDataBox: IPixelBox = null;

			if(pixelUtil.isCompressed(pData.format)) {
				if(pData.format !== this._eFormat || !pData.isConsecutive()){
					logger.critical("Compressed images must be consecutive, in the source format");
				}

				var iWebGLFormat: int = webgl.getClosestWebGLInternalFormat(this._eFormat);
				// Data must be consecutive and at beginning of buffer as PixelStorei not allowed
				// for compressed formats
				if (pDestBox.left === 0 && pDestBox.top === 0) {
					pWebGLContext.compressedTexImage2D(this._eFaceTarget, this._iLevel,
													   iWebGLFormat,
													   pDestBox.getWidth(),
														pDestBox.getHeight(),
													   0,
													   pData.data);
				}
				else {
					pWebGLContext.compressedTexSubImage2D(this._eFaceTarget, this._iLevel,
														 pDestBox.left, pDestBox.top,
														 pDestBox.getWidth(), pDestBox.getHeight(),
														 iWebGLFormat, pData.data);

				}
			}
			else if(this._bSoftwareMipmap) {

				if (pData.getWidth() !== pData.rowPitch ||
					pData.getHeight() * pData.getWidth() !== pData.slicePitch) {

					pDataBox = this._pBuffer.getSubBox(pDestBox, pixelUtil.PixelBox.temp());
					pDataBox.setConsecutive();
					pixelUtil.bulkPixelConversion(pData, pDataBox);

				}
				else
				{
					pDataBox = pData;
				}

				pWebGLRenderer.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
				this.buildMipmaps(pDataBox); 
			}
			else {
				if (pData.getWidth() !== pData.rowPitch ||
					pData.getHeight() * pData.getWidth() !== pData.slicePitch) {
					pDataBox = this._pBuffer.getSubBox(pDestBox, pixelUtil.PixelBox.temp());
					pDataBox.setConsecutive();
					pixelUtil.bulkPixelConversion(pData, pDataBox);
				}
				else {
					pDataBox = pData;
				}

				if ((pData.getWidth() * pixelUtil.getNumElemBytes(pData.format)) & 3) {
					// Standard alignment of 4 is not right
					pWebGLRenderer.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
				}
				if (pDestBox.left === 0 && pDestBox.top === 0 && 
					pDestBox.getWidth() >= this.getWidth() && pDestBox.getHeight() >= this.getHeight()) 
				{
					pWebGLContext.texImage2D(this._eFaceTarget,
										this._iLevel,
										webgl.getWebGLFormat(pData.format),	                            			
										pDestBox.getWidth(), pDestBox.getHeight(), 0,
										webgl.getWebGLFormat(pData.format),
										webgl.getWebGLDataType(pData.format),
										!pixelUtil.isFloatingPoint(pData.format)? 
										pDataBox.data: 
										new Float32Array(pDataBox.data.buffer, pDataBox.data.byteOffset, pDataBox.data.byteLength / Float32Array.BYTES_PER_ELEMENT));
				}
				else
				{
					pWebGLContext.texSubImage2D(this._eFaceTarget,
										this._iLevel,
										pDestBox.left, pDestBox.top,                            			
										pDestBox.getWidth(), pDestBox.getHeight(),
										webgl.getWebGLFormat(pData.format),
										webgl.getWebGLDataType(pData.format),
										pDataBox.data);
				}
			}
			
			if (bf.testAny(this._iFlags, ETextureFlags.AUTOMIPMAP) && !this._bSoftwareMipmap && (this._iLevel === 0)) {
				pWebGLContext.generateMipmap(this._eFaceTarget);
			}

			pWebGLRenderer.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
			
			pWebGLRenderer.bindWebGLTexture(this._eTarget, null);

			this.notifyAltered();
		}



		protected download(pData: IPixelBox): void {


			logger.assert (!((pData.right > this._iWidth) || (pData.bottom > this._iHeight) || (pData.front != 0) || (pData.back != 1)), "Invalid box " + pData.toString());

			var pSrcBox:IPixelBox = null;
			var pWebGLTexture: WebGLTexture = this._pWebGLTexture;
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

			if(!checkFBOAttachmentFormat(this.getFormat())) {
				logger.critical("Read from texture this format not support(" + this.getFormat() + ")");
			}

			if (!checkReadPixelFormat(this.getFormat())) {
				logger.assert (
					this.getFormat() === EPixelFormats.DEPTH32 || 
					this.getFormat() === EPixelFormats.FLOAT32_RGB ||
					this.getFormat() === EPixelFormats.FLOAT32_RGBA, "TODO: downloading for all formats");

				var eFormat: EPixelFormats = this.getFormat();
				var pDestBox: IBox = geometry.Box.temp(0, 0, 0, pData.getWidth() * pixelUtil.getComponentCount(this.getFormat()), pData.getHeight(), pData.getDepth());

				if (this.getFormat() === EPixelFormats.DEPTH32) {
					eFormat = EPixelFormats.FLOAT32_DEPTH;
				}

				// мы не можем читать из данного формата напрямую, поэтому необходимо перерендерить эту текстура в RGB/RGBA 8.
				var pProgram: WebGLShaderProgram = <WebGLShaderProgram>this.getManager().getShaderProgramPool().findResource(
					this.getFormat() === EPixelFormats.DEPTH32? "WEBgl.decode_depth32_texture": "WEBgl.decode_float32_texture");

				pWebGLTexture = WebGLTextureBuffer.copyTex2DImageByProgram(pProgram, pDestBox, EPixelFormats.R8G8B8A8, this, pData);

				if (pData.format === eFormat) {
					pSrcBox = pData;
				}
				else {
					pSrcBox = new pixelUtil.PixelBox(pData, eFormat, 
						new Uint8Array(pixelUtil.getMemorySize(
							pData.getWidth() * pixelUtil.getComponentCount(this.getFormat()), 
							pData.getHeight(), 
							pData.getDepth(), 
							EPixelFormats.R8G8B8A8)));
				}

				var pOldFramebuffer: WebGLFramebuffer = pWebGLRenderer.getParameter(gl.FRAMEBUFFER_BINDING);
				var pFrameBuffer: WebGLFramebuffer = pWebGLRenderer.createWebGLFramebuffer();
				
				pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pFrameBuffer);
				pWebGLContext.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pWebGLTexture, 0);
				pWebGLContext.readPixels(0, 0, pDestBox.getWidth(), pDestBox.getHeight(), gl.RGBA, gl.UNSIGNED_BYTE, pSrcBox.data);
				pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pOldFramebuffer);
				pWebGLRenderer.deleteWebGLFramebuffer(pFrameBuffer);
				pWebGLRenderer.deleteWebGLTexture(pWebGLTexture);

				if (pSrcBox != pData) {
					console.log("download. convertion....");
					pixelUtil.bulkPixelConversion(pSrcBox, pData);
				}

				return;
			}

			if(checkReadPixelFormat(pData.format))
			{
				pSrcBox = pData;
			}
			else
			{
				pSrcBox = new pixelUtil.PixelBox(pData, EPixelFormats.BYTE_RGBA, 
					new Uint8Array(pixelUtil.getMemorySize(pData.getWidth(), pData.getHeight(), pData.getDepth(), EPixelFormats.BYTE_RGBA)));
			}			

			

			var pOldFramebuffer: WebGLFramebuffer = pWebGLRenderer.getParameter(gl.FRAMEBUFFER_BINDING);
			var pFrameBuffer: WebGLFramebuffer = pWebGLRenderer.createWebGLFramebuffer();
			
			pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pFrameBuffer);

			var eFormat: EPixelFormats = getWebGLFormat(pSrcBox.format);
			var eType: int = getWebGLDataType(pSrcBox.format);

			pWebGLContext.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this._eFaceTarget, pWebGLTexture, this._iLevel);
			pWebGLContext.readPixels(pSrcBox.left, pSrcBox.top, pSrcBox.getWidth(), pSrcBox.getHeight(), eFormat, eType, pSrcBox.data);
			

			if(!checkReadPixelFormat(pData.format))
			{
				console.log("download. convertion....");
				pixelUtil.bulkPixelConversion(pSrcBox, pData);
			}

			//дективировать его
			pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pOldFramebuffer);
			pWebGLRenderer.deleteWebGLFramebuffer(pFrameBuffer);

			// if(data.getWidth() != getWidth() ||
			//     data.getHeight() != getHeight() ||
			//     data.getDepth() != getDepth())
			//     OGRE_EXCEPT(Exception::ERR_INVALIDPARAMS, "only download of entire buffer is supported by GL",
			//         "GLTextureBuffer::download");
			// glBindTexture( mTarget, mTextureID );
			// if(PixelUtil::isCompressed(data.format))
			// {
			//     if(data.format != mFormat || !data.isConsecutive())
			//         OGRE_EXCEPT(Exception::ERR_INVALIDPARAMS, 
			//         "Compressed images must be consecutive, in the source format",
			//         "GLTextureBuffer::download");
			//     // Data must be consecutive and at beginning of buffer as PixelStorei not allowed
			//     // for compressed formate
			//     glGetCompressedTexImageNV(mFaceTarget, mLevel, data.data);
			// } 
			// else
			// {
			//     if((data.getWidth()*PixelUtil::getNumElemBytes(data.format)) & 3) {
			//         // Standard alignment of 4 is not right
			//         glPixelStorei(gl.PACK_ALIGNMENT, 1);
			//     }
			//     // We can only get the entire texture
			//     glGetTexImageNV(mFaceTarget, mLevel, 
			//         GLES2PixelUtil::getGLOriginFormat(data.format), GLES2PixelUtil::getGLOriginDataType(data.format),
			//         data.data);
			//     // Restore defaults
			//     glPixelStorei(gl.PACK_ALIGNMENT, 4);
			// }
			//logger.critical("Downloading texture buffers is not supported by OpenGL ES");
		}

		protected buildMipmaps(pData: IPixelBox): void {
			var iWidth: int = 0;
			var iHeight: int = 0;
			var iLogW: int = 0;
			var iLogH: int = 0;
			var iLevel: int = 0;
			var pScaled: IPixelBox = new pixelUtil.PixelBox();

			pScaled.data = pData.data;
			pScaled.left = pData.left;
			pScaled.right = pData.right;
			pScaled.top = pData.top;
			pScaled.bottom = pData.bottom;
			pScaled.front = pData.front;
			pScaled.back = pData.back;

			iWidth = pData.getWidth();
			iHeight = pData.getHeight();

			iLogW = computeLog(iWidth);
			iLogH = computeLog(iHeight);
			iLevel = (iLogW > iLogH ? iLogW : iLogH);

			var mip: int = 0;
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

			for (mip = 0; mip <= iLevel; mip++) {
				var iWebGLFormat: int = webgl.getWebGLFormat(pScaled.format);
				var iWebGLDataType: int = webgl.getWebGLDataType(pScaled.format);

				pWebGLContext.texImage2D(this._eFaceTarget,
										 mip,
										 iWebGLFormat,
										 iWidth, iHeight,
										 0,
										 iWebGLFormat,
										 iWebGLDataType,
										 pScaled.data);

				if (mip !== 0) {
					pScaled.data = null;
				}

				if (iWidth > 1) {
					iWidth = iWidth / 2;
				}

				if (iHeight > 1) {
					iHeight = iHeight / 2;
				}

				var iSizeInBytes: int = pixelUtil.getMemorySize(iWidth, iHeight, 1, pData.format);
				pScaled = new pixelUtil.PixelBox(iWidth, iHeight, 1, pData.format);
				pScaled.data = new Uint8Array(iSizeInBytes);
				pData.scale(pScaled, EFilters.LINEAR);
			}

			// Delete the scaled data for the last level
			
			if (iLevel > 0) {
				pScaled.data = null;
			}
		}

		_bindToFramebuffer(iAttachment: int, iZOffset: uint): void {
			logger.assert(iZOffset < this._iDepth);
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();
			pWebGLContext.framebufferTexture2D(gl.FRAMEBUFFER, iAttachment, this._eFaceTarget, this._pWebGLTexture, this._iLevel);
		}

		_copyFromFramebuffer(iZOffset: uint): void {
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();
			
			pWebGLRenderer.bindWebGLTexture(this._eTarget, this._pWebGLTexture);
			pWebGLContext.copyTexSubImage2D(this._eFaceTarget, this._iLevel, 0, 0, 0, 0, this._iWidth, this._iHeight);
			pWebGLRenderer.bindWebGLTexture(this._eTarget, null);
		}

		 _getTarget(): int {
			return this._eTarget;
		}

		 _getWebGLTexture(): WebGLTexture {
			return this._pWebGLTexture;
		}

		 _getFaceTarget(): int {
			return this._eFaceTarget;
		}

		blit(pSource: IPixelBuffer): boolean;
		blit(pSource: IPixelBuffer, pSrcBox: IBox, pDestBox: IBox): boolean;
		blit(pSource: IPixelBuffer, pSrcBox?: IBox, pDestBox?: IBox): boolean {
			if (arguments.length === 1) {
				return this.blit(pSource, 
					new geometry.Box(0, 0, 0, pSource.getWidth(), pSource.getHeight(), pSource.getDepth()), 
					new geometry.Box(0, 0, 0, this._iWidth, this._iHeight, this._iDepth)
				);
			}
			else {
				var pSourceTexture: WebGLTextureBuffer = <WebGLTextureBuffer>pSource;
				// TODO: Check for FBO support first
				// Destination texture must be 2D or Cube
				// Source texture must be 2D
				if (!bf.testAny(pSourceTexture.getFlags(), ETextureFlags.RENDERTARGET) && 
					pSourceTexture._getTarget() === gl.TEXTURE_2D) {

					return this.blitFromTexture(pSourceTexture, pSrcBox, pDestBox);
				}
				else {
					return super.blit(pSource, pSrcBox, pDestBox);
				}				
			}
		}

		private static copyTex2DImageByProgram(pProgram: WebGLShaderProgram, pDestBox: IBox, eFormat: int, pSource: WebGLTextureBuffer, pSrcBox: IBox = null): WebGLTexture {
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>pSource.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

			pWebGLRenderer._disableTextureUnitsFrom(0);
			pWebGLRenderer.activateWebGLTexture(gl.TEXTURE0);

			// Disable alpha, depth and scissor testing, disable blending, 
			// and disable culling
			pWebGLRenderer.disable(gl.DEPTH_TEST);
			pWebGLRenderer.disable(gl.SCISSOR_TEST);
			pWebGLRenderer.disable(gl.BLEND);
			pWebGLRenderer.disable(gl.CULL_FACE);

			// Set up source texture
			pWebGLRenderer.bindWebGLTexture(pSource._getFaceTarget(), pSource._getWebGLTexture());
			var iOldMagFilter: uint = pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_MAG_FILTER),
				iOldMinFilter: uint = pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_MIN_FILTER),
				iOldWrapS: uint 	= pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_WRAP_S),
				iOldWrapT: uint 	= pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_WRAP_T);

			if (isNull(pSrcBox)) {
				pSrcBox = pDestBox;
			}

			// Set filtering modes depending on the dimensions and source
			if (pSrcBox.getWidth() === pDestBox.getWidth() &&
				pSrcBox.getHeight() === pDestBox.getHeight() &&
			    pSrcBox.getDepth() === pDestBox.getDepth()) {
				// Dimensions match -- use nearest filtering (fastest and pixel correct)
				pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			}
			else {
				pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			}
			// Clamp to edge (fastest)
			pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			//Store old binding so it can be restored later
			var pOldFramebuffer: WebGLFramebuffer = pWebGLRenderer.getParameter(gl.FRAMEBUFFER_BINDING);
			var pFramebuffer: WebGLFramebuffer = pWebGLRenderer.createWebGLFramebuffer();

			pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pFramebuffer);

			var pTempWebGLTexture: WebGLTexture = null;


			// If target format not directly supported, create intermediate texture
			var iGLTempFormat: int = webgl.getClosestWebGLInternalFormat(webgl.getSupportedAlternative(eFormat));
			
			pTempWebGLTexture = pWebGLRenderer.createWebGLTexture();
			pWebGLRenderer.bindWebGLTexture(gl.TEXTURE_2D, pTempWebGLTexture);
			// Allocate temporary texture of the size of the destination area
			pWebGLContext.texImage2D(gl.TEXTURE_2D, 0, iGLTempFormat, 
				/*math.ceilingPowerOfTwo*/(pDestBox.getWidth()), 
				/*math.ceilingPowerOfTwo*/(pDestBox.getHeight()), 
				0, gl.RGBA, gl.UNSIGNED_BYTE, null);

			pWebGLContext.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
											   gl.TEXTURE_2D, pTempWebGLTexture, 0);
			// Set viewport to size of destination slice
			pWebGLContext.viewport(0, 0, pDestBox.getWidth(), pDestBox.getHeight());
	

			//Get WebGL program
			var pWebGLShaderProgram: WebGLShaderProgram = <WebGLShaderProgram>pProgram; 
			pWebGLRenderer.disableAllWebGLVertexAttribs();
			pWebGLRenderer.useWebGLProgram(pWebGLShaderProgram.getWebGLProgram());

			var iPosAttrIndex: int = 0;
			var iTexAttrIndex: int = 0;

			iPosAttrIndex = pWebGLShaderProgram.getWebGLAttributeLocation("POSITION");
			iTexAttrIndex = pWebGLShaderProgram.getWebGLAttributeLocation("TEXCOORD");

			pWebGLContext.enableVertexAttribArray(iPosAttrIndex);
			pWebGLContext.enableVertexAttribArray(iTexAttrIndex);

			var pSquareVertices: Float32Array = SQUARE_VERTICES;
			var pTexCoords: Float32Array = TEXCOORDS;

			var pPositionBuffer: WebGLBuffer = pWebGLRenderer.createWebGLBuffer();
			var pTexCoordsBuffer: WebGLBuffer = pWebGLRenderer.createWebGLBuffer(); 

			pWebGLRenderer.bindWebGLBuffer(gl.ARRAY_BUFFER, pPositionBuffer);
			pWebGLContext.bufferData(gl.ARRAY_BUFFER, pSquareVertices, gl.STREAM_DRAW);
			pWebGLContext.vertexAttribPointer(iPosAttrIndex, 2, gl.FLOAT, false, 0, 0);

			pWebGLShaderProgram.setInt("uSampler", 0);
			pWebGLShaderProgram.setInt("src_components_num", pixelUtil.getComponentCount(pSource.getFormat()));
			pWebGLShaderProgram.setInt("dst_width", pDestBox.getWidth());
			pWebGLShaderProgram.setInt("dst_height", pDestBox.getHeight());
			// LOG("dest size: ", pDestBox.width, "x", pDestBox.height, "cn: ", pixelUtil.getComponentCount(pSource.format));
			// Process each destination slice
			var iSlice: int = 0;
			for(iSlice = pDestBox.front; iSlice < pDestBox.back; ++iSlice) {
				/// Calculate source texture coordinates
				var u1: float = <float>pSrcBox.left / <float>pSource.getWidth();
				var v1: float = <float>pSrcBox.top / <float>pSource.getHeight();
				var u2: float = <float>pSrcBox.right / <float>pSource.getWidth();
				var v2: float = <float>pSrcBox.bottom / <float>pSource.getHeight();
				/// Calculate source slice for this destination slice
				var w: float = <float>(iSlice - pDestBox.front) / <float>pDestBox.getDepth();
				/// Get slice # in source
				w = w * <float>pSrcBox.getDepth() + pSrcBox.front;
				/// Normalise to texture coordinate in 0.0 .. 1.0
				w = (w + 0.5) / <float>pSource.getDepth();
				
				pTexCoords[0] = u1;
				pTexCoords[1] = v1;
				pTexCoords[2] = w;
				
				pTexCoords[3] = u2;
				pTexCoords[4] = v1;
				pTexCoords[5] = w;
				
				pTexCoords[6] = u2;
				pTexCoords[7] = v2;
				pTexCoords[8] = w;

				pTexCoords[9]  = u1;
				pTexCoords[10] = v2;
				pTexCoords[11] = w;
				
				/// Finally we're ready to rumble	
				pWebGLRenderer.bindWebGLTexture(pSource._getFaceTarget(), pSource._getWebGLTexture());
				
				pWebGLRenderer.bindWebGLBuffer(gl.ARRAY_BUFFER, pTexCoordsBuffer);
				pWebGLContext.bufferData(gl.ARRAY_BUFFER, pTexCoords, gl.STREAM_DRAW);
				pWebGLContext.vertexAttribPointer(iTexAttrIndex, 3, gl.FLOAT, false, 0, 0);

				pWebGLContext.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}

			pWebGLContext.disableVertexAttribArray(iPosAttrIndex);
			pWebGLContext.disableVertexAttribArray(iTexAttrIndex);

			pWebGLRenderer.deleteWebGLBuffer(pPositionBuffer);
			pWebGLRenderer.deleteWebGLBuffer(pTexCoordsBuffer);

			// Reset source texture to sane state
			pWebGLRenderer.bindWebGLTexture(pSource._getFaceTarget(), pSource._getWebGLTexture());
			pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_MIN_FILTER, iOldMinFilter);
			pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_MAG_FILTER, iOldMagFilter);
			pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_WRAP_S, iOldWrapS);
			pWebGLContext.texParameteri(pSource._getFaceTarget(), gl.TEXTURE_WRAP_T, iOldWrapT);
			pWebGLRenderer.bindWebGLTexture(pSource._getFaceTarget(), null);
			
			// Detach texture from temporary framebuffer
			pWebGLContext.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
												  gl.RENDERBUFFER, null);
			// Restore old framebuffer
			pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pOldFramebuffer);
			pWebGLRenderer.deleteWebGLFramebuffer(pFramebuffer);

			return pTempWebGLTexture;
		}

		//-----------------------------------------------------------------------------  
		// Very fast texture-to-texture blitter and hardware bi/trilinear scaling implementation using FBO
		// Destination texture must be 1D, 2D, 3D, or Cube
		// Source texture must be 1D, 2D or 3D
		// Supports compressed formats as both source and destination format, it will use the hardware DXT compressor
		// if available.
		blitFromTexture(pSource: WebGLTextureBuffer, pSrcBox: IBox, pDestBox: IBox): boolean {
			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

			if (this.getFormat() === pSource.getFormat() && 
				checkCopyTexImage(this.getFormat()) &&
				this._pBuffer.contains(pDestBox) &&
				pSrcBox.getWidth() === pDestBox.getWidth() &&
				pSrcBox.getHeight() === pDestBox.getHeight() &&
				pSrcBox.getDepth() === pDestBox.getDepth()) 
			{
				var pOldFramebuffer: WebGLFramebuffer = pWebGLRenderer.getParameter(gl.FRAMEBUFFER_BINDING);
				var pFramebuffer: WebGLFramebuffer = pWebGLRenderer.createWebGLFramebuffer();
				
				pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pFramebuffer);

				pWebGLContext.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
												   pSource._getTarget(), pSource._getWebGLTexture(), 0);

				pWebGLRenderer.bindWebGLTexture(this._eTarget, this._pWebGLTexture);

				if (pDestBox.getWidth() === this.getWidth() && pDestBox.getHeight() === this.getHeight()){
					pWebGLContext.copyTexImage2D(this._eFaceTarget, this._iLevel, 
						getWebGLFormat(this._eFormat),
						pSrcBox.left, pSrcBox.top,
						pSrcBox.getWidth(), pSrcBox.getHeight(), 0);
				}
				else {
					pWebGLContext.copyTexSubImage2D(this._eFaceTarget, this._iLevel, 
						pDestBox.left, pDestBox.top,
						pSrcBox.left, pSrcBox.top,
						pSrcBox.getWidth(), pSrcBox.getHeight());
				}

				pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pOldFramebuffer);
				pWebGLRenderer.bindWebGLTexture(this._eTarget, null);
				pWebGLRenderer.deleteWebGLFramebuffer(pFramebuffer);

				this.notifyAltered();

				return true;
			}
			pWebGLRenderer._disableTextureUnitsFrom(0);
			pWebGLRenderer.activateWebGLTexture(gl.TEXTURE0);

			// Disable alpha, depth and scissor testing, disable blending, 
			// and disable culling
			pWebGLRenderer.disable(gl.DEPTH_TEST);
			pWebGLRenderer.disable(gl.SCISSOR_TEST);
			pWebGLRenderer.disable(gl.BLEND);
			pWebGLRenderer.disable(gl.CULL_FACE);

			// Set up source texture
			pWebGLRenderer.bindWebGLTexture(pSource._getTarget(), pSource._getWebGLTexture());
			var iOldMagFilter: uint = pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_MAG_FILTER),
				iOldMinFilter: uint = pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_MIN_FILTER),
				iOldWrapS: uint 	= pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_WRAP_S),
				iOldWrapT: uint 	= pWebGLContext.getTexParameter(pSource._getFaceTarget(), gl.TEXTURE_WRAP_T);

			// Set filtering modes depending on the dimensions and source
			if (pSrcBox.getWidth() === pDestBox.getWidth() &&
				pSrcBox.getHeight() === pDestBox.getHeight() &&
			    pSrcBox.getDepth() === pDestBox.getDepth()) {
				// Dimensions match -- use nearest filtering (fastest and pixel correct)
				pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			}
			else {
				// Dimensions don't match -- use bi or trilinear filtering depending on the
				// source texture.
				if(bf.testAny(pSource.getFlags(), ETextureFlags.AUTOMIPMAP)) {
					// Automatic mipmaps, we can safely use trilinear filter which
					// brings greatly improved quality for minimisation.
					pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
					pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MAG_FILTER, gl.LINEAR);    
				}
				else {
					// Manual mipmaps, stay safe with bilinear filtering so that no
					// intermipmap leakage occurs.
					pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				}
			}
			// Clamp to edge (fastest)
			pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			//Store old binding so it can be restored later
			var pOldFramebuffer: WebGLFramebuffer = pWebGLRenderer.getParameter(gl.FRAMEBUFFER_BINDING);
			
			var pFramebuffer: WebGLFramebuffer = pWebGLRenderer.createWebGLFramebuffer();

			pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pFramebuffer);

			var pTempWebGLTexture: WebGLTexture = null;

			if(!webgl.checkFBOAttachmentFormat(this._eFormat) || pSource._getWebGLTexture() === this._getWebGLTexture()){
				// If target format not directly supported, create intermediate texture
				var iGLTempFormat: int = webgl.getClosestWebGLInternalFormat(webgl.getSupportedAlternative(this._eFormat));
				
				pTempWebGLTexture = pWebGLRenderer.createWebGLTexture();
				pWebGLRenderer.bindWebGLTexture(gl.TEXTURE_2D, pTempWebGLTexture);
				// Allocate temporary texture of the size of the destination area
				pWebGLContext.texImage2D(gl.TEXTURE_2D, 0, iGLTempFormat, 
					math.ceilingPowerOfTwo(pDestBox.getWidth()), 
					math.ceilingPowerOfTwo(pDestBox.getHeight()), 
					0, gl.RGBA, gl.UNSIGNED_BYTE, null);

				pWebGLContext.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
					gl.TEXTURE_2D, pTempWebGLTexture, 0);
					// Set viewport to size of destination slice
					pWebGLContext.viewport(0, 0, pDestBox.getWidth(), pDestBox.getHeight());
			}
			else {
				// We are going to bind directly, so set viewport to size and position of destination slice
				pWebGLContext.viewport(pDestBox.left, pDestBox.top, pDestBox.getWidth(), pDestBox.getHeight());	
			}

			//Get WebGL program
			var pWebGLShaderProgram: WebGLShaderProgram = <WebGLShaderProgram>this.getManager().getShaderProgramPool().findResource("WEBgl.blit_texture_buffer"); 
			pWebGLRenderer.disableAllWebGLVertexAttribs();
			pWebGLRenderer.useWebGLProgram(pWebGLShaderProgram.getWebGLProgram());

			var iPosAttrIndex: int = 0;
			var iTexAttrIndex: int = 0;

			iPosAttrIndex = pWebGLShaderProgram.getWebGLAttributeLocation("POSITION");
			iTexAttrIndex = pWebGLShaderProgram.getWebGLAttributeLocation("TEXCOORD");

			pWebGLContext.enableVertexAttribArray(iPosAttrIndex);
			pWebGLContext.enableVertexAttribArray(iTexAttrIndex);

			var pSquareVertices: Float32Array = SQUARE_VERTICES;
			var pTexCoords: Float32Array = TEXCOORDS;

			var pPositionBuffer: WebGLBuffer = pWebGLRenderer.createWebGLBuffer();
			var pTexCoordsBuffer: WebGLBuffer = pWebGLRenderer.createWebGLBuffer(); 

			pWebGLRenderer.bindWebGLBuffer(gl.ARRAY_BUFFER, pPositionBuffer);
			pWebGLContext.bufferData(gl.ARRAY_BUFFER, pSquareVertices, gl.STREAM_DRAW);
			pWebGLContext.vertexAttribPointer(iPosAttrIndex, 2, gl.FLOAT, false, 0, 0);

			pWebGLShaderProgram.setInt("uSampler", 0);

			// Process each destination slice
			var iSlice: int = 0;
			for(iSlice = pDestBox.front; iSlice < pDestBox.back; ++iSlice) {
				if(isNull(pTempWebGLTexture)) {
					// Bind directly
					this._bindToFramebuffer(gl.COLOR_ATTACHMENT0, iSlice);
				}

				/// Calculate source texture coordinates
				var u1: float = <float>pSrcBox.left / <float>pSource.getWidth();
				var v1: float = <float>pSrcBox.top / <float>pSource.getHeight();
				var u2: float = <float>pSrcBox.right / <float>pSource.getWidth();
				var v2: float = <float>pSrcBox.bottom / <float>pSource.getHeight();
				/// Calculate source slice for this destination slice
				var w: float = <float>(iSlice - pDestBox.front) / <float>pDestBox.getDepth();
				/// Get slice # in source
				w = w * <float>pSrcBox.getDepth() + pSrcBox.front;
				/// Normalise to texture coordinate in 0.0 .. 1.0
				w = (w + 0.5) / <float>pSource.getDepth();
				
				pTexCoords[0] = u1;
				pTexCoords[1] = v1;
				pTexCoords[2] = w;
				
				pTexCoords[3] = u2;
				pTexCoords[4] = v1;
				pTexCoords[5] = w;
				
				pTexCoords[6] = u2;
				pTexCoords[7] = v2;
				pTexCoords[8] = w;

				pTexCoords[9]  = u1;
				pTexCoords[10] = v2;
				pTexCoords[11] = w;

				/// Finally we're ready to rumble	
				pWebGLRenderer.bindWebGLTexture(pSource._getTarget(), pSource._getWebGLTexture());
				
				// pWebGLContext.enable(pSource._getTarget());
				
				pWebGLRenderer.bindWebGLBuffer(gl.ARRAY_BUFFER, pTexCoordsBuffer);
				pWebGLContext.bufferData(gl.ARRAY_BUFFER, pTexCoords, gl.STREAM_DRAW);
				pWebGLContext.vertexAttribPointer(iTexAttrIndex, 3, gl.FLOAT, false, 0, 0);

				pWebGLContext.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				// pWebGLContext.disable(pSource._getTarget());


				if(!isNull(pTempWebGLTexture)) {
					if(pSource === this) {
						//set width, height and _pWebGLTexture
						pWebGLRenderer.deleteWebGLTexture(this._pWebGLTexture);
						
						this._pWebGLTexture = pTempWebGLTexture;
						this._iWidth = math.ceilingPowerOfTwo(pDestBox.getWidth());
						this._iHeight = math.ceilingPowerOfTwo(pDestBox.getHeight());
					}
					else {
						// Copy temporary texture
						pWebGLRenderer.bindWebGLTexture(this._eTarget, this._pWebGLTexture);
						
						switch(this._eTarget) {
							case gl.TEXTURE_2D:
							case gl.TEXTURE_CUBE_MAP:
								pWebGLContext.copyTexSubImage2D(this._eFaceTarget, this._iLevel, 
									pDestBox.left, pDestBox.top, 
									0, 0, pDestBox.getWidth(), pDestBox.getHeight());
								break;
						}
					}
				}
			}

			pWebGLContext.disableVertexAttribArray(iPosAttrIndex);
			pWebGLContext.disableVertexAttribArray(iTexAttrIndex);

			pWebGLRenderer.deleteWebGLBuffer(pPositionBuffer);
			pWebGLRenderer.deleteWebGLBuffer(pTexCoordsBuffer);
			
			// Finish up 
			if(!isNull(pTempWebGLTexture)) {
				// Generate mipmaps
				if(bf.testAny(this._iFlags, ETextureFlags.AUTOMIPMAP)) {
					pWebGLRenderer.bindWebGLTexture(this._eTarget, this._pWebGLTexture);
					pWebGLContext.generateMipmap(this._eTarget);
				}
			}
			
			// Reset source texture to sane state
			pWebGLRenderer.bindWebGLTexture(pSource._getTarget(), pSource._getWebGLTexture());
			pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MIN_FILTER, iOldMinFilter);
			pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_MAG_FILTER, iOldMagFilter);
			pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_WRAP_S, iOldWrapS);
			pWebGLContext.texParameteri(pSource._getTarget(), gl.TEXTURE_WRAP_T, iOldWrapT);
			pWebGLRenderer.bindWebGLTexture(pSource._getTarget(), null);
			
			// Detach texture from temporary framebuffer
			pWebGLContext.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
												  gl.RENDERBUFFER, null);
			// Restore old framebuffer
			pWebGLRenderer.bindWebGLFramebuffer(gl.FRAMEBUFFER, pOldFramebuffer);
			if(pSource !== this) {
				pWebGLRenderer.deleteWebGLTexture(pTempWebGLTexture);
			}
			pWebGLRenderer.deleteWebGLFramebuffer(pFramebuffer);

			pTempWebGLTexture = null;
			this.notifyAltered();

			return true;
		} 
		
		blitFromMemory(pSource: IPixelBox): boolean;
		blitFromMemory(pSource: IPixelBox, pDestBox?: IBox): boolean;
		blitFromMemory(): boolean {
			if(arguments.length === 1){
				return super.blitFromMemory(arguments[0]);
			}

			// Fall back to normal GLHardwarePixelBuffer::blitFromMemory in case 
			// - FBO is not supported
			// - Either source or target is luminance due doesn't looks like supported by hardware
			// - the source dimensions match the destination ones, in which case no scaling is needed
			// TODO: Check that extension is NOT available

			var pSourceOrigin: IPixelBox = arguments[0];
			var pDestBox: IBox = arguments[1];

			if (pixelUtil.isLuminance(pSourceOrigin.format) ||
			    pixelUtil.isLuminance(this._eFormat) ||
			   (pSourceOrigin.getWidth() === pDestBox.getWidth() &&
			    pSourceOrigin.getHeight() === pDestBox.getHeight() &&
				pSourceOrigin.getDepth() === pDestBox.getDepth())) {

				return super.blitFromMemory(pSourceOrigin, pDestBox);	            
			}

			if(!this._pBuffer.contains(pDestBox)) {
				logger.critical("Destination box out of range");
			}

			var pSource: IPixelBox;
			// First, convert the srcbox to a OpenGL compatible pixel format
			if(getWebGLFormat(pSourceOrigin.format) === 0){
				// Convert to buffer internal format
				var iSizeInBytes: int = pixelUtil.getMemorySize(pSourceOrigin.getWidth(), pSourceOrigin.getHeight(),
																pSourceOrigin.getDepth(), this._eFormat);
				pSource = new pixelUtil.PixelBox(pSourceOrigin.getWidth(), pSourceOrigin.getHeight(),
												 pSourceOrigin.getDepth(), this._eFormat, new Uint8Array(iSizeInBytes));

				pixelUtil.bulkPixelConversion(pSourceOrigin, pSource);
			}
			else {
				// No conversion needed
				pSource = pSourceOrigin;
			}

			var pWebGLRenderer: WebGLRenderer = <WebGLRenderer>this.getManager().getEngine().getRenderer();
			var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();
			
			// Create temporary texture to store source data
			var pTempWebGLTexture: WebGLTexture = null;
			var eTarget: int = gl.TEXTURE_2D;
			var iWidth: int = math.ceilingPowerOfTwo(pSource.getWidth());
			var iHeight: int = math.ceilingPowerOfTwo(pSource.getHeight());
			var iWebGLFormat:int = getClosestWebGLInternalFormat(pSource.format);
			var iWebGLDataType: int = getWebGLDataType(pSource.format);

			pTempWebGLTexture = pWebGLRenderer.createWebGLTexture();

			if(isNull(pTempWebGLTexture)){
				logger.error("Can not create WebGL texture");
				return false;
			}

			pWebGLRenderer.bindWebGLTexture(eTarget, pTempWebGLTexture);
			pWebGLContext.texImage2D(eTarget, 0, iWebGLFormat, iWidth, iHeight, 0, iWebGLFormat, iWebGLDataType, null);
			pWebGLRenderer.bindWebGLTexture(eTarget, null);
			
			var pTextureBufferPool: IResourcePool<IPixelBuffer> = this.getManager().getTextureBufferPool();
			var pTempTexBuffer: WebGLTextureBuffer = <WebGLTextureBuffer>pTextureBufferPool.createResource(".temp");
			// var pTempTexBuffer: WebGLTextureBuffer = <WebGLTextureBuffer>pTextureBufferPool.findResource(".temp");
			
			// if(isNull(pTextureBufferPool)){
			// 	pTempTexBuffer = <WebGLTextureBuffer>pTextureBufferPool.createResource(".temp");
			// }

			pTempTexBuffer.create(eTarget, pTempWebGLTexture, iWidth, iHeight, 
								  iWebGLFormat, pSource.format, 0, 0,
								  ETextureFlags.AUTOMIPMAP | EHardwareBufferFlags.STATIC,
								  false);

			// Upload data to 0,0,0 in temporary texture
			var pTempBoxTarget: IBox = new geometry.Box(0, 0, 0, pSource.getWidth(), pSource.getHeight(), pSource.getDepth());
			pTempTexBuffer.upload(pSource, pTempBoxTarget);

			//Blit
			this.blitFromTexture(pTempTexBuffer, pTempBoxTarget, pDestBox);
			
			//Delete temp data
			pTempTexBuffer.release();
			pTextureBufferPool.destroyResource(pTempTexBuffer);	        

			pWebGLRenderer.deleteWebGLTexture(pTempWebGLTexture);
			pTempWebGLTexture = null;
			pTempBoxTarget = null;

			return true;
		}

		getRenderTarget(): IRenderTarget;
		getRenderTarget(iZOffest: int): IRenderTarget;
		getRenderTarget(iZOffest: int = 0): IRenderTarget {
			logger.assert(bf.testAny(this._iFlags, ETextureFlags.RENDERTARGET));
			logger.assert(iZOffest < this._iDepth, "iZOffest: " + iZOffest + ", iDepth: " + this._iDepth);
			return this._pRTTList[iZOffest];
		}

		resize(iSize: uint): boolean;
		resize(iWidth: uint, iHeight: uint = iWidth): boolean {
			if(arguments.length === 1){
				logger.critical("resize with one parametr not available for WebGLTextureBuffer");
				return false;
			}
			var pSrcBox: IBox = geometry.Box.temp(0, 0, 0, this._iWidth, this._iHeight, this._iDepth);
			var pDestBox: IBox = geometry.Box.temp(0, 0, 0, iWidth, iHeight, this._iDepth);
			
			return this.blitFromTexture(this, pSrcBox, pDestBox);
		}

	}
}