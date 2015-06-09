//(function($, window, document, undefined){
var utility = {
	randomNum: function(a, b){
		return a + Math.floor(Math.random() * (b - a));
	},
	randomColorNum: function(){
		return this.randomNum(0, 255);
	}
};
var DrawApp = function (){
		this.container = $("#main");
		this.boxButton = $("#boxButt");
		this.circleButton = $("#circleButt");
		this.sizeButton = $("#sizeButt");
		this.dropButton = $("#dropButt");
		this.menuButton = $("#menuButt");
		this.sliders = $(".slider");
		this.colorReadOut = $("#colorReadOut");
		this.deleteButton = $("#deleteButt");
		this.maskButton = $("#maskButt");
		this.redSlider = $("#redSlider");
		this.greenSlider = $("#greenSlider");
		this.blueSlider = $("#blueSlider");
		this.alphaSlider = $("#alphaSlider");
		this.shapeListHeader = $("#shapeListHeader");
		this.shapeBoxLogo = $("#shapeListHeaderImage");
		this.shapeList = $("#shapeList");
		this.sortToggleButton = $("#sortToggleButt");
		this.shapeListItem = $(".shapeListItem");
		this.playground = $("#playground");
		this.body = $("body");
		this.window = $(window);
		localStorage.playgroundState = localStorage.playgroundState || null;
		localStorage.shapeListState = localStorage.shapeListState || null;

		this.createSliders();
		this.attachEvents();
};

