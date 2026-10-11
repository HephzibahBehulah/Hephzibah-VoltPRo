/* Camera state is independent of physical board coordinates. */
(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.VoltProCameraController=api.CameraController;})(typeof globalThis!=="undefined"?globalThis:this,function(){
'use strict';
class CameraController{
 constructor(options={}){this.minZoom=options.minZoom??0.25;this.maxZoom=options.maxZoom??8;this.zoom=options.zoom??1;this.x=0;this.y=0;this.width=0;this.height=0;this.padding=options.padding??40;this.boardBounds=options.boardBounds??{x:-4,y:-6,width:165,height:55};}
 resize(width,height){this.width=Math.max(1,width);this.height=Math.max(1,height);this.clamp();return this;}
 worldToScreen(p){return {x:p.x*this.zoom+this.x,y:p.y*this.zoom+this.y};}
 screenToWorld(p){return {x:(p.x-this.x)/this.zoom,y:(p.y-this.y)/this.zoom};}
 fit(){const b=this.boardBounds,scale=Math.min((this.width-2*this.padding)/b.width,(this.height-2*this.padding)/b.height);this.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,scale));this.x=(this.width-b.width*this.zoom)/2-b.x*this.zoom;this.y=(this.height-b.height*this.zoom)/2-b.y*this.zoom;this.clamp();return this;}
 zoomAt(screenX,screenY,factor){const before=this.screenToWorld({x:screenX,y:screenY});this.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.zoom*factor));this.x=screenX-before.x*this.zoom;this.y=screenY-before.y*this.zoom;this.clamp();return this;}
 pan(dx,dy){this.x+=dx;this.y+=dy;this.clamp();return this;}
 clamp(){if(!this.width||!this.height)return;const b=this.boardBounds,z=this.zoom,bw=b.width*z,bh=b.height*z,minX=-(bw*(1-0.2))+20,maxX=this.width-20-b.x*z,minY=-(bh*(1-0.2))+20,maxY=this.height-20-b.y*z;this.x=Math.max(Math.min(minX,maxX),Math.min(Math.max(minX,maxX),this.x));this.y=Math.max(Math.min(minY,maxY),Math.min(Math.max(minY,maxY),this.y));}
 snapshot(){return {zoom:this.zoom,x:this.x,y:this.y,width:this.width,height:this.height};}
 restore(s){if(!s||!Number.isFinite(s.zoom)||!Number.isFinite(s.x)||!Number.isFinite(s.y))throw new TypeError('Invalid camera snapshot');this.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,s.zoom));this.x=s.x;this.y=s.y;this.clamp();return this;}
}
return {CameraController};
});