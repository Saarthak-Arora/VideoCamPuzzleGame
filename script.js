let VIDEO=null;
let CANVAS=null;
let CONTEXT=null;
let SCALER=0.6;
let SIZE={x:0,y:0,width:0,height:0,rows:3,columns:3};
let PIECES=[];
let SELECTED_PIECE=null;
let START_TIME=null;
let END_TIME=null;

let POP_SOUND=new Audio('pop.mp3');
POP_SOUND.volume=0.1;

let END_SOUND=new Audio('endsound.mp3');
POP_SOUND.volume=0.2;





// initializing the canvas settion up the video on
// setting the size , piece and start the game

function main(){
	CANVAS=document.getElementById("myCanvas");
	CONTEXT=CANVAS.getContext("2d");

	addEventListeners();  // this function calls for any ouse event on the screen
	
	let promise=navigator.mediaDevices.getUserMedia({
		video:true
	});
	promise.then(function(signal){
		VIDEO=document.createElement("video");
		VIDEO.srcObject=signal;
		VIDEO.play();
		
		VIDEO.onloadeddata=function(){			
			handleResize();   // 1) resize the vidoe box
			//window.addEventListener('resize',handleResize);
			initializePieces(SIZE.rows,SIZE.columns);   // 2) setting up the piece out of the video
			updateGame();  // 3) start the game 
		}
	}).catch(function(err){
		alert("Camera error: "+err);
	});
}

function setDifficulty(){
	let diff=document.getElementById("difficulty").value;
	switch(diff){
		case "easy":
			initializePieces(3,3);
			break;
		case "medium":
			initializePieces(5,5);
			break;
		case "hard":
			initializePieces(10,10);
			break;
		case "insane":
			initializePieces(40,25);
			break;
	}
}

function restart(){
	START_TIME=new Date().getTime();
	END_TIME=null;
	randomizePieces();
	document.getElementById("menuItems").style.visibility='hidden';
}

function updateTime(){
	let now=new Date().getTime();
	if(START_TIME!=null){
		if(END_TIME!=null){
			document.getElementById("time").style.visibility="hidden";
			document.getElementById("menuItems").style.visibility='visible';
			document.getElementById("timeS").innerHTML  = formatTime(END_TIME-START_TIME);
		}else{
			document.getElementById("time").innerHTML=
			formatTime(now-START_TIME);
		}
	}

	
}

function isComplete(){
	for(let i=0;i<PIECES.length;i++){
		if(PIECES[i].correct==false){
			return false;
		}
	}
  
	return true;
}

function formatTime(milliseconds){
	let seconds=Math.floor(milliseconds/1000);
	let s=Math.floor(seconds%60);
	let m=Math.floor((seconds%(60*60))/60);
	let h=Math.floor((seconds%(60*60*24))/(60*60));
	
	let formattedTime=h.toString().padStart(2,'0');
	formattedTime+=":";
	formattedTime+=m.toString().padStart(2,'0');
	formattedTime+=":";
	formattedTime+=s.toString().padStart(2,'0');
	
	return formattedTime;
}

function addEventListeners(){
	CANVAS.addEventListener("mousedown",onMouseDown);
	CANVAS.addEventListener("mousemove",onMouseMove);
	CANVAS.addEventListener("mouseup",onMouseUp);
	CANVAS.addEventListener("touchstart",onTouchStart);
	CANVAS.addEventListener("touchmove",onTouchMove);
	CANVAS.addEventListener("touchend",onTouchEnd);
}

function onTouchStart(evt){
	let loc={x:evt.touches[0].clientX,
		y:evt.touches[0].clientY};
	onMouseDown(loc);
}
function onTouchMove(evt){
	let loc={x:evt.touches[0].clientX,
		y:evt.touches[0].clientY};
	onMouseMove(loc);
}
function onTouchEnd(){
	onMouseUp();
}

function onMouseDown(evt){
	SELECTED_PIECE=getPressedPiece(evt);
	if(SELECTED_PIECE!=null){
		const index=PIECES.indexOf(SELECTED_PIECE);
		if(index>-1){
			PIECES.splice(index,1);
			PIECES.push(SELECTED_PIECE);
		}
		SELECTED_PIECE.offset={
			x:evt.x-SELECTED_PIECE.x,
			y:evt.y-SELECTED_PIECE.y
		}
		SELECTED_PIECE.correct=false;
	}
}

function onMouseMove(evt){
	if(SELECTED_PIECE!=null){
		SELECTED_PIECE.x=evt.x-SELECTED_PIECE.offset.x;
		SELECTED_PIECE.y=evt.y-SELECTED_PIECE.offset.y;
	}
}