DrawApp.prototype = {			// vs $extend()
	attachEvents: function(){
		this.window.on("load", this.recallState.bind(this));
		this.window.on("click", this.windowClick.bind(this));
		this.boxButton.on("click", this.boxButtonClick.bind(this));
		this.circleButton.on("click", this.circleButtonClick.bind(this));
		this.sizeButton.on("click", this.sizeButtonClick.bind(this));
		this.menuButton.on("click", this.tooltipToggle);
		this.sliders.on("slide slidestop", {that: this}, this.slideSlider);
		this.deleteButton.on("click", this.deleteButtonClick.bind(this));
		this.maskButton.on("click", this.maskButtonClick.bind(this));
		this.shapeList.on("click", ".shapeListItem", {that: this}, this.shapeListItemClick);
		this.sortToggleButton.on("click", {that: this}, this.sortToggle);
		this.colorReadOut.on("click", this.applyToShapeName.bind(this));
		this.playground.on("click", ".shape", {that: this}, this.playgroundShapeClick);
		this.playground.on("dragstop", ".shape", {that: this}, this.dragPos);
		this.playground.on("resizestop", {that: this}, this.shapeResizeStop);
		this.shapeList.sortable({disabled: true, cancel: ".fixed", update: this.updateList.bind(this)});
		this.shapeList.on("sortstop", this.arrangeShapes.bind(this));
		this.shapeBoxLogo.on("click", this.saveCurrentState.bind(this));
		$(document).tooltip({tooltipClass: "tooltip"});
	},
	saveCurrentState: function(){
		localStorage.playgroundState = JSON.stringify(this.playground.html());
		localStorage.shapeListState = JSON.stringify(this.shapeList.html());
	},
	recallState: function(){
		var prePlaygroundState = JSON.parse(localStorage.playgroundState),
			preListState = JSON.parse(localStorage.shapeListState);
		this.playground.html(prePlaygroundState);
		this.shapeList.html(preListState);
		this.playground.find(".shape")
			.draggable()
			.resizable();
	},
	createSliders: function(){
		this.sliders.slider({
			max: 255,
			min: 0,
			orientation: "vertical", 
			stop: this.slid, // figure out how to include event data with this.
			animate: "fast"
			});
		this.alphaSlider.slider({max: 100, min: 5});
	},
	sliderSet: function(color, colorLabel, alpha){
		this.redSlider.slider("value", color[0]);
		this.greenSlider.slider("value", color[1]);
		this.blueSlider.slider("value", color[2]);
		this.alphaSlider.slider("value", alpha);
		var colorLabel = colorLabel && colorLabel.toLowerCase();
		this.colorReadOut.text(colorLabel);

	},
	slideSlider: function(event, ui){
		var that = event.data.that,
		    red = that.redSlider.slider("value"),
		    green = that.greenSlider.slider("value"),
		    blue = that.blueSlider.slider("value"),
		    color = [red, green, blue],
		    colorLabel = window.classifier.classify(color).toLowerCase(),
		    alpha = that.alphaSlider.slider("value") / 100,
		    $recent = $(".recent");
		
		$recent.css("background-color", "rgb(" + color + ")");
		$recent.css("opacity", alpha);
		if(event.type === "slidestop"){	
			that.colorReadOut.text(colorLabel);
		}
	},
	addShapeListItem: function(name, identity){
		var listItem = $("<li />").prependTo(this.shapeList);

		$("<input />", {
			"id" : identity.replace(/-el-/g, "-li-"),
			"class" : "shapeListItem selection",
			"type": "text",
			"value" : name 
		}).appendTo(listItem);

		  listItem.hide().slideDown(300);
	},
	createShape: function(shape, roundness){
		$(".recent").removeClass("recent");
		$(".selection").removeClass("selection");
		var shapeSize = 7, 
			r = utility.randomColorNum(),
		    g = utility.randomColorNum(),
		    b = utility.randomColorNum(),
		    color = [r, g, b],
		    colorLabel = window.classifier.classify(color),
		    shapeCount = this.playground.find($(".shape")).length,
		    name = colorLabel + " " + shape,
		    identity = shape + "-el-" + shapeCount,
		    bordRad = roundness || .2;

		var element = $("<div />", {
				"id": identity, 
				"class": "shape selection recent " + shape,
				"title": name
				}).appendTo(this.playground)
			  	  .css({
			  	  	backgroundColor: "rgb(" + color + ")",
			  		position: "absolute",
			  		top: "38.5vw",
			  		left: "1.2vw",
			  		width: shapeSize + "vw",
			  		height: shapeSize + "vw",
			  		borderRadius: bordRad + "vw"})
			  	  .draggable({scroll: false})
			  	  .resizable({disabled: true});
		this.sliderSet([r, g, b], colorLabel, 100);
		this.addShapeListItem(name, identity);
	},
	getListItemId: function(shape){
		return shape.attr("id").replace(/el/, "li");
	},
	shapeSelect: function(shape){
		var color = shape.css("background-color").match(/\d+/g),
		    colorLabel = window.classifier.classify(color),
		    alpha = shape.css("opacity") * 100,
		    itemId = this.getListItemId(shape),
		    refListItem = this.shapeList.find(".shapeListItem[id=" + itemId + "]");

		if(!event.shiftKey){
			$(".selection").removeClass("selection");
		}
		refListItem.addClass("selection");
		shape.toggleClass("selection");
		shape.resizable({disabled: true})
			 .removeClass("resizable");
		$(".recent").removeClass("recent");
		shape.addClass("recent");
		this.sliderSet(color, colorLabel, alpha );
	},
	playgroundShapeClick: function(event){
		var that = event.data.that,
		    shape = $(this);
		
		that.shapeSelect(shape);
	},
	shapeListItemClick: function(event){
		var $this = $(this),
		    that = event.data.that,
		    shapeId = $this.attr("id").replace(/li/, "el"),
		    refShape = $(that.playground).find(".shape[id=" + shapeId + "]");

		that.shapeSelect(refShape);
		$this.addClass("selection");
		$this.focusout(function(){
		var reName = $this.val();
		refShape.attr("title", reName);
		});
	},
	applyToShapeName: function(event){
		var shape = $(".recent"),
			listItem = $(this.shapeList.find(".shapeListItem[id=" + this.getListItemId(shape) + "]")),
			name = $(event.target).text();
			shape.attr({title: name});
			listItem.val(name);
	},
	shapeResizeStop: function(event, ui){
		var viewWidth = event.data.that.window.width(),
			$this = $(event.target),
			widthUpdate = (($this.width() / viewWidth) * 100) + "vw",
			heightUpdate = (($this.height() / viewWidth) * 100) + "vw";
		$this.width(widthUpdate);
		$this.height(heightUpdate);
	},
	dragPos: function(event, ui){
		var that = event.data.that;
		    viewWidth = that.window.width(),
		    topPos = ((ui.position.top / viewWidth) * 100) + "vw",
		    leftPos = ((ui.position.left / viewWidth) * 100) + "vw";
		$(this).css({top: topPos, left: leftPos});
	},
	updateList: function(event, ui){
		this.playground.find(".shape").sort(function(a, b){return a - b});
	},
	deselectAll: function(){
	 	$(".selection.shape").resizable({disabled: true});
	 	$(".selection").removeClass("selection");
		$(".resizable").removeClass("resizable");
		$(".recent").removeClass("recent");
		this.sliderSet([0, 0, 0], null, 0);
	},
	windowClick: function(event){
		var clickTarget = event.target.id,
			clicklist = ["", "playground", "shapeBoxLogo", "shapeListContainer"];
		if(clicklist.some(function(x){return x === clickTarget;})){ 
		this.deselectAll();
	  }
	  console.log(clickTarget);
	},
	boxButtonClick: function(){
		this.createShape("box");
	},
	circleButtonClick: function(){
		this.createShape("circle", 50);
	},
	sizeButtonClick: function(){
		var $selection = $(".selection.shape");
		if($selection.resizable("option", "disabled")){
			$selection
				.resizable("option", "disabled", false)
				.addClass("resizable");
		} else {
			$selection
				.resizable("option", "disabled", true)
				.removeClass("resizable");
		}
	},
	deleteButtonClick: function(){
		$(".shape.selection").remove();
		$(".shapeListItem.selection").parent().slideUp(300);
		this.sliderSet([0, 0, 0], null, 0);
	},
	maskButtonClick: function(){
		this.playground.toggleClass("pgMask");
		this.body.toggleClass("bodyMask");
	},
	sortToggle: function(event){
		var that = event.data.that;
		if(that.shapeList.sortable("option", "disabled")){
			that.shapeList.sortable({disabled: false});
		} else {
			that.shapeList.sortable({disabled: true});
		}
		$(this).toggleClass("rotate90");
	},
	arrangeShapes: function(){
		var list = this.shapeList.find(".shapeListItem");
		for (var i = 0; i < list.length; i++){
			var shapeId = $(list[i]).attr("id").replace(/li/, "el"),
				shape = this.playground.find(".shape[id=" + shapeId + "]");
			shape.insertAfter("#blank");
		}
	}
};

var draw;
$(document).ready(function(){
	draw = new DrawApp();
});

//})(jQuery, window, document);