function onMouseUp(){
	if(SELECTED_PIECE && SELECTED_PIECE.isClose()){
		SELECTED_PIECE.snap();
		if(isComplete() && END_TIME==null){
            END_SOUND.play();
			let now=new Date().getTime();
			END_TIME=now;
			
		}
	}
	SELECTED_PIECE=null;
}

function getPressedPiece(loc){
	for(let i=PIECES.length-1;i>=0;i--){
		if(loc.x>PIECES[i].x && loc.x<PIECES[i].x+PIECES[i].width &&
			loc.y>PIECES[i].y && loc.y<PIECES[i].y+PIECES[i].height){
				return PIECES[i];
		}
	}
	return null;
}







function handleResize(){
	CANVAS.width=window.innerWidth;
	CANVAS.height=window.innerHeight;
	
	let resizer=SCALER*
				Math.min(
					window.innerWidth/VIDEO.videoWidth,
					window.innerHeight/VIDEO.videoHeight
				);
	SIZE.width=resizer*VIDEO.videoWidth;
	SIZE.height=resizer*VIDEO.videoHeight;
	SIZE.x=window.innerWidth/2-SIZE.width/2;
	SIZE.y=window.innerHeight/2-SIZE.height/2;
}

function updateGame(){
	CONTEXT.clearRect(0,0,CANVAS.width,CANVAS.height);
	
	CONTEXT.globalAlpha=0.5;
	CONTEXT.drawImage(VIDEO,
		SIZE.x, SIZE.y,
		SIZE.width, SIZE.height);	
	CONTEXT.globalAlpha=1;
	
	for(let i=0;i<PIECES.length;i++){
		PIECES[i].draw(CONTEXT);
	}
	
	updateTime();
	window.requestAnimationFrame(updateGame);
}

function initializePieces(rows,cols){
	SIZE.rows=rows;
	SIZE.columns=cols;
	
	PIECES=[];
	for(let i=0;i<SIZE.rows;i++){
		for(let j=0;j<SIZE.columns;j++){
			PIECES.push(new Piece(i,j));
		}
	}
	
	let cnt=0;
	for(let i=0;i<SIZE.rows;i++){
		for(let j=0;j<SIZE.columns;j++){
			const piece=PIECES[cnt];
			if(i==SIZE.rows-1){
				piece.bottom=null;
			}else{
				const sgn=(Math.random()-0.5)<0?-1:1;
				piece.bottom=sgn*(Math.random()*0.4+0.3);
			}
			
			if(j==SIZE.columns-1){
				piece.right=null;
			}else{
				const sgn=(Math.random()-0.5)<0?-1:1;
				piece.right=sgn*(Math.random()*0.4+0.3);
			}
			
			if(j==0){
				piece.left=null;
			}else{
				piece.left=-PIECES[cnt-1].right;
			}
			
			if(i==0){
				piece.top=null;
			}else{
				piece.top=-PIECES[cnt-SIZE.columns].bottom;
			}
			
			cnt++;
		}
	}
}

function randomizePieces(){
	for(let i=0;i<PIECES.length;i++){
		let loc={
			x:Math.random()*(CANVAS.width-PIECES[i].width),
			y:Math.random()*(CANVAS.height-PIECES[i].height)
		}
		PIECES[i].x=loc.x;
		PIECES[i].y=loc.y;
		PIECES[i].correct=false;
	}
}

class Piece{
	constructor(rowIndex,colIndex){
		this.rowIndex=rowIndex;
		this.colIndex=colIndex;
		this.x=SIZE.x+SIZE.width*this.colIndex/SIZE.columns;
		this.y=SIZE.y+SIZE.height*this.rowIndex/SIZE.rows;
		this.width=SIZE.width/SIZE.columns;
		this.height=SIZE.height/SIZE.rows;
		this.xCorrect=this.x;
		this.yCorrect=this.y;
		this.correct=true;
	}
	draw(context){
		context.beginPath();
		
		const sz=Math.min(this.width,this.height);
		const neck=0.05*sz;
		const tabWidth=0.3*sz;
		const tabHeight=0.3*sz;
		
		//context.rect(this.x,this.y,this.width,this.height);
		//from top left
		context.moveTo(this.x,this.y);
		//to top right
		if(this.top){
			context.lineTo(this.x+this.width*Math.abs(this.top)-neck,
			this.y);
			context.bezierCurveTo(
				this.x+this.width*Math.abs(this.top)-neck,
				this.y-tabHeight*Math.sign(this.top)*0.2,
				
				this.x+this.width*Math.abs(this.top)-tabWidth,
				this.y-tabHeight*Math.sign(this.top),
				
				this.x+this.width*Math.abs(this.top),
				this.y-tabHeight*Math.sign(this.top)
			);
			
			context.bezierCurveTo(
				this.x+this.width*Math.abs(this.top)+tabWidth,
				this.y-tabHeight*Math.sign(this.top),
				
				this.x+this.width*Math.abs(this.top)+neck,
				this.y-tabHeight*Math.sign(this.top)*0.2,
				
				this.x+this.width*Math.abs(this.top)+neck,
				this.y
			);
		}
		context.lineTo(this.x+this.width,this.y);
		
		//to bottom right
		if(this.right){
			context.lineTo(this.x+this.width,this.y+this.height*Math.abs(this.right)-neck);
			context.bezierCurveTo(
				this.x+this.width-tabHeight*Math.sign(this.right)*0.2,
				this.y+this.height*Math.abs(this.right)-neck,
				
				this.x+this.width-tabHeight*Math.sign(this.right),
				this.y+this.height*Math.abs(this.right)-tabWidth,
				
				this.x+this.width-tabHeight*Math.sign(this.right),
				this.y+this.height*Math.abs(this.right)
			);
			context.bezierCurveTo(
				this.x+this.width-tabHeight*Math.sign(this.right),
				this.y+this.height*Math.abs(this.right)+tabWidth,
			
				this.x+this.width-tabHeight*Math.sign(this.right)*0.2,
				this.y+this.height*Math.abs(this.right)+neck,
				
				this.x+this.width,
				this.y+this.height*Math.abs(this.right)+neck
			);
		}
		context.lineTo(this.x+this.width,this.y+this.height);
		
		//to bottom left
		if(this.bottom){
			context.lineTo(this.x+this.width*Math.abs(this.bottom)+neck,
			this.y+this.height)
			
			context.bezierCurveTo(
				this.x+this.width*Math.abs(this.bottom)+neck,
				this.y+this.height+tabHeight*Math.sign(this.bottom)*0.2,
				
				this.x+this.width*Math.abs(this.bottom)+tabWidth,
				this.y+this.height+tabHeight*Math.sign(this.bottom),
				
				this.x+this.width*Math.abs(this.bottom),
				this.y+this.height+tabHeight*Math.sign(this.bottom)
			);
			
			context.bezierCurveTo(
				this.x+this.width*Math.abs(this.bottom)-tabWidth,
				this.y+this.height+tabHeight*Math.sign(this.bottom),
			
				this.x+this.width*Math.abs(this.bottom)-neck,
				this.y+this.height+tabHeight*Math.sign(this.bottom)*0.2,
				
				this.x+this.width*Math.abs(this.bottom)-neck,
				this.y+this.height
			);
		}
		context.lineTo(this.x,this.y+this.height);
		
		//to top left
		if(this.left){
			context.lineTo(this.x,this.y+this.height*Math.abs(this.left)+neck);
			
			context.bezierCurveTo(
				this.x+tabHeight*Math.sign(this.left)*0.2,
				this.y+this.height*Math.abs(this.left)+neck,
				
				this.x+tabHeight*Math.sign(this.left),
				this.y+this.height*Math.abs(this.left)+tabWidth,
				
				this.x+tabHeight*Math.sign(this.left),
				this.y+this.height*Math.abs(this.left)
			);
			
			context.bezierCurveTo(
				this.x+tabHeight*Math.sign(this.left),
				this.y+this.height*Math.abs(this.left)-tabWidth,
			
				this.x+tabHeight*Math.sign(this.left)*0.2,
				this.y+this.height*Math.abs(this.left)-neck,
				
				this.x,
				this.y+this.height*Math.abs(this.left)-neck
			);
		}
		context.lineTo(this.x,this.y);
		
		context.save();
		context.clip();
		
		const scaledTabHeight=
			Math.min(VIDEO.videoWidth/SIZE.columns,
				VIDEO.videoHeight/SIZE.rows)*tabHeight/sz;
		
		context.drawImage(VIDEO,
			this.colIndex*VIDEO.videoWidth/SIZE.columns
				-scaledTabHeight,
			this.rowIndex*VIDEO.videoHeight/SIZE.rows
				-scaledTabHeight,
			VIDEO.videoWidth/SIZE.columns
				+scaledTabHeight*2,
			VIDEO.videoHeight/SIZE.rows
				+scaledTabHeight*2,
			this.x-tabHeight,
			this.y-tabHeight,
			this.width+tabHeight*2,
			this.height+tabHeight*2);
		
		context.restore();
		
		context.stroke();
	}
	isClose(){
		if(distance({x:this.x,y:this.y},
			{x:this.xCorrect,y:this.yCorrect})<this.width/3){
				return true;
		}
		return false;
	}
	snap(){
		this.x=this.xCorrect;
		this.y=this.yCorrect;
		this.correct=true;
		POP_SOUND.play();
	}
}

function distance(p1,p2){
	return Math.sqrt(
		(p1.x-p2.x)*(p1.x-p2.x)+
		(p1.y-p2.y)*(p1.y-p2.y));
}
